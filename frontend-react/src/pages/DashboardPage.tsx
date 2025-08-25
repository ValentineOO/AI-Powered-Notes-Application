import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  LogOut,
  User,
  Sparkles,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import NoteSkeleton from "@/components/NoteSkeleton";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface Note {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  summary_length: number | null;
  ai_model_used: string | null;
  created_at: string;
  updated_at: string;
  is_conversation: boolean;
  conversation_id: string;
}

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false); // Used to show/hide the create form
  const [searchQuery, setSearchQuery] = useState("");
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryLength, setSummaryLength] = useState("150");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    noteId: number | null;
    noteTitle: string | null;
  }>({
    isOpen: false,
    noteId: null,
    noteTitle: null,
  });

  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await api.get("/notes");
      return response.data.data;
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string }) => {
      const response = await api.post("/notes", noteData);
      return response.data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setIsCreating(false);
      setNoteForm({ title: "", content: "" });
      toast.success("Note created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create note");
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { title: string; content: string };
    }) => {
      const response = await api.put(`/notes/${id}`, data);
      return response.data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNote(null);
      toast.success("Note updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update note");
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (selectedNote?.id === selectedNote?.id) {
        setSelectedNote(null);
      }
      toast.success("Note deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete note");
    },
  });

  // Summarize note mutation
  const summarizeNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      maxLength,
    }: {
      noteId: number;
      maxLength: number;
    }) => {
      const response = await api.post(`/notes/${noteId}/summarize`, {
        max_length: maxLength,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the notes query cache with the new summary data
      queryClient.setQueryData(["notes"], (oldData: any) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((note: Note) =>
            note.id === variables.noteId
              ? {
                  ...note,
                  summary: data.summary,
                  summary_length:
                    data.note?.summary_length || note.summary_length,
                  ai_model_used: data.ai_model,
                }
              : note
          ),
        };
      });

      // Also update the selectedNote state if it's the current note
      if (selectedNote && selectedNote.id === variables.noteId) {
        setSelectedNote((prev) =>
          prev
            ? {
                ...prev,
                summary: data.summary,
                summary_length:
                  data.note?.summary_length || prev.summary_length,
                ai_model_used: data.ai_model,
              }
            : null
        );
      }

      toast.success("Note summarized successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to summarize note");
    },
  });

  const handleCreateNote = () => {
    if (!noteForm.title.trim() && !noteForm.content.trim()) {
      toast.error("Please enter both title and content");
      return;
    }
    if (!noteForm.title.trim()) {
      toast.error("Please enter a title for your note");
      return;
    }
    if (!noteForm.content.trim()) {
      toast.error("Please enter content for your note");
      return;
    }

    createNoteMutation.mutate({
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
    });
  };

  const handleUpdateNote = () => {
    if (!selectedNote) {
      toast.error("No note selected for editing");
      return;
    }
    if (!noteForm.title.trim() && !noteForm.content.trim()) {
      toast.error("Please enter both title and content");
      return;
    }
    if (!noteForm.title.trim()) {
      toast.error("Please enter a title for your note");
      return;
    }
    if (!noteForm.content.trim()) {
      toast.error("Please enter content for your note");
      return;
    }

    updateNoteMutation.mutate({
      id: selectedNote.id,
      data: {
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
      },
    });
  };

  const handleDeleteNote = (noteId: number, noteTitle: string) => {
    setDeleteModal({ isOpen: true, noteId, noteTitle });
  };

  const confirmDeleteNote = () => {
    if (deleteModal.noteId) {
      deleteNoteMutation.mutate(deleteModal.noteId);
    }
  };

  const handleSummarizeNote = (noteId: number) => {
    setIsSummarizing(true);
    summarizeNoteMutation.mutate(
      {
        noteId,
        maxLength: parseInt(summaryLength),
      },
      {
        onSettled: () => setIsSummarizing(false),
      }
    );
  };

  const filteredNotes =
    notes?.filter(
      (note: Note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-xl border-b border-slate-200/60">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center py-4 sm:py-0 sm:h-20 gap-4">
            {/* Logo and Title Section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-200">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-700 leading-tight">
                  AI Notes
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium hidden md:block">
                  Your intelligent note-taking companion
                </p>
              </div>
            </div>

            {/* User Info and Logout Section */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2 sm:py-3 bg-slate-100 rounded-full border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User
                    size={14}
                    className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-white"
                  />
                </div>
                <span className="text-sm sm:text-base md:text-lg font-semibold text-slate-700 truncate max-w-20 sm:max-w-28 md:max-w-none">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-md hover:shadow-lg px-3 sm:px-4 text-xs sm:text-sm"
              >
                <LogOut size={14} className="sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Notes List */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Search and Create */}
            <div className="space-y-3 sm:space-y-5">
              <div className="relative group">
                <Search
                  size={18}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-700 transition-all duration-200"
                />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                />
              </div>

              <Button
                onClick={() => {
                  setIsCreating(true);
                  setNoteForm({ title: "", content: "" });
                  setSelectedNote(null);
                }}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 sm:py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 text-base sm:text-lg"
              >
                <Plus size={18} className="sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                Create New Note
              </Button>
            </div>

            {/* Notes List */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-slate-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Your Notes ({filteredNotes.length})
                </h3>
              </div>

              {notesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <NoteSkeleton key={i} />
                  ))}
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-lg">
                  <FileText size={56} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No notes found</p>
                  {searchQuery && (
                    <p className="text-sm">Try adjusting your search</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 pr-1 sm:pr-2">
                  {filteredNotes.map((note: Note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNote(note);
                        setNoteForm({
                          title: note.title,
                          content: note.content,
                        });
                        setIsCreating(false);
                      }}
                      className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                        selectedNote?.id === note.id
                          ? "border-indigo-700 bg-indigo-100 shadow-xl scale-105"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate text-base sm:text-lg">
                            {note.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-2 sm:mt-3 leading-relaxed">
                            {note.content}
                          </p>
                          <div className="flex items-center gap-2 mt-3 sm:mt-4 text-xs text-slate-500 bg-slate-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full w-fit">
                            <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="text-xs">
                              {formatDate(note.updated_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedNote(note);
                              setNoteForm({
                                title: note.title,
                                content: note.content,
                              });
                              setIsCreating(false);
                            }}
                            type="button"
                            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 text-slate-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg sm:rounded-xl transition-all duration-200"
                          >
                            <Edit3 size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteNote(note.id, note.title);
                            }}
                            type="button"
                            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-200"
                          >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Note Editor/Viewer */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {isCreating ? (
              <Card className="h-full border-2 border-slate-200 shadow-xl">
                <CardHeader className="bg-indigo-100 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Plus size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    Create New Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div>
                    <Label
                      htmlFor="title"
                      className="text-slate-700 font-bold text-base sm:text-lg"
                    >
                      Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter note title..."
                      value={noteForm.title}
                      onChange={(e) =>
                        setNoteForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="mt-2 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 py-2 sm:py-3 text-base sm:text-lg shadow-md"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="content"
                      className="text-slate-700 font-bold text-base sm:text-lg"
                    >
                      Content
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="Write your note here..."
                      value={noteForm.content}
                      onChange={(e) =>
                        setNoteForm((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-48 sm:min-h-64 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 resize-none text-sm sm:text-base shadow-md"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleCreateNote}
                      disabled={
                        !noteForm.title.trim() ||
                        !noteForm.content.trim() ||
                        createNoteMutation.isPending
                      }
                      className="bg-indigo-700 hover:bg-indigo-800 py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    >
                      {createNoteMutation.isPending ? (
                        <Loader2
                          size={18}
                          className="sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin"
                        />
                      ) : (
                        <Plus
                          size={18}
                          className="sm:w-5 sm:h-5 mr-2 sm:mr-3"
                        />
                      )}
                      Create Note
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setNoteForm({ title: "", content: "" });
                      }}
                      disabled={createNoteMutation.isPending}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedNote ? (
              <Card className="h-full border-2 border-slate-200 shadow-xl">
                <CardHeader className="bg-blue-50 border-b border-slate-200">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center">
                      <Edit3 size={24} className="text-white" />
                    </div>
                    Edit Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <Label
                      htmlFor="edit-title"
                      className="text-slate-700 font-bold text-lg"
                    >
                      Title
                    </Label>
                    <Input
                      id="edit-title"
                      value={noteForm.title}
                      onChange={(e) =>
                        setNoteForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="mt-2 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 py-3 text-lg shadow-md"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-content"
                      className="text-slate-700 font-bold text-lg"
                    >
                      Content
                    </Label>
                    <Textarea
                      id="edit-content"
                      value={noteForm.content}
                      onChange={(e) =>
                        setNoteForm((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      className="mt-2 min-h-64 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 resize-none text-base shadow-md"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleUpdateNote}
                      disabled={
                        !noteForm.title.trim() ||
                        !noteForm.content.trim() ||
                        updateNoteMutation.isPending
                      }
                      className="bg-indigo-700 hover:bg-indigo-800 py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    >
                      {updateNoteMutation.isPending ? (
                        <Loader2
                          size={18}
                          className="sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin"
                        />
                      ) : (
                        <Edit3
                          size={18}
                          className="sm:w-5 sm:h-5 mr-2 sm:mr-3"
                        />
                      )}
                      Update Note
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedNote(null)}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-medium border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-md"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full border-2 border-dashed border-slate-300 shadow-xl">
                <CardContent className="flex items-center justify-center h-full p-12">
                  <div className="text-center text-slate-500">
                    <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileText size={40} className="text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      Select a note to view or edit
                    </p>
                    <p className="text-lg text-slate-400">
                      Or create a new note to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* AI Summary Section */}
        {selectedNote && (
          <div className="mt-8">
            <Card className="border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-blue-50 border-b border-slate-200">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  AI Summary
                </CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  Generate an AI-powered summary of your note
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Original Note */}
                  <div>
                    <Label className="text-slate-700 font-bold text-lg mb-3 block">
                      Original Note
                    </Label>
                    <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-lg">
                      <h4 className="font-bold text-slate-900 mb-3 text-lg">
                        {selectedNote.title}
                      </h4>
                      <p className="text-slate-700 text-base leading-relaxed">
                        {selectedNote.content}
                      </p>
                    </div>
                  </div>

                  {/* AI Summary Section - Stacked Layout */}
                  <div className="space-y-6">
                    {/* AI Summary Display */}
                    <div>
                      <Label className="text-slate-700 font-bold text-lg mb-3 block">
                        AI Summary
                      </Label>
                      <div className="space-y-4">
                        {selectedNote.summary ? (
                          <div className="p-5 bg-indigo-100 rounded-2xl border-2 border-indigo-200 shadow-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center">
                                <Sparkles size={18} className="text-white" />
                              </div>
                              <span className="text-base font-bold text-indigo-800">
                                Summary ({selectedNote.summary_length}{" "}
                                characters)
                              </span>
                            </div>
                            <p className="text-indigo-800 text-base leading-relaxed">
                              {selectedNote.summary}
                            </p>
                            {selectedNote.ai_model_used && (
                              <div className="mt-3 text-sm text-indigo-600 bg-indigo-100 px-3 py-2 rounded-lg w-fit">
                                Generated using: {selectedNote.ai_model_used}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center shadow-lg">
                            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Sparkles size={32} className="text-slate-400" />
                            </div>
                            <p className="text-slate-500 text-lg font-medium">
                              No summary yet
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                              Generate one using the controls below
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary Controls - Directly below AI Summary */}
                    <div className="bg-slate-50 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200">
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="w-full">
                          <Label
                            htmlFor="summary-length"
                            className="text-sm sm:text-base text-slate-700 font-semibold"
                          >
                            Summary Length (characters)
                          </Label>
                          <Select
                            value={summaryLength}
                            onValueChange={setSummaryLength}
                          >
                            <SelectTrigger className="mt-2 border-2 border-slate-200 focus:border-indigo-700 focus:ring-indigo-700 py-2 sm:py-3 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-2 border-slate-200 shadow-lg">
                              <SelectItem
                                value="100"
                                className="py-2 sm:py-3 text-sm sm:text-base"
                              >
                                100 characters
                              </SelectItem>
                              <SelectItem
                                value="150"
                                className="py-2 sm:py-3 text-sm sm:text-base"
                              >
                                150 characters
                              </SelectItem>
                              <SelectItem
                                value="200"
                                className="py-2 sm:py-3 text-sm sm:text-base"
                              >
                                200 characters
                              </SelectItem>
                              <SelectItem
                                value="300"
                                className="py-2 sm:py-3 text-sm sm:text-base"
                              >
                                300 characters
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => handleSummarizeNote(selectedNote.id)}
                          disabled={
                            isSummarizing || summarizeNoteMutation.isPending
                          }
                          className="w-full sm:w-auto bg-indigo-700 hover:bg-indigo-800 py-2.5 sm:py-3 px-4 sm:px-6 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isSummarizing || summarizeNoteMutation.isPending ? (
                            <Loader2
                              size={18}
                              className="sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin"
                            />
                          ) : (
                            <Sparkles
                              size={18}
                              className="sm:w-5 sm:h-5 mr-2 sm:mr-3"
                            />
                          )}
                          {isSummarizing || summarizeNoteMutation.isPending
                            ? "Generating Summary..."
                            : "Generate AI Summary"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, noteId: null, noteTitle: null })
        }
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteModal.noteTitle}"? This action cannot be undone.`}
        confirmText="Delete Note"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
};

export default DashboardPage;
