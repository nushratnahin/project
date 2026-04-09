<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| Public Auth Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Public Book / Category Routes
|--------------------------------------------------------------------------
*/
Route::get('/books',       [BookController::class, 'index']);
Route::get('/books/{id}',  [BookController::class, 'show']);
Route::get('/categories',  [BookController::class, 'categories']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'me']);

    // Profile
    Route::get('/profile',           [ProfileController::class, 'show']);
    Route::put('/profile',           [ProfileController::class, 'update']);
    Route::put('/profile/password',  [ProfileController::class, 'changePassword']);
    Route::delete('/profile',        [ProfileController::class, 'destroy']);

    // Borrowing (members)
    Route::get('/my-books',             [RecordController::class, 'myBooks']);
    Route::post('/borrow/{book_id}',    [RecordController::class, 'borrow']);
    Route::post('/return/{record_id}',  [RecordController::class, 'return']);

    // Admin-only Book CRUD
    Route::middleware('is.admin')->group(function () {
        Route::post('/books',         [BookController::class, 'store']);
        Route::post('/books/{id}',    [BookController::class, 'update']); // multipart workaround
        Route::put('/books/{id}',     [BookController::class, 'update']);
        Route::delete('/books/{id}',  [BookController::class, 'destroy']);

        // Admin dashboard
        Route::prefix('admin')->group(function () {
            Route::get('/stats',                [AdminController::class, 'stats']);
            Route::get('/users',                [AdminController::class, 'users']);
            Route::put('/users/{id}/status',    [AdminController::class, 'updateUserStatus']);
        });
    });
});