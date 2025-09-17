"use client";
import { useState, FormEvent } from "react";
import { apiClient, PollOption } from "@/lib/api";

interface Poll {
    id: string
    question: string
    isPublished: boolean
}

interface PollEditFormProps {
    poll: Poll;
    onClose: () => void;
    onSuccess: (updatedPoll: Poll) => void;
}

export default function PollEditForm({
    poll,
    onClose,
    onSuccess,
}: PollEditFormProps) {
    const [question, setQuestion] = useState<string>(poll.question);
    const [isPublished, setIsPublished] = useState<boolean>(poll.isPublished);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { poll: updatedPoll } = await apiClient.updatePoll(poll.id, {
                question,
                isPublished,
            });
            onSuccess?.(updatedPoll);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update poll");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-700/70 via-pink-600/60 to-blue-600/70 backdrop-sm z-50">
            <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-tr from-indigo-100 via-pink-50 to-yellow-100 p-8 rounded-xl shadow-2xl w-full max-w-md border border-purple-200"
            >
                <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">
                    ✨ Edit Poll ✨
                </h2>
                {error && (
                    <p className="text-red-600 mb-3 font-medium text-center">{error}</p>
                )}

                <label className="block text-sm font-semibold text-purple-800 mb-1">
                    Question
                </label>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full border-2 border-purple-300 rounded-lg px-3 py-2 mb-5 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white shadow-sm"
                    required
                />

                <label className="flex items-center space-x-3 mb-6">
                    <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-purple-300 rounded"
                    />
                    <span className="text-sm font-medium text-purple-700">
                        Published
                    </span>
                </label>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 text-sm rounded-lg shadow hover:from-gray-300 hover:to-gray-400 hover:shadow-md transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:via-pink-600 hover:to-red-600 disabled:opacity-50 transition-all"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </form>
        </div>
    );
}
