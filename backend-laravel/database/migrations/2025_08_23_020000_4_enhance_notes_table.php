<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Add new fields for enhanced functionality
            $table->integer('summary_length')->nullable()->after('summary');
            $table->string('ai_model_used')->nullable()->after('summary_length');
            $table->boolean('is_conversation')->default(false)->after('ai_model_used');
            $table->string('conversation_id')->nullable()->after('is_conversation');
            
            // Add indexes for better performance
            $table->index(['user_id', 'is_conversation']);
            $table->index('conversation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Remove new fields
            $table->dropColumn([
                'summary_length',
                'ai_model_used',
                'is_conversation',
                'conversation_id'
            ]);
            
            // Remove indexes
            $table->dropIndex(['user_id', 'is_conversation']);
            $table->dropIndex(['conversation_id']);
        });
    }
};
