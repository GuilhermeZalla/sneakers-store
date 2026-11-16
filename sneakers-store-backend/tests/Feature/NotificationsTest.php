<?php

use App\Mail\StoreMessage;
use App\Models\Address;
use App\Models\CartItem;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Notifications\ResetStorePassword;
use App\Notifications\StoreNotification;
use App\Notifications\VerifyStoreEmail;
use App\Services\CartService;
use App\StoreLocale;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Queue;

test('registration stores locale and sends welcome and verification without credentials', function (string $locale) {
    Notification::fake();
    $this->postJson(route('register.store'), [
        'name' => 'Alex Demo', 'email' => 'alex@example.test', 'password' => 'PrivatePassword-123!',
        'password_confirmation' => 'PrivatePassword-123!', 'phone' => '11999990000',
        'birthday' => '1995-05-15', 'gender' => 'not_informed', 'locale' => $locale,
    ])->assertCreated();
    $user = User::where('email', 'alex@example.test')->firstOrFail();
    expect($user->locale)->toBe($locale)->and($user->email_verified_at)->toBeNull();
    Notification::assertSentTo($user, StoreNotification::class, fn ($n) => $n->event === 'welcome');
    Notification::assertSentTo($user, VerifyStoreEmail::class);
    $mail = (new StoreNotification('welcome'))->toMail($user);
    $mail->assertSeeInHtml('Alex Demo')->assertSeeInHtml('alex@example.test')
        ->assertDontSeeInHtml('PrivatePassword-123!')->assertDontSeeInText('PrivatePassword-123!');
})->with(['en', 'pt_BR']);

test('mail and database channels always use an encrypted durable queue even when default is sync', function () {
    Queue::fake();
    config(['queue.default' => 'sync']);
    $user = User::factory()->create();
    foreach ([new StoreNotification('welcome'), new VerifyStoreEmail, new ResetStorePassword('secret-reset-token')] as $notification) {
        expect($notification)->toBeInstanceOf(ShouldBeEncrypted::class);
        $user->notify($notification);
    }
    Queue::assertPushed(SendQueuedNotifications::class, 6);
    Queue::assertPushed(SendQueuedNotifications::class, fn ($job) => $job->connection === 'database' && $job->afterCommit === true);
    Mail::fake();
    Mail::assertNothingSent();
    $this->assertDatabaseCount('notifications', 0);
});
test('welcome email is bilingual and has styled HTML and plain text', function (string $locale, string $subject) {
    Mail::fake();
    $user = User::factory()->create(['name' => 'Alex Demo', 'locale' => $locale]);
    $message = (new StoreNotification('welcome'))->toMail($user);
    Mail::send($message);
    Mail::assertSent(StoreMessage::class, fn ($mail) => $mail->hasTo($user->email) && $mail->envelope()->subject === $subject);
    $message->assertSeeInHtml('#ff9e43')->assertSeeInText('Alex Demo')->assertSeeInText($user->email)
        ->assertDontSeeInHtml($user->password)->assertDontSeeInText($user->password);
})->with([['en', 'Welcome to Sneakers!'], ['pt_BR', 'Boas-vindas à Sneakers!']]);

