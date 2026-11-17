<?php

namespace App\Policies;

use App\Models\ProductReview;
use App\Models\User;

class ProductReviewPolicy
{
    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function delete(User $user, ProductReview $review): bool
    {
        return $user->hasVerifiedEmail() && $user->id === $review->user_id;
    }
}
