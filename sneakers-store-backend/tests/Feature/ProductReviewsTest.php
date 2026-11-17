<?php

use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;

test('reviews are public and ratings are calculated from reviews rather than catalog seed scores', function () {
    $product = Product::factory()->create(['rating' => 5]);
    $this->getJson('/api/v1/products/'.$product->slug)->assertOk()->assertJsonPath('data.rating', 0)->assertJsonPath('data.review_count', 0);
    ProductReview::factory()->create(['product_id' => $product->id, 'rating' => 5]);
    ProductReview::factory()->create(['product_id' => $product->id, 'rating' => 2]);
    $this->getJson('/api/v1/products/'.$product->slug)->assertJsonPath('data.rating', 3.5)->assertJsonPath('data.review_count', 2);
    $response = $this->getJson('/api/v1/products/'.$product->slug.'/reviews')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('summary.rating', 3.5)->assertJsonPath('own_review', null);
    expect($response->json('data.0'))->not->toHaveKeys(['user_id', 'email', 'password']);
});

test('only authenticated verified users can review and each user has one editable review per product', function () {
    $product = Product::factory()->create();
    $path = '/api/v1/products/'.$product->slug.'/review';
    $payload = ['rating' => 4, 'comment' => 'Comfortable and well finished.'];
    $this->putJson($path, $payload)->assertUnauthorized();
    $this->actingAs(User::factory()->unverified()->create())->putJson($path, $payload)->assertForbidden();
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $this->actingAs($owner)->putJson($path, $payload + ['user_id' => $other->id])->assertCreated()->assertJsonPath('data.is_mine', true);
    $this->putJson($path, ['rating' => 2, 'comment' => 'Updated after wearing them.'])->assertOk();
    $this->assertDatabaseCount('product_reviews', 1);
    $this->assertDatabaseHas('product_reviews', ['user_id' => $owner->id, 'rating' => 2]);
    $this->getJson('/api/v1/products/'.$product->slug.'/reviews')->assertJsonPath('own_review.rating', 2);
    $this->actingAs($other)->deleteJson($path)->assertNotFound();
    $this->assertDatabaseCount('product_reviews', 1);
    $this->actingAs($owner)->deleteJson($path)->assertNoContent();
    $this->getJson('/api/v1/products/'.$product->slug)->assertJsonPath('data.rating', 0)->assertJsonPath('data.review_count', 0);
});

test('reviews reject invalid scores and comments', function (mixed $rating, string $comment, string $field) {
    $product = Product::factory()->create();
    $this->actingAs(User::factory()->create())->putJson('/api/v1/products/'.$product->slug.'/review', compact('rating', 'comment'))->assertUnprocessable()->assertJsonValidationErrors($field);
    $this->assertDatabaseCount('product_reviews', 0);
})->with([[0, 'Valid comment', 'rating'], [6, 'Valid comment', 'rating'], [2.5, 'Valid comment', 'rating'], [5, '', 'comment'], [5, str_repeat('x', 2001), 'comment']]);

test('reviews are paginated and product sorting uses actual averages', function () {
    $low = Product::factory()->create(['rating' => 5]);
    $high = Product::factory()->create(['rating' => 1]);
    ProductReview::factory()->count(11)->create(['product_id' => $low->id, 'rating' => 2]);
    ProductReview::factory()->create(['product_id' => $high->id, 'rating' => 5]);
    $this->getJson('/api/v1/products/'.$low->slug.'/reviews')->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 11)->assertJsonPath('meta.last_page', 2);
    $this->getJson('/api/v1/products?sort=-rating')->assertJsonPath('data.0.id', $high->id);
});