test('notifications are paginated and only the owner may read or mark them', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    for ($i = 0; $i < 17; $i++) {
        $owner->notifyNow(new StoreNotification('welcome'), ['database']);
    }
    $other->notifyNow(new StoreNotification('welcome'), ['database']);
    $notification = $owner->notifications()->firstOrFail();
    $foreign = $other->notifications()->firstOrFail();
    $this->getJson(route('notifications.index'))->assertUnauthorized();
    $this->actingAs($owner)->getJson(route('notifications.index'))->assertOk()->assertJsonCount(15, 'data')->assertJsonPath('meta.total', 17);
    $this->getJson(route('notifications.index', ['page' => 2]))->assertOk()->assertJsonCount(2, 'data');
    $this->getJson(route('notifications.show', $foreign))->assertForbidden();
    $this->patchJson(route('notifications.read', $foreign))->assertForbidden();
    $this->getJson(route('notifications.count'))->assertJsonPath('data.unread_count', 17);
    $this->patchJson(route('notifications.read', $notification))->assertNoContent();
    $this->patchJson(route('notifications.read', $notification))->assertNoContent();
    $this->getJson(route('notifications.count'))->assertJsonPath('data.unread_count', 16);
    $this->patchJson(route('notifications.read-all'))->assertNoContent();
    $this->getJson(route('notifications.count'))->assertJsonPath('data.unread_count', 0);
    expect($foreign->fresh()->read_at)->toBeNull();
});
test('database security messages never include reset tokens or signed verification URLs', function () {
    $user = User::factory()->unverified()->create();
    $token = Password::broker()->createToken($user);
    foreach ([new ResetStorePassword($token), new VerifyStoreEmail] as $notification) {
        $user->notifyNow($notification, ['database']);
    }
    $payload = json_encode($user->notifications()->get()->toArray());
    $this->assertDatabaseCount('notifications', 2);
    expect($payload)->not->toContain($token)->not->toContain('signature=')->not->toContain($user->password);
});
test('only a successful password change sends a security notice', function () {
    Notification::fake();
    $user = User::factory()->create();
    $payload = ['current_password' => 'wrong', 'password' => 'ChangedPassword-123!', 'password_confirmation' => 'ChangedPassword-123!'];
    $this->actingAs($user)->putJson(route('user-password.update'), $payload)->assertUnprocessable();
    Notification::assertNothingSent();
    $this->putJson(route('user-password.update'), [...$payload, 'current_password' => 'password'])->assertNoContent();
    Notification::assertSentTo($user, StoreNotification::class, fn ($n) => $n->event === 'password_changed');
});
test('checkout confirmation is not duplicated by idempotent retries and status changes notify the owner', function () {
    Notification::fake();
    $user = User::factory()->create();
    $address = Address::factory()->create(['user_id' => $user->id]);
    CartItem::factory()->create(['user_id' => $user->id]);
    $payload = ['address_id' => $address->id, 'shipping_method' => 'blue', 'payment_method' => 'wallet'];
    $this->actingAs($user)->withHeader('Idempotency-Key', 'notification-checkout-123')
        ->postJson('/api/v1/checkout', $payload)->assertCreated();
    $this->postJson('/api/v1/checkout', $payload)->assertOk();
    Notification::assertSentToTimes($user, StoreNotification::class, 1);
    $order = $user->orders()->firstOrFail();
    $order->update(['status' => 'shipped']);
    $order->update(['status' => 'shipped']);
    Notification::assertSentToTimes($user, StoreNotification::class, 2);
    Notification::assertSentTo($user, StoreNotification::class, fn ($n) => $n->event === 'order_status' && $n->status === 'shipped');
});
test('order email contains snapshots totals currency and delivery address', function () {
    $item = OrderItem::factory()->create();
    $order = $item->order->load('items', 'user');
    $mail = (new StoreNotification('order_confirmed', $order))->toMail($order->user);
    $mail->assertSeeInHtml($item->product_name)->assertSeeInText($item->product_name)
        ->assertSeeInText($order->shipping_street)->assertSeeInHtml($order->currency)->assertSeeInText('115.07');
});
test('rolled back changes do not leave queued mail or internal notifications', function () {
    $user = User::factory()->create();
    $before = DB::table('jobs')->count();
    DB::beginTransaction();
    $user->notify(new StoreNotification('welcome'));
    DB::rollBack();
    expect(DB::table('jobs')->count())->toBe($before);
    $this->assertDatabaseCount('notifications', 0);
});
test('users can persist only supported notification languages for their own account', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $this->actingAs($owner)->patchJson(route('profile.locale'), ['locale' => 'pt_BR', 'user_id' => $other->id])->assertOk()->assertJsonPath('data.locale', 'pt_BR');
    expect($other->fresh()->locale)->toBe('en');
    $this->patchJson(route('profile.locale'), ['locale' => 'fr'])->assertUnprocessable();
});

