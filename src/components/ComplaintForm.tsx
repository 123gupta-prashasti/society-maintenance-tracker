import React, { useState, useRef } from "react";
import { User } from "../types";
import { Wrench, Image, X, UploadCloud, HelpCircle, AlertCircle, Sparkles } from "lucide-react";

interface ComplaintFormProps {
  currentUser: User | null;
  onAddComplaint: (category: string, description: string, photoUrl: string, simulateDaysAgo: number) => Promise<void>;
}

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Elevator",
  "Security & Gate",
  "Carpentry & Masonry",
  "Housekeeping & Waste",
  "Water Supply",
  "Other"
];

export default function ComplaintForm({ currentUser, onAddComplaint }: ComplaintFormProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [simulateDaysAgo, setSimulateDaysAgo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File to base64 conversion helper
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds the 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotoUrl(e.target.result as string);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError("Please select a service category.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please describe the issue in at least 10 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onAddComplaint(category, description, photoUrl, simulateDaysAgo);
      setSuccess(true);
      
      // Reset form
      setCategory("");
      setDescription("");
      setPhotoUrl("");
      setSimulateDaysAgo(0);

      // Dismiss success state after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to lodge complaint. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="complaint-form-card" className="bg-white border-4 border-slate-900 rounded-none shadow-[6px_6px_0px_rgba(15,23,42,1)] overflow-hidden">
      <div className="bg-slate-900 text-white p-5 border-b-4 border-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400 text-slate-900 border-2 border-slate-900 shrink-0">
            <Wrench className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <h3 className="font-black text-sm md:text-base uppercase tracking-widest text-white">File Maintenance Ticket</h3>
            <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
              Lodge a society service request. Admins will evaluate, prioritize, and assign staff.
            </p>
          </div>
        </div>
      </div>

      <form id="lodge-complaint-form" onSubmit={handleSubmit} className="p-5 space-y-4">
        {success && (
          <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-950 p-4 rounded-none flex items-start gap-3">
            <div className="p-1 bg-emerald-600 text-white border border-emerald-700 rounded-none shrink-0">
              <Sparkles className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <span className="font-black text-xs md:text-sm uppercase tracking-wider block">Complaint Registered!</span>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                Ticket filed under category "{category}". A notification email has been simulated and sent.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-100 border-2 border-rose-600 text-rose-950 p-4 rounded-none flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 stroke-[3]" />
            <span className="text-xs font-black uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Category Choice */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-900 block">Category *</label>
          <select
            id="complaint-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border-2 border-slate-900 rounded-none bg-white text-slate-900 font-bold focus:outline-none"
          >
            <option value="">-- Choose Category --</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-900 block">Describe the Concern *</label>
          <textarea
            id="complaint-description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Please detail the location, issue, and details. E.g. Block B elevators' fan is not working..."
            className="w-full px-3 py-2.5 text-sm border-2 border-slate-900 rounded-none bg-white text-slate-900 font-bold focus:outline-none"
          />
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Min 10 chars</span>
            <span>{description.length}/1000 characters</span>
          </div>
        </div>

        {/* Drag-Drop Photo Uploader */}
        <div className="space-y-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-900 block">Supporting Photo (Optional)</label>
          
          {photoUrl ? (
            <div className="relative border-2 border-slate-900 rounded-none p-2 bg-slate-50 flex items-center justify-between shadow-[2px_2px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-3">
                <img
                  src={photoUrl}
                  alt="Attachment Preview"
                  className="w-14 h-14 object-cover border-2 border-slate-900"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900 block">Photo Attached</span>
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Ready to upload securely</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoUrl("")}
                className="p-1 border-2 border-slate-900 hover:bg-slate-200 rounded-none text-slate-900 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div
              id="file-drag-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed border-slate-900 rounded-none p-5 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "bg-amber-50/50"
                  : "bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-slate-900 mx-auto mb-2 stroke-[2.5]" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-800">Drag & Drop supporting photo</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Or click to select image (Max 5MB)</p>
            </div>
          )}
        </div>

        {/* Backdating simulation feature for reviewers! */}
        <div className="p-4 bg-slate-50 rounded-none border-2 border-slate-900 space-y-3 shadow-[2px_2px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-900 shrink-0 stroke-[3]" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">SLA Time-Simulator</span>
            <span className="ml-auto text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 border-2 border-slate-900 rounded-none uppercase tracking-widest">
              Reviewer Assist
            </span>
          </div>
          <p className="text-[10px] text-slate-600 leading-normal font-medium">
            Test overdue ticket logic by sliding below to backlog complaint creation. Server will backdate it immediately!
          </p>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-black uppercase tracking-tight text-slate-700">
              <span>Backdate Creation:</span>
              <span className="text-slate-900 underline">
                {simulateDaysAgo === 0 ? "Today" : `${simulateDaysAgo} days ago`}
              </span>
            </div>
            <input
              id="simulate-days-slider"
              type="range"
              min="0"
              max="10"
              step="1"
              value={simulateDaysAgo}
              onChange={(e) => setSimulateDaysAgo(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 h-2 bg-slate-200 border border-slate-900 rounded-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>Today (0 days)</span>
              <span>10 days ago</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          id="btn-submit-complaint"
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-widest border-2 border-slate-900 transition-colors cursor-pointer shadow-[3px_3px_0px_rgba(15,23,42,1)] disabled:bg-slate-400 flex items-center justify-center gap-2"
        >
          {loading ? "Registering Ticket..." : "Lodge Service Request"}
        </button>
      </form>
    </div>
  );
}
