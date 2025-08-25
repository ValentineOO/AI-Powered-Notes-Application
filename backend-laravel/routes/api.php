<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::get('/health', function () {
    Log::info('Health endpoint hit');

    // Try different response formats
    try {
        $response = response()->json(['status' => 'healthy', 'timestamp' => now()]);
        Log::info('Response created successfully');
        return $response;
    } catch (Exception $e) {
        Log::error('Error creating response: ' . $e->getMessage());
        return ['status' => 'healthy', 'timestamp' => now()];
    }
});

Route::get('/test', function () {
    Log::info('Test endpoint hit');
    return response()->json(['message' => 'Test endpoint working']);
});

Route::get('/debug', function () {
    Log::info('Debug endpoint hit');
    return 'Debug endpoint working - plain text';
});

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User profile
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Notes CRUD
    Route::apiResource('notes', NoteController::class);

    // Additional note endpoints
    Route::post('/notes/{note}/summarize', [NoteController::class, 'summarize']);
    Route::get('/notes/conversations', [NoteController::class, 'conversations']);
    Route::get('/notes/conversations/{conversationId}', [NoteController::class, 'conversationThread']);
});
