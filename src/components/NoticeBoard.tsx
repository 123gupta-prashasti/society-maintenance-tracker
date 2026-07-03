import React, { useState } from "react";
import { Notice, User } from "../types";
import { Megaphone, Pin, Plus, Calendar, AlertCircle } from "lucide-react";

interface NoticeBoardProps {
  notices: Notice[];
  currentUser: User | null;
  onAddNotice: (title: string, content: string, isImportant: boolean) => Promise<void>;
}

export default function NoticeBoard({ notices, currentUser, onAddNotice }: NoticeBoardProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both title and content.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await onAddNotice(title, content, isImportant);
      setTitle("");
      setContent("");
      setIsImportant(false);
      setIsPosting(false);
    } catch (err: any) {
      setError(err.message || "Failed to post notice");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <div id="notice-board-container" className="bg-white border-4 border-slate-900 rounded-none shadow-[6px_6px_0px_rgba(15,23,42,1)] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between border-b-4 border-slate-900">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-amber-400 stroke-[3]" />
          <h3 className="font-black text-white text-sm uppercase tracking-widest">Notice Bulletin Board</h3>
        </div>
        {isAdmin && !isPosting && (
          <button
            id="btn-post-notice-trigger"
            onClick={() => setIsPosting(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-900 bg-amber-400 hover:bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Post Notice
          </button>
        )}
      </div>

      {/* Posting Form (Admins Only) */}
      {isPosting && (
        <form id="notice-post-form" onSubmit={handleSubmit} className="p-5 border-b-4 border-slate-900 bg-amber-50/50 space-y-4">
          <div className="flex justify-between items-center border-b-2 border-slate-200 pb-2">
            <span className="text-xs font-black text-amber-950 uppercase tracking-widest">New Society Announcement</span>
            <button
              type="button"
              onClick={() => {
                setIsPosting(false);
                setError("");
              }}
              className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-900 bg-rose-100 p-3 border-2 border-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[3]" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-900 block">Notice Title</label>
            <input
              id="notice-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled water shutdown on Block C"
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-900 rounded-none bg-white text-slate-900 font-bold focus:outline-none"
              maxLength={100}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-900 block">Detailed Message</label>
            <textarea
              id="notice-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide complete breakdown here..."
              rows={4}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-900 rounded-none bg-white text-slate-900 font-bold focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              id="notice-important-checkbox"
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-5 h-5 text-slate-900 border-2 border-slate-900 bg-white rounded-none focus:ring-0 cursor-pointer"
            />
            <label htmlFor="notice-important-checkbox" className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
              <Pin className="w-3.5 h-3.5 text-red-600 fill-red-600" />
              Mark as <span className="text-red-600 underline">Important & Pin to Top</span>
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <button
              id="btn-submit-notice"
              type="submit"
              disabled={loading}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 border-2 border-slate-900 shadow-[2px_2px_0px_rgba(15,23,42,1)] cursor-pointer disabled:bg-slate-400"
            >
              {loading ? "Publishing..." : "Publish Announcement"}
            </button>
          </div>
        </form>
      )}

      {/* Notice List */}
      <div className="divide-y-2 divide-slate-900 max-h-[450px] overflow-y-auto">
        {notices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
            No bulletins published yet.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              id={`notice-card-${notice.id}`}
              className={`p-5 transition-colors ${
                notice.isImportant ? "bg-amber-50/70 hover:bg-amber-50" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {notice.isImportant && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-600 text-white border-2 border-slate-900">
                        <Pin className="w-2.5 h-2.5 fill-white text-white shrink-0" />
                        Important
                      </span>
                    )}
                    <h4 className="font-black text-slate-900 text-sm md:text-base tracking-tight">{notice.title}</h4>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pr-2 font-medium">
                    {notice.content}
                  </p>
                  
                  {/* Meta */}
                  <div className="flex items-center gap-3 pt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(notice.createdAt).toLocaleDateString()} • {new Date(notice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>By {notice.authorName}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
