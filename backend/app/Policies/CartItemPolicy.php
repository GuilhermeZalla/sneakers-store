<?php

namespace App\Policies;

use App\Models\CartItem;
use App\Models\User;

class CartItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, CartItem $item): bool
    {
        return $user->id === $item->user_id;
    }

    public function update(User $user, CartItem $item): bool
    {
        return $this->view($user, $item);
    }

    public function delete(User $user, CartItem $item): bool
    {
        return $this->view($user, $item);
    }
}
