"""Run against the configured local MySQL, never against production."""
import concurrent.futures
import http.cookiejar
import json
import os
import secrets
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


class Client:
    def __init__(self, port):
        self.base = f"http://localhost:{port}"
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def call(self, method, path, payload=None, headers=None):
        token = next((urllib.parse.unquote(c.value) for c in self.jar if c.name == "XSRF-TOKEN"), "")
        request = urllib.request.Request(self.base + path,
            data=json.dumps(payload).encode() if payload is not None else None,
            method=method, headers={"Accept": "application/json", "Content-Type": "application/json",
                "Origin": self.base, "X-XSRF-TOKEN": token, **(headers or {})})
        try:
            with self.opener.open(request, timeout=20) as response:
                body = response.read()
                return response.status, json.loads(body) if body else {}
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"{method} {path}: {error.code} {error.read().decode()}") from error


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    servers = []
    first = second = None
    fixture_id = None
    password = secrets.token_urlsafe(32)
    php = os.environ.get("PHP_BINARY", "php")

    def fixture(action, payload=None, user_id=None):
        arguments = [php, "artisan", "integration:mysql-fixture", action, "--no-interaction"]
        if user_id is not None:
            arguments.append(f"--user-id={user_id}")
        result = subprocess.run(arguments, input=json.dumps(payload) if payload else "",
            capture_output=True, text=True, check=False)
        if result.returncode != 0:
            raise RuntimeError("Fixture refused or failed. Confirm APP_ENV=testing, local host, "
                "and DB_DATABASE=sneakers_test_<12-32 hex characters>. No normal database is allowed.")
        return json.loads(result.stdout) if result.stdout.strip() else None
    email = f"concurrency-{uuid.uuid4().hex}@example.test"
    fixture("inspect")
    try:
        fixture_id = fixture("create", {"email": email, "password": password})["id"]
        for port in (18131, 18132):
            servers.append(subprocess.Popen(
                [php, "-d", "opcache.enable=0", "-S", f"localhost:{port}", "-t", "public", "public/index.php"],
                env={**os.environ, "SANCTUM_STATEFUL_DOMAINS": "localhost:18131,localhost:18132"},
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)))
        first, second = Client(18131), Client(18132)
        for server, client in zip(servers, (first, second)):
            for attempt in range(50):
                check(server.poll() is None, "Test server failed to start; port may be in use")
                try:
                    client.call("GET", "/sanctum/csrf-cookie")
                    break
                except (urllib.error.URLError, ConnectionError):
                    time.sleep(0.2)
            else:
                raise RuntimeError("Server failed to start")
        first.call("POST", "/api/v1/auth/login", {"email": email, "password": password})
        second.call("POST", "/api/v1/auth/login", {"email": email, "password": password})
        addresses = []
        for number in ("1", "2"):
            _, result = first.call("POST", "/api/v1/addresses", {"type": "home",
                "postal_code": "01234-567", "street": "Test", "number": number,
                "district": "Centro", "city": "Sao Paulo", "state": "SP"})
            addresses.append(result["data"]["id"])

        def simultaneous(left, right):
            barrier = threading.Barrier(2)
            def execute(call):
                barrier.wait(timeout=10)
                return call()
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                return [future.result() for future in (pool.submit(execute, left), pool.submit(execute, right))]

        for _ in range(10):
            simultaneous(
                lambda: first.call("PUT", f"/api/v1/addresses/{addresses[0]}/default"),
                lambda: second.call("PUT", f"/api/v1/addresses/{addresses[1]}/default"))
            _, result = first.call("GET", "/api/v1/addresses")
            check(sum(bool(a["is_default"]) for a in result["data"]) == 1,
                  "simultaneous changes created an invalid default address")

        _, products = first.call("GET", "/api/v1/products")
        first.call("POST", "/api/v1/cart/items", {"product_id": products["data"][0]["id"], "quantity": 1})
        payload = {"address_id": addresses[0], "shipping_method": "blue", "payment_method": "wallet"}
        headers = {"Idempotency-Key": "concurrency-" + uuid.uuid4().hex}
        responses = simultaneous(
            lambda: first.call("POST", "/api/v1/checkout", payload, headers),
            lambda: second.call("POST", "/api/v1/checkout", payload, headers))
        check(responses[0][1]["data"]["id"] == responses[1][1]["data"]["id"],
              "simultaneous checkout requests produced different orders")
        _, orders = first.call("GET", "/api/v1/orders")
        check(len(orders["data"]) == 1, "simultaneous checkout created duplicate orders")
        _, cart = first.call("GET", "/api/v1/cart")
        check(len(cart["data"]) == 0, "cart was not cleared")
        print("PASS: 10 concurrent default-address pairs and concurrent idempotent checkout against MySQL")
    finally:
        try:
            if fixture_id is not None:
                fixture("cleanup", user_id=fixture_id)
        finally:
            for server in servers:
                server.terminate()
                server.wait(timeout=10)


if __name__ == "__main__":
    main()
