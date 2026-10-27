<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

#[Signature('integration:mysql-fixture {action : inspect, create or cleanup} {--user-id=}')]
#[Description('Manage a verified fixture only in an isolated local MySQL test database')]
class MysqlIntegrationFixture extends Command
{
    public function handle(): int
    {
        $connection = DB::connection();
        $database = $connection->getDatabaseName();

        if (! app()->environment('testing') || $connection->getDriverName() !== 'mysql'
            || ! in_array($connection->getConfig('host'), ['127.0.0.1', 'localhost', '::1'], true)
            || preg_match('/^sneakers_test_[a-f0-9]{12,32}$/D', $database) !== 1) {
            $this->error('Refusing integration fixture: use APP_ENV=testing and a local MySQL database named sneakers_test_<12-32 hex characters>.');

            return self::FAILURE;
        }

        $action = $this->argument('action');

        if ($action === 'inspect') {
            $this->line(json_encode(['database' => $database, 'host' => $connection->getConfig('host')], JSON_THROW_ON_ERROR));

            return self::SUCCESS;
        }

        if ($action === 'create') {
            /** @var array<string, mixed> $input */
            $input = json_decode((string) stream_get_contents(STDIN), true, flags: JSON_THROW_ON_ERROR);
            $validated = Validator::make($input, [
                'email' => ['required', 'email', 'regex:/^concurrency-[a-f0-9]{32}@example\\.test$/D'],
                'password' => ['required', 'string', 'min:32'],
            ])->validate();
            $user = User::factory()->create([
                'email' => $validated['email'],
                'password' => $validated['password'],
                'email_verified_at' => now(),
            ]);
            $this->line(json_encode(['id' => $user->id], JSON_THROW_ON_ERROR));

            return self::SUCCESS;
        }

        if ($action === 'cleanup') {
            User::query()->whereKey($this->option('user-id'))
                ->where('email', 'like', 'concurrency-%@example.test')->delete();

            return self::SUCCESS;
        }

        $this->error('Unknown fixture action.');

        return self::FAILURE;
    }
}
