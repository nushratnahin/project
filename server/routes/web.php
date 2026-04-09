<?php

use Illuminate\Support\Facades\Route;

// This is a pure API server - all routes are in routes/api.php
// Web routes are intentionally minimal.

Route::get('/', function () {
    return response()->json([
        'message' => 'Library Management System API',
        'version' => '1.0.0',
        'docs'    => '/api',
    ]);
});