test('expired reset jobs are discarded before either delivery channel', function () {
    $user = User::factory()->create();
    $token = Password::broker()->createToken($user);
    $notification = new ResetStorePassword($token);
    expect($notification->shouldSend($user, 'mail'))->toBeTrue();
    $this->travel(16)->minutes();
    expect($notification->shouldSend($user, 'mail'))->toBeFalse()->and($notification->shouldSend($user, 'database'))->toBeFalse();
});

test('notification removal is authenticated owner scoped and clearing read preserves unread records', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    foreach ([$owner, $owner, $other] as $user) {
        $user->notifyNow(new StoreNotification('welcome'), ['database']);
    }
    $owned = $owner->notifications()->get();
    $read = $owned[0];
    $unread = $owned[1];
    $read->markAsRead();
    $foreign = $other->notifications()->firstOrFail();
    $foreign->markAsRead();
    $this->deleteJson(route('notifications.destroy', $unread))->assertUnauthorized();
    $this->deleteJson(route('notifications.clear-read'))->assertUnauthorized();
    $this->actingAs($owner)->deleteJson(route('notifications.destroy', $foreign))->assertForbidden();
    $this->deleteJson(route('notifications.clear-read'))->assertNoContent();
    $this->assertDatabaseMissing('notifications', ['id' => $read->id]);
    $this->assertDatabaseHas('notifications', ['id' => $foreign->id]);
    $this->assertDatabaseHas('notifications', ['id' => $unread->id, 'read_at' => null]);
    $this->getJson(route('notifications.count'))->assertJsonPath('data.unread_count', 1);
    $this->deleteJson(route('notifications.destroy', $unread))->assertNoContent();
    $this->getJson(route('notifications.count'))->assertJsonPath('data.unread_count', 0);
    $this->deleteJson(route('notifications.destroy', $unread))->assertNotFound();
    $this->deleteJson(route('notifications.clear-read'))->assertNoContent();
});

test('cart addition creates only an immediate internal notice for the owner', function (string $locale, string $title) {
    Mail::fake();
    Queue::fake();
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $product = Product::factory()->create(['name' => 'Lume Ruby']);
    $this->actingAs($owner)->withHeader('Accept-Language', $locale)
        ->postJson('/api/v1/cart/items', ['product_id' => $product->id, 'quantity' => 1, 'user_id' => $other->id])->assertCreated();
    $notice = $owner->notifications()->firstOrFail();
    expect($notice->data['event'])->toBe('cart_added')
        ->and($notice->data['title'])->toBe($title)
        ->and($notice->data['body'])->toContain('Lume Ruby')
        ->and($notice->data['url'])->toBe('/cart');
    expect($other->notifications()->count())->toBe(0);
    Mail::assertNothingSent();
    Queue::assertNothingPushed();
    $this->postJson('/api/v1/cart/items', ['product_id' => 99999999, 'quantity' => 1])->assertUnprocessable();
    expect($owner->notifications()->count())->toBe(1);
})->with([['en', 'Item added to cart'], ['pt-BR', 'Produto adicionado ao carrinho']]);

test('cart addition rolls back if its internal notice cannot be saved', function () {
    $owner = User::factory()->create();
    $product = Product::factory()->create();
    Notification::shouldReceive('sendNow')->once()->andThrow(new RuntimeException('Notification storage unavailable'));
    expect(fn () => app(CartService::class)->add($owner, $product, 1, StoreLocale::English))->toThrow(RuntimeException::class);
    $this->assertDatabaseCount('cart_items', 0);
    $this->assertDatabaseCount('notifications', 0);
});
