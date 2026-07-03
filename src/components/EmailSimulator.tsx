import React, { useState } from "react";
import { EmailLog } from "../types";
import { Mail, Search, Send, Calendar, User, Eye, ArrowRight, CornerDownRight } from "lucide-react";

interface EmailSimulatorProps {
  emails: EmailLog[];
}

export default function EmailSimulator({ emails }: EmailSimulatorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  const filtered = emails.filter(
    (em) =>
      em.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      em.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      em.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      em.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="email-simulator-root" className="bg-slate-950 text-slate-100 border-4 border-slate-900 rounded-none shadow-[6px_6px_0px_rgba(15,23,42,1)] overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-5 border-b-4 border-slate-950">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-400 text-slate-950 border-2 border-slate-900 shrink-0">
              <Mail className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white uppercase tracking-widest">Outbox & Production SMTP Logs</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                Tracks outbound notification deliveries triggered by complaint SLA changes and important bulletins.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-emerald-400 text-slate-950 px-3 py-1.5 border-2 border-slate-950 font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse"></span>
            SMTP Client Active
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        {/* Email Logs List */}
        <div className="md:col-span-5 border-r-4 border-slate-950 flex flex-col max-h-[550px]">
          {/* Search bar */}
          <div className="p-3 bg-slate-900 border-b-4 border-slate-950">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 stroke-[3]" />
              <input
                id="email-search-input"
                type="text"
                placeholder="Search recipient or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border-2 border-slate-900 rounded-none focus:outline-none placeholder-slate-500 text-slate-200 font-bold"
              />
            </div>
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-slate-950 flex-1">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-xs font-black uppercase tracking-widest text-slate-500">
                No outbound mail captured.
              </div>
            ) : (
              filtered.map((em) => (
                <button
                  key={em.id}
                  id={`email-log-item-${em.id}`}
                  onClick={() => setSelectedEmail(em)}
                  className={`w-full p-4 text-left transition-colors flex flex-col gap-1.5 cursor-pointer ${
                    selectedEmail?.id === em.id ? "bg-slate-800 text-white" : "hover:bg-slate-900"
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Send className="w-2.5 h-2.5 stroke-[3]" />
                      {em.recipientName}
                    </span>
                    <span>{new Date(em.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <h4 className="font-black text-xs text-slate-100 uppercase tracking-tight truncate pr-2">
                    {em.subject}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {em.body.substring(0, 80)}...
                  </p>
                  
                  {/* Badge */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 border border-slate-950 uppercase tracking-widest ${
                      em.type === "notice" 
                        ? "bg-amber-400 text-slate-950" 
                        : "bg-slate-900 text-slate-300"
                    }`}>
                      {em.type === "notice" ? "Broadcast" : "Transition"}
                    </span>
                    {em.status && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 border border-slate-950 uppercase tracking-widest ${
                        em.status === "Success" 
                          ? "bg-emerald-500 text-slate-950" 
                          : "bg-red-500 text-white"
                      }`}>
                        {em.status}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 font-bold">
                      {em.recipientEmail}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Email Detailed Viewer */}
        <div className="md:col-span-7 bg-slate-950/25 p-5 flex flex-col max-h-[550px] overflow-y-auto">
          {selectedEmail ? (
            <div id="email-detailed-view" className="space-y-4">
              {/* Envelope details */}
              <div className="bg-slate-900 p-4 border-2 border-slate-800 text-xs space-y-2 rounded-none shadow-[2px_2px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-black uppercase tracking-widest w-20 shrink-0">SMTP Host:</span>
                  <span className="font-mono text-amber-400">Production Brevo SMTP Server</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-black uppercase tracking-widest w-20 shrink-0">From:</span>
                  <span className="font-bold text-slate-100">Society Portal &lt;helpdesk@society.com&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-black uppercase tracking-widest w-20 shrink-0">To:</span>
                  <span className="font-bold text-amber-400">{selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-black uppercase tracking-widest w-20 shrink-0">Subject:</span>
                  <span className="font-black text-white uppercase tracking-tight">{selectedEmail.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-black uppercase tracking-widest w-20 shrink-0">Timestamp:</span>
                  <span className="text-slate-300 font-medium">{new Date(selectedEmail.sentAt).toLocaleString()}</span>
                </div>
                {selectedEmail.status && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-black uppercase tracking-widest w-20 shrink-0">Delivery:</span>
                    <span className={`font-black uppercase tracking-wider px-2 py-0.5 border ${
                      selectedEmail.status === "Success"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                      {selectedEmail.status}
                    </span>
                  </div>
                )}
                {selectedEmail.errorMessage && (
                  <div className="flex items-start gap-2 border-t border-slate-800 pt-2 mt-2">
                    <span className="text-red-400 font-black uppercase tracking-widest w-20 shrink-0 mt-0.5">SMTP Error:</span>
                    <span className="font-mono text-red-400 leading-normal bg-red-950/40 p-2 border border-red-900/40 flex-1 break-all select-all">
                      {selectedEmail.errorMessage}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Body Frame */}
              <div className="bg-white text-slate-900 rounded-none p-6 border-4 border-slate-900 shadow-inner font-sans text-sm min-h-[250px] whitespace-pre-wrap leading-relaxed font-medium">
                {selectedEmail.body}
              </div>

              <div className="text-[9px] text-slate-500 text-center font-black uppercase tracking-widest">
                Production SMTP delivery loop verified • Transport secure
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500">
              <Mail className="w-14 h-14 text-slate-800 mb-3 stroke-[2]" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Email Selected</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-xs font-medium">
                Select an outbound notification mail from the left sidebar to inspect full headers, metadata, and body.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
