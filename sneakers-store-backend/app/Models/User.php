<?php

namespace App\Models;

use App\Notifications\ResetStorePassword;
use App\Notifications\VerifyStoreEmail;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $phone
 * @property CarbonImmutable|null $birthday
 * @property string|null $second_contact
 * @property string|null $gender
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'phone', 'birthday', 'second_contact', 'gender', 'locale'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements HasLocalePreference, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $attributes = ['locale' => 'en'];

    public function preferredLocale(): string
    {
        return $this->locale;
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyStoreEmail);
    }

    /** @param string $token */
    public function sendPasswordResetNotification(#[\SensitiveParameter] mixed $token): void
    {
        $this->notify(new ResetStorePassword($token));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birthday' => 'immutable_date',
        ];
    }

    /** @return HasMany<CartItem, $this> */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /** @return HasMany<WishlistItem, $this> */
    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    /** @return HasMany<Address, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
