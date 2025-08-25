<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'content',
        'summary',
        'summary_length',
        'ai_model_used',
        'is_conversation',
        'conversation_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_conversation' => 'boolean',
        'summary_length' => 'integer',
    ];

    /**
     * Get the user that owns the note.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get only user's notes.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get conversation threads.
     */
    public function scopeConversations($query)
    {
        return $query->where('is_conversation', true);
    }

    /**
     * Scope to get standalone notes.
     */
    public function scopeStandalone($query)
    {
        return $query->where('is_conversation', false);
    }

    /**
     * Get conversation thread.
     */
    public function scopeConversationThread($query, $conversationId)
    {
        return $query->where('conversation_id', $conversationId);
    }
}
