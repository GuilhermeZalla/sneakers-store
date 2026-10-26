<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('idempotency_key', 64)->nullable();
            $table->string('request_hash', 64)->nullable();
            $table->unique(['user_id', 'idempotency_key']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['user_id', 'idempotency_key']);
            $table->dropColumn(['idempotency_key', 'request_hash']);
        });
    }
};
