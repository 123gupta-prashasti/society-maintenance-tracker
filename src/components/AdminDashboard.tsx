import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Eye, Settings, ShieldAlert, BarChart2, Check, RefreshCw } from "lucide-react";

interface StatsData {
  total: number;
  status: {
    Open: number;
    "In Progress": number;
    Resolved: number;
  };
  category: Record<string, number>;
  overdueCount: number;
}

interface AdminDashboardProps {
  stats: StatsData;
  thresholdDays: number;
  onUpdateThreshold: (days: number) => Promise<void>;
  onRefresh: () => void;
}

export default function AdminDashboard({ stats, thresholdDays, onUpdateThreshold, onRefresh }: AdminDashboardProps) {
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [newDays, setNewDays] = useState(thresholdDays);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onUpdateThreshold(newDays);
      setEditingThreshold(false);
      setSuccessMsg("Overdue SLA threshold successfully updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      alert("Failed to save threshold. Ensure it is a positive integer.");
    } finally {
      setSaving(false);
    }
  };

  // Safe color scale for categories
  const categoryColors: Record<string, string> = {
    Plumbing: "bg-blue-500",
    Electrical: "bg-amber-500",
    Elevator: "bg-rose-500",
    "Security & Gate": "bg-emerald-500",
    "Carpentry & Masonry": "bg-indigo-500",
    "Housekeeping & Waste": "bg-slate-500",
    "Water Supply": "bg-cyan-500",
    Other: "bg-violet-500"
  };

  const getPercentage = (count: number) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  return (
    <div id="admin-dashboard-root" className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white p-4 border-4 border-slate-900 rounded-none flex items-center gap-3 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
          <div className="p-2.5 bg-slate-900 text-white border-2 border-slate-900 shrink-0">
            <BarChart2 className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Total Filed</span>
            <span id="stat-total" className="text-2xl font-black text-slate-900 tracking-tight block">{stats.total}</span>
          </div>
        </div>

        {/* Open */}
        <div className="bg-white p-4 border-4 border-slate-900 rounded-none flex items-center gap-3 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
          <div className="p-2.5 bg-slate-900 text-white border-2 border-slate-900 shrink-0">
            <Clock className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Open</span>
            <span id="stat-open" className="text-2xl font-black text-slate-900 tracking-tight block">{stats.status.Open}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 border-4 border-slate-900 rounded-none flex items-center gap-3 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
          <div className="p-2.5 bg-slate-900 text-white border-2 border-slate-900 shrink-0">
            <RefreshCw className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">In Progress</span>
            <span id="stat-progress" className="text-2xl font-black text-slate-900 tracking-tight block">{stats.status["In Progress"]}</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 border-4 border-slate-900 rounded-none flex items-center gap-3 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
          <div className="p-2.5 bg-slate-900 text-white border-2 border-slate-900 shrink-0">
            <CheckCircle className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Resolved</span>
            <span id="stat-resolved" className="text-2xl font-black text-slate-900 tracking-tight block">{stats.status.Resolved}</span>
          </div>
        </div>

        {/* Overdue */}
        <div className={`p-4 border-4 border-slate-900 rounded-none flex items-center gap-3 col-span-2 lg:col-span-1 shadow-[4px_4px_0px_rgba(15,23,42,1)] ${
          stats.overdueCount > 0 
            ? "bg-red-100 text-red-950" 
            : "bg-white text-slate-900"
        }`}>
          <div className={`p-2.5 border-2 border-slate-900 shrink-0 ${
            stats.overdueCount > 0 
              ? "bg-red-600 text-white" 
              : "bg-slate-900 text-white"
          }`}>
            <ShieldAlert className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Overdue ({thresholdDays}d)</span>
            <span id="stat-overdue" className="text-2xl font-black tracking-tight block">{stats.overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Settings & Category Charts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Category breakdown (Donut / Progress chart) */}
        <div className="bg-white border-4 border-slate-900 rounded-none p-5 md:col-span-7 space-y-5 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-900 stroke-[3]" />
              Complaints Distribution
            </h4>
            <button 
              onClick={onRefresh}
              className="p-1 border border-slate-200 hover:border-slate-900 rounded-none text-slate-900 hover:bg-slate-50 transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {Object.keys(stats.category).length === 0 ? (
              <p className="text-xs font-bold text-slate-500 text-center py-8 uppercase tracking-widest">No categories logged yet.</p>
            ) : (
              Object.entries(stats.category).map(([cat, val]) => {
                const percent = getPercentage(val);
                const color = categoryColors[cat] || "bg-teal-500";
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-slate-900 uppercase tracking-tight">
                      <span>{cat}</span>
                      <span className="text-slate-500 font-mono">
                        {val} {val === 1 ? "ticket" : "tickets"} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-4 border-2 border-slate-900 rounded-none overflow-hidden shadow-[1px_1px_0px_rgba(15,23,42,1)]">
                      <div className={`h-full ${color} rounded-none border-r-2 border-slate-900`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SLA Threshold configuration */}
        <div className="bg-white border-4 border-slate-900 rounded-none p-5 md:col-span-5 flex flex-col justify-between shadow-[4px_4px_0px_rgba(15,23,42,1)]">
          <div className="space-y-4">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-900 stroke-[3]" />
              SLA Configurations
            </h4>
            
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Define the maximum limit of days a maintenance complaint can stay open before raising administrative alerts. Overdue items dynamically escalate to the top.
            </p>

            {successMsg && (
              <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-900 p-3 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span>{successMsg}</span>
              </div>
            )}

            {!editingThreshold ? (
              <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-none flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Current Limit:</span>
                  <span className="text-lg font-black text-slate-900 uppercase tracking-tight">{thresholdDays} Days SLA</span>
                </div>
                <button
                  id="btn-edit-threshold"
                  onClick={() => {
                    setNewDays(thresholdDays);
                    setEditingThreshold(true);
                  }}
                  className="px-3.5 py-2 text-xs font-black uppercase tracking-widest border-2 border-slate-900 bg-white hover:bg-slate-50 transition-colors shadow-[2px_2px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  Configure
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveThreshold} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-700 block">SLA Threshold (Days)</label>
                  <div className="flex gap-2">
                    <input
                      id="input-threshold-days"
                      type="number"
                      min="0"
                      max="30"
                      value={newDays}
                      onChange={(e) => setNewDays(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-sm border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center shrink-0">days</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingThreshold(false)}
                    className="px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-save-threshold"
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest border-2 border-slate-900 transition-colors shadow-[2px_2px_0px_rgba(15,23,42,1)] cursor-pointer"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="border-t-2 border-slate-100 pt-3 mt-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Live SLA audit active • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
