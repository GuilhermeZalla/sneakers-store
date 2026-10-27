<?php

namespace App\Policies;

use App\Models\Address;
use App\Models\User;

class AddressPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, Address $item): bool
    {
        return $user->id === $item->user_id;
    }

    public function update(User $user, Address $item): bool
    {
        return $this->view($user, $item);
    }

    public function delete(User $user, Address $item): bool
    {
        return $this->view($user, $item);
    }
}
