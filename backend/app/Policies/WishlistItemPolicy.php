<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WishlistItem;

class WishlistItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, WishlistItem $item): bool
    {
        return $user->id === $item->user_id;
    }

    public function update(User $user, WishlistItem $item): bool
    {
        return $this->view($user, $item);
    }

    public function delete(User $user, WishlistItem $item): bool
    {
        return $this->view($user, $item);
    }
}
