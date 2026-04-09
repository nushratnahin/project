<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->string('author');
            $table->string('description', 2000)->nullable(); // nvarchar(2000) — avoids text type issues
            $table->string('isbn_no', 20)->unique();
            $table->string('image_path')->nullable();
            $table->unsignedBigInteger('category_id');
            // SQL Server does not support ON DELETE RESTRICT — use NO ACTION (same behaviour)
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('no action');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};