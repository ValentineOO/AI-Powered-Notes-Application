<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-web', function () {
    return response()->json(['message' => 'Web route working']);
});

Route::get('/test-simple', function () {
    return 'Simple text response';
});
