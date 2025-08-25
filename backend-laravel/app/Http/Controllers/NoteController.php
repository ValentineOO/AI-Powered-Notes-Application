<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class NoteController extends Controller
{
    /**
     * Display a listing of the user's notes.
     */
    public function index(Request $request): JsonResponse
    {
        $notes = $request->user()
            ->notes()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notes);
    }

    /**
     * Store a newly created note.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_conversation' => 'boolean',
            'conversation_id' => 'nullable|string',
        ]);

        $note = $request->user()->notes()->create([
            'title' => $request->title,
            'content' => $request->content,
            'is_conversation' => $request->is_conversation ?? false,
            'conversation_id' => $request->conversation_id ?? Str::uuid(),
        ]);

        return response()->json([
            'message' => 'Note created successfully',
            'note' => $note,
        ], 201);
    }

    /**
     * Display the specified note.
     */
    public function show(Request $request, Note $note): JsonResponse
    {
        // Ensure user owns the note
        if ($note->user->id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($note);
    }

    /**
     * Update the specified note.
     */
    public function update(Request $request, Note $note): JsonResponse
    {
        // Ensure user owns the note
        if ($note->user->id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
        ]);

        $note->update($request->only(['title', 'content']));

        return response()->json([
            'message' => 'Note updated successfully',
            'note' => $note,
        ]);
    }

    /**
     * Remove the specified note.
     */
    public function destroy(Request $request, Note $note): JsonResponse
    {
        // Ensure user owns the note
        if ($note->user->id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $note->delete();

        return response()->json([
            'message' => 'Note deleted successfully',
        ]);
    }

    /**
     * Summarize a note using AI service.
     */
    public function summarize(Request $request, Note $note): JsonResponse
    {
        // Ensure user owns the note
        if ($note->user->id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'max_length' => 'required|integer|min:50|max:1000',
        ]);

        try {
            // Call AI service
            $response = Http::post(config('services.ai.url') . '/summarize', [
                'text' => $note->content,
                'max_length' => $request->max_length,
            ]);

            if ($response->successful()) {
                $aiResponse = $response->json();
                
                // Update note with summary
                $note->update([
                    'summary' => $aiResponse['summary'],
                    'summary_length' => $request->max_length,
                    'ai_model_used' => $aiResponse['ai_model'],
                ]);

                return response()->json([
                    'message' => 'Note summarized successfully',
                    'summary' => $aiResponse['summary'],
                    'ai_model' => $aiResponse['ai_model'],
                    'note' => $note,
                ]);
            } else {
                return response()->json([
                    'message' => 'AI service error',
                    'error' => $response->body(),
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to summarize note',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's conversation threads.
     */
    public function conversations(Request $request): JsonResponse
    {
        $conversations = $request->user()
            ->notes()
            ->conversations()
            ->select('conversation_id', 'title', 'created_at')
            ->groupBy('conversation_id', 'title', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Get a specific conversation thread.
     */
    public function conversationThread(Request $request, string $conversationId): JsonResponse
    {
        $thread = $request->user()
            ->notes()
            ->conversationThread($conversationId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($thread);
    }
}
