import React, { useState, useEffect } from "react";
import { 
  User, 
  Complaint, 
  Notice, 
  EmailLog, 
  ComplaintStatus, 
  ComplaintPriority 
} from "./types";
import ComplaintForm from "./components/ComplaintForm";
import NoticeBoard from "./components/NoticeBoard";
import AdminDashboard from "./components/AdminDashboard";
import EmailSimulator from "./components/EmailSimulator";
import SystemDesignDocs from "./components/SystemDesignDocs";
import { 
  Wrench, 
  Megaphone, 
  Mail, 
  BookOpen, 
  LogOut, 
  User as UserIcon, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  MapPin, 
  Shield, 
  Building2, 
  CornerDownRight, 
  Calendar,
  AlertCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("society_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authApartment, setAuthApartment] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // App Navigation
  const [activeTab, setActiveTab] = useState<"tickets" | "notices" | "emails" | "docs">("tickets");

  // Core Data Lists
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    status: { Open: 0, "In Progress": 0, Resolved: 0 },
    category: {} as Record<string, number>,
    overdueCount: 0
  });
  const [thresholdDays, setThresholdDays] = useState(3);

  // Filters & Interaction State
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All"); // All, Today, Last 3 days, Last 7 days
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ticket Update Action Form
  const [updateStatus, setUpdateStatus] = useState<ComplaintStatus | "">("");
  const [updatePriority, setUpdatePriority] = useState<ComplaintPriority | "">("");
  const [updateNote, setUpdateNote] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Helper to generate security headers for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem("society_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  // Robust JSON parser to gracefully handle non-JSON / HTML fallback error responses
  const safeParseResponseJson = async (res: Response): Promise<any> => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    const cleanText = text.length > 200 ? text.substring(0, 200) + "..." : text;
    throw new Error(
      `Server error (${res.status}): ${cleanText || "An unexpected non-JSON response was received."}`
    );
  };

  // Initial Data Fetching
  const loadAppData = async () => {
    try {
      const headers = getAuthHeaders();
      
      // Parallel fetches for responsiveness
      const [compRes, noticeRes, emailRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/complaints`, { headers }),
        fetch(`${API_BASE}/api/notices`, { headers }),
        fetch(`${API_BASE}/api/emails`, { headers }),
        fetch(`${API_BASE}/api/stats`, { headers })
      ]);

      if (compRes.ok) {
        const data = await safeParseResponseJson(compRes);
        setComplaints(data.complaints);
      }
      if (noticeRes.ok) {
        const data = await safeParseResponseJson(noticeRes);
        setNotices(data.notices);
      }
      if (emailRes.ok) {
        const data = await safeParseResponseJson(emailRes);
        setEmails(data.emails);
      }
      if (statsRes.ok) {
        const data = await safeParseResponseJson(statsRes);
        setStats(data.stats);
        setThresholdDays(data.thresholdDays);
      }
    } catch (err) {
      console.error("Failed to fetch application data", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAppData();
    }
  }, [currentUser]);

  // Auth: Register/Login actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    try {
      setAuthLoading(true);
      if (isRegisterMode) {
        if (!authName.trim()) {
          setAuthError("Name is required for registration.");
          setAuthLoading(false);
          return;
        }
        if (!authPassword.trim() || authPassword.length < 6) {
          setAuthError("Password must be at least 6 characters.");
          setAuthLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
            name: authName,
            apartment: authApartment,
            password: authPassword
          })
        });
        const data = await safeParseResponseJson(res);
        if (!res.ok) throw new Error(data.error || "Registration failed");
        
        localStorage.setItem("society_user", JSON.stringify(data.user));
        localStorage.setItem("society_token", data.token);
        setCurrentUser(data.user);
      } else {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await safeParseResponseJson(res);
        if (!res.ok) throw new Error(data.error || "Login failed");

        localStorage.setItem("society_user", JSON.stringify(data.user));
        localStorage.setItem("society_token", data.token);
        setCurrentUser(data.user);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleShortcutLogin = async (email: string) => {
    try {
      setAuthLoading(true);
      setAuthError("");
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" })
      });
      const data = await safeParseResponseJson(res);
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("society_user", JSON.stringify(data.user));
      localStorage.setItem("society_token", data.token);
      setCurrentUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || "Failed shortcut login");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("society_user");
    localStorage.removeItem("society_token");
    setCurrentUser(null);
    setComplaints([]);
    setNotices([]);
    setEmails([]);
    setExpandedComplaintId(null);
  };

  // Complaint: Add
  const handleAddComplaint = async (category: string, description: string, photoUrl: string, simulateDaysAgo: number) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/complaints`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        residentId: currentUser.id,
        category,
        description,
        photoUrl,
        simulateDaysAgo
      })
    });
    const data = await safeParseResponseJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to submit request");

    // Reload all feeds to sync status
    await loadAppData();
  };

  // Notice: Add
  const handleAddNotice = async (title: string, content: string, isImportant: boolean) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/notices`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        content,
        isImportant
      })
    });
    const data = await safeParseResponseJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to post notice");

    await loadAppData();
  };

  // Complaint: Admin Status/Priority Update
  const handleUpdateComplaint = async (complaintId: string) => {
    if (!currentUser) return;
    if (!updateStatus && !updatePriority) {
      alert("Please specify a status or priority level to update.");
      return;
    }

    try {
      setUpdateLoading(true);
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: updateStatus || undefined,
          priority: updatePriority || undefined,
          note: updateNote.trim() || undefined
        })
      });
      const data = await safeParseResponseJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to update ticket parameters");

      // Reset update fields
      setUpdateNote("");
      setUpdateStatus("");
      setUpdatePriority("");
      
      // Refresh
      await loadAppData();
    } catch (err: any) {
      alert(err.message || "Failed to save updates.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // SLA Threshold: Admin update
  const handleUpdateSlaThreshold = async (days: number) => {
    if (!currentUser) return;
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        overdueThresholdDays: days
      })
    });
    const data = await safeParseResponseJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to update SLA settings");

    await loadAppData();
  };

  // Filter complaints list
  const getFilteredComplaints = () => {
    return complaints.filter((c) => {
      // Category Filter
      if (categoryFilter !== "All" && c.category !== categoryFilter) return false;

      // Status Filter
      if (statusFilter !== "All" && c.status !== statusFilter) return false;

      // Date Filter
      if (dateFilter !== "All") {
        const createdDate = new Date(c.createdAt).getTime();
        const diffMs = Date.now() - createdDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (dateFilter === "Today" && diffDays > 1) return false;
        if (dateFilter === "3days" && diffDays > 3) return false;
        if (dateFilter === "7days" && diffDays > 7) return false;
      }

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);
        const matchesName = c.residentName.toLowerCase().includes(q);
        const matchesApt = c.residentApartment.toLowerCase().includes(q);
        if (!matchesDesc && !matchesCategory && !matchesName && !matchesApt) return false;
      }

      return true;
    });
  };

  const filteredComplaintsList = getFilteredComplaints();

  // Render Welcome/Auth Screen if no user logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans" id="auth-screen">
        {/* Top Header Accent */}
        <div className="h-4 bg-slate-900 w-full"></div>

        <div className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center max-w-4xl">
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 font-black text-xs tracking-widest uppercase italic border-2 border-slate-900">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              Westside Manor Cooperative
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Society Central
            </h1>
            <p className="text-slate-700 text-xs font-bold tracking-widest uppercase max-w-lg mx-auto">
              Lodge Complaints • Track Active SLAs • Notice Bulletin Boards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
            {/* Left Box: Login/Register Card */}
            <div className="md:col-span-7 bg-white border-4 border-slate-900 p-6 md:p-8 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div>
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    {isRegisterMode ? "Resident Signup" : "Member Login"}
                  </h2>
                  <button
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError("");
                    }}
                    className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    {isRegisterMode ? "Or Login Instead" : "Or Register Unit"}
                  </button>
                </div>

                {authError && (
                  <div className="bg-red-100 border-2 border-red-600 text-red-900 p-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-700 block">Email Address</label>
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      placeholder="e.g. john@society.com or admin@society.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-slate-900 focus:outline-none bg-white text-slate-950 font-bold placeholder-slate-400"
                    />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                      💡 Tip: Emails containing <strong className="text-red-600 font-black">"admin"</strong> automatically boot into Administrator Mode.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-700 block">Password</label>
                    <input
                      id="auth-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-slate-900 focus:outline-none bg-white text-slate-950 font-bold placeholder-slate-400"
                    />
                    {!isRegisterMode && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                        🔑 Seeded Demo accounts use password: <strong className="text-amber-500 font-black">"password123"</strong>.
                      </p>
                    )}
                  </div>

                  {isRegisterMode && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-700 block">Full Name</label>
                        <input
                          id="auth-name-input"
                          type="text"
                          required={isRegisterMode}
                          placeholder="John Doe"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-4 py-3 text-sm border-2 border-slate-900 focus:outline-none bg-white text-slate-950 font-bold placeholder-slate-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-700 block">Apartment / Unit Number</label>
                        <input
                          id="auth-apartment-input"
                          type="text"
                          placeholder="e.g. Block A - 402"
                          value={authApartment}
                          onChange={(e) => setAuthApartment(e.target.value)}
                          className="w-full px-4 py-3 text-sm border-2 border-slate-900 focus:outline-none bg-white text-slate-950 font-bold placeholder-slate-400"
                        />
                      </div>
                    </>
                  )}

                  <button
                    id="btn-auth-submit"
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs border-2 border-slate-900 transition-colors cursor-pointer disabled:bg-slate-400 flex items-center justify-center"
                  >
                    {authLoading ? "Verifying Credentials..." : isRegisterMode ? "Complete Registration" : "Sign In to Portal"}
                  </button>
                </form>
              </div>

              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center border-t-2 border-slate-100 pt-4 mt-6">
                Westside Housing Management Association • v2.6
              </div>
            </div>

            {/* Right Box: Quick Mock Accounts for fast testing */}
            <div className="md:col-span-5 bg-slate-900 text-slate-200 border-4 border-slate-900 p-6 md:p-8 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(251,191,36,1)]">
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-amber-400 text-lg uppercase tracking-tight flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    Reviewer Hot-Login
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                    Bypass authentication. Click any preset persona below to load seed ticket tracking datasets instantly.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Admin */}
                  <button
                    id="login-shortcut-admin"
                    onClick={() => handleShortcutLogin("admin@society.com")}
                    className="w-full text-left p-4 bg-slate-800 border-2 border-slate-700 hover:border-amber-400 hover:bg-slate-750 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-black text-white block uppercase tracking-tight">Sarah Jenkins (Admin)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Escalate complaints, modify SLA configuration</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-1 border border-red-500 shrink-0">
                      Admin
                    </span>
                  </button>

                  {/* Resident 1 */}
                  <button
                    id="login-shortcut-resident1"
                    onClick={() => handleShortcutLogin("john@society.com")}
                    className="w-full text-left p-4 bg-slate-800 border-2 border-slate-700 hover:border-teal-400 hover:bg-slate-750 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-black text-white block uppercase tracking-tight">John Doe (Block A - 402)</span>
                      <span className="text-[10px] text-slate-400 font-medium font-sans">Lodge complaints & review timeline history</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-teal-600 text-white px-2 py-1 border border-teal-500 shrink-0">
                      Resident
                    </span>
                  </button>

                  {/* Resident 2 */}
                  <button
                    id="login-shortcut-resident2"
                    onClick={() => handleShortcutLogin("alice@society.com")}
                    className="w-full text-left p-4 bg-slate-800 border-2 border-slate-700 hover:border-teal-400 hover:bg-slate-750 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <span className="text-xs font-black text-white block uppercase tracking-tight">Alice Smith (Block B - 105)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Verify image attachments & check outbox notices</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-teal-600 text-white px-2 py-1 border border-teal-500 shrink-0">
                      Resident
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 border-2 border-slate-800 text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-normal mt-6">
                💡 Note: Status adjustments and bulletin pin events emit simulated outbound SMTP emails caught dynamically in the SMTP logs.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 text-slate-400 text-center py-4 text-[10px] font-black uppercase tracking-widest border-t-2 border-slate-950">
          Society Central Management Platform • Operational Node
        </div>
      </div>
    );
  }

  // --- MAIN APP COMPONENT FOR AUTHENTICATED USERS ---
  const isAdmin = currentUser.role === "admin";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans" id="portal-root">
      {/* Top Banner & Profile Header */}
      <header className="bg-white border-b-4 border-slate-900 sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white px-2.5 py-1.5 font-black text-xl tracking-tighter italic border-2 border-slate-900 shadow-[2px_2px_0px_rgba(251,191,36,1)]">
              SC
            </div>
            <div>
              <span className="font-black text-slate-900 text-base tracking-tighter uppercase italic leading-tight block">
                Society Central
              </span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">
                Helpdesk & SLA
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 h-full">
            <button
              id="nav-tickets"
              onClick={() => setActiveTab("tickets")}
              className={`font-black text-xs tracking-widest uppercase h-full border-b-4 transition-all cursor-pointer ${
                activeTab === "tickets"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              Complaints
            </button>
            <button
              id="nav-notices"
              onClick={() => setActiveTab("notices")}
              className={`font-black text-xs tracking-widest uppercase h-full border-b-4 transition-all cursor-pointer ${
                activeTab === "notices"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              Notice Board
            </button>
            <button
              id="nav-emails"
              onClick={() => setActiveTab("emails")}
              className={`font-black text-xs tracking-widest uppercase h-full border-b-4 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "emails"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              SMTP Outbox
              {emails.length > 0 && (
                <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 border border-slate-900">
                  {emails.length}
                </span>
              )}
            </button>
            <button
              id="nav-docs"
              onClick={() => setActiveTab("docs")}
              className={`font-black text-xs tracking-widest uppercase h-full border-b-4 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "docs"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              Technical Specs
            </button>
          </nav>

          {/* User badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border-2 border-slate-900 pl-2.5 pr-4 py-1.5 shadow-[2px_2px_0px_rgba(15,23,42,1)]">
              <div className={`w-7 h-7 flex items-center justify-center text-xs font-black text-white shrink-0 border-2 border-slate-900 ${
                isAdmin ? "bg-red-600" : "bg-slate-900"
              }`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight block leading-none mb-0.5">{currentUser.name}</span>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block leading-none">
                  {isAdmin ? "Admin Account" : currentUser.apartment}
                </span>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="p-2 border-2 border-slate-900 text-slate-900 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer shadow-[2px_2px_0px_rgba(15,23,42,1)]"
              title="Logout from portal"
            >
              <LogOut className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Header */}
      <div className="md:hidden bg-white border-b-2 border-slate-900 flex justify-around p-1">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 ${
            activeTab === "tickets" ? "text-slate-900 border-b-4 border-slate-900" : "text-slate-400"
          }`}
        >
          <Wrench className="w-4 h-4" />
          Tickets
        </button>
        <button
          onClick={() => setActiveTab("notices")}
          className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 ${
            activeTab === "notices" ? "text-slate-900 border-b-4 border-slate-900" : "text-slate-400"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Notice Board
        </button>
        <button
          onClick={() => setActiveTab("emails")}
          className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 ${
            activeTab === "emails" ? "text-slate-900 border-b-4 border-slate-900" : "text-slate-400"
          }`}
        >
          <Mail className="w-4 h-4" />
          SMTP Log
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 ${
            activeTab === "docs" ? "text-slate-900 border-b-4 border-slate-900" : "text-slate-400"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Specs
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {activeTab === "tickets" && (
          <div className="space-y-6" id="tickets-tab-content">
            
            {/* Admin Stats Dashboard (Admins Only) */}
            {isAdmin && (
              <AdminDashboard
                stats={stats}
                thresholdDays={thresholdDays}
                onUpdateThreshold={handleUpdateSlaThreshold}
                onRefresh={() => loadAppData()}
              />
            )}

            {/* Resident Instructions panel */}
            {!isAdmin && (
              <div className="bg-amber-100 border-4 border-slate-900 p-5 rounded-none flex items-start gap-3 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1">
                  <span className="font-black uppercase tracking-wider text-slate-900 block text-sm">Resident Helpdesk Hub</span>
                  <p className="font-medium leading-relaxed">
                    Lodge plumbing, electrical, elevator, or other maintenance tickets instantly. Upload supporting photos, trace the active SLA resolution window, and view real-time email logs in the SMTP Outbox panel as statuses shift.
                  </p>
                </div>
              </div>
            )}

            {/* Core Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Panel: Complaints Feed & Filters (Admin: 8 cols, Resident: 7 cols) */}
              <div className={isAdmin ? "lg:col-span-12 xl:col-span-8 space-y-4" : "lg:col-span-7 space-y-4"}>
                
                {/* Search, Filter & Date toolbar */}
                <div className="bg-white p-5 border-4 border-slate-900 rounded-none shadow-[4px_4px_0px_rgba(15,23,42,1)] space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-widest">
                      <SlidersHorizontal className="w-4 h-4 text-slate-900 stroke-[3]" />
                      Filter & Search
                    </span>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      {filteredComplaintsList.length} / {complaints.length} Tickets Found
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-900 absolute left-3 top-3 stroke-[3]" />
                      <input
                        id="search-input"
                        type="text"
                        placeholder="Search desc or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-800 font-bold placeholder-slate-400"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">Status:</span>
                      <select
                        id="filter-status-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-2 py-2.5 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">Type:</span>
                      <select
                        id="filter-category-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-2 py-2.5 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                      >
                        <option value="All">All Categories</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Elevator">Elevator</option>
                        <option value="Security & Gate">Security & Gate</option>
                        <option value="Carpentry & Masonry">Carpentry</option>
                        <option value="Housekeeping & Waste">Housekeeping</option>
                        <option value="Water Supply">Water Supply</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0">Date:</span>
                      <select
                        id="filter-date-select"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full px-2 py-2.5 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                      >
                        <option value="All">All History</option>
                        <option value="Today">Last 24 Hours</option>
                        <option value="3days">Last 3 Days</option>
                        <option value="7days">Last 7 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Complaints Feed List */}
                <div className="space-y-4">
                  {filteredComplaintsList.length === 0 ? (
                    <div className="bg-white p-12 border-4 border-slate-900 rounded-none text-center text-slate-500 text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                      No complaints matched the current query or filters.
                    </div>
                  ) : (
                    filteredComplaintsList.map((cmp) => {
                      const isExpanded = expandedComplaintId === cmp.id;
                      
                      // Priority color mapping
                      const priorityStyles = {
                        High: "bg-red-600 text-white border-slate-900 font-black",
                        Medium: "bg-amber-400 text-slate-950 border-slate-900 font-black",
                        Low: "bg-white text-slate-800 border-slate-900 font-black"
                      };
 
                      // Status color mapping
                      const statusStyles = {
                        Open: "bg-blue-100 text-blue-900 border-slate-900 font-black uppercase tracking-wider text-[10px]",
                        "In Progress": "bg-amber-100 text-amber-900 border-slate-900 font-black uppercase tracking-wider text-[10px]",
                        Resolved: "bg-emerald-100 text-emerald-900 border-slate-900 font-black uppercase tracking-wider text-[10px]"
                      };
 
                      return (
                        <div
                          key={cmp.id}
                          id={`complaint-card-${cmp.id}`}
                          className={`bg-white border-4 border-slate-900 rounded-none transition-all duration-150 overflow-hidden ${
                            isExpanded 
                              ? "shadow-[6px_6px_0px_rgba(15,23,42,1)] translate-x-0.5 translate-y-0.5" 
                              : "shadow-[4px_4px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_rgba(15,23,42,1)]"
                          } ${cmp.overdue && cmp.status !== "Resolved" ? "border-l-[12px] border-l-red-600 bg-red-50/10" : ""}`}
                        >
                          {/* Card Summary Header */}
                          <div
                            onClick={() => {
                              setExpandedComplaintId(isExpanded ? null : cmp.id);
                              // Seed default update values when opening
                              setUpdateStatus(cmp.status);
                              setUpdatePriority(cmp.priority);
                            }}
                            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                          >
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Overdue Alert Banner at the very top of complaints */}
                                {cmp.overdue && cmp.status !== "Resolved" && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black bg-red-600 text-white border-2 border-slate-900 tracking-wider uppercase animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    OVERDUE SLA
                                  </span>
                                )}
                                <span className="text-[10px] font-black text-slate-400 font-mono">#{cmp.id.substring(0, 8)}</span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-slate-900 bg-slate-900 text-white tracking-wider">
                                  {cmp.category}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 border-2 tracking-wider uppercase ${priorityStyles[cmp.priority]}`}>
                                  {cmp.priority} Priority
                                </span>
                              </div>
                              
                              <h4 className="font-black text-slate-900 text-sm md:text-base leading-snug tracking-tight">
                                {cmp.description.substring(0, 100)}
                                {cmp.description.length > 100 ? "..." : ""}
                              </h4>
 
                              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-wrap">
                                <span className="flex items-center gap-1">
                                  <UserIcon className="w-3.5 h-3.5 text-slate-900" />
                                  {cmp.residentName} ({cmp.residentApartment})
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-900" />
                                  Filed {new Date(cmp.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
 
                            {/* Status Indicator Badge */}
                            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                              <span className={`px-3 py-1.5 border-2 font-black ${statusStyles[cmp.status]}`}>
                                {cmp.status}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>

                          {/* Expanded Detailed Timeline view */}
                          {isExpanded && (
                            <div className="border-t-4 border-slate-900 bg-slate-50 p-4 md:p-6 space-y-6">
                              {/* Descriptive details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-3">
                                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">Full Issue Description</h5>
                                  <p className="text-slate-850 text-xs md:text-sm whitespace-pre-wrap leading-relaxed bg-white p-4 border-2 border-slate-900 shadow-[2px_2px_0px_rgba(15,23,42,1)]">
                                    {cmp.description}
                                  </p>
                                </div>

                                {/* Picture preview if exists */}
                                <div className="space-y-3">
                                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">Attached Image Assets</h5>
                                  {cmp.photoUrl ? (
                                    <div className="bg-white p-3 border-2 border-slate-900 flex flex-col items-center shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                                      <img
                                        src={cmp.photoUrl}
                                        alt="Complaint verification"
                                        className="max-h-[160px] object-contain border border-slate-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase mt-2">SOCIETY_EVIDENCE_{cmp.id.substring(0,6)}.PNG</span>
                                    </div>
                                  ) : (
                                    <div className="p-8 border-2 border-dashed border-slate-300 text-center text-xs text-slate-400 font-bold uppercase tracking-wider bg-white">
                                      No attachment upload was recorded.
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Life-cycle Timeline representation */}
                              <div className="space-y-4">
                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-slate-900 stroke-[3]" />
                                  Audit Trail & Status History Timeline
                                </h5>

                                <div className="relative pl-6 border-l-4 border-slate-900 space-y-5 pt-1 ml-2 text-xs">
                                  {cmp.history.map((hist, idx) => (
                                    <div key={hist.id} className="relative">
                                      {/* Indicator bullet */}
                                      <div className={`absolute -left-[32px] top-1.5 w-4 h-4 border-2 border-slate-900 ${
                                        hist.status === "Resolved" 
                                          ? "bg-emerald-400" 
                                          : hist.status === "In Progress" 
                                            ? "bg-amber-400" 
                                            : "bg-blue-400"
                                      }`}></div>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-black text-slate-900 uppercase tracking-tight">
                                            Status set to <span className="underline">"{hist.status}"</span>
                                          </span>
                                          {hist.priority && (
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                              ({hist.priority} Priority)
                                            </span>
                                          )}
                                          <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                            {new Date(hist.timestamp).toLocaleString()}
                                          </span>
                                        </div>

                                        <p className="text-slate-800 text-xs leading-relaxed italic bg-white py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_rgba(15,23,42,1)]">
                                          "{hist.note || "No custom update note entered."}"
                                        </p>

                                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                          <CornerDownRight className="w-3 h-3 text-slate-900 stroke-[3]" />
                                          Actor: {hist.actorName} 
                                          <span className="ml-1.5 px-1.5 py-0.5 border border-slate-900 bg-slate-900 text-white font-black text-[8px] tracking-widest">
                                            {hist.actorRole}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Admin Updates Board */}
                              {isAdmin && cmp.status !== "Resolved" && (
                                <div className="bg-white p-5 border-4 border-slate-900 space-y-4 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-widest">
                                    <SlidersHorizontal className="w-4 h-4 text-slate-900 stroke-[3]" />
                                    Administrative Status & priority Adjuster
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Select Status */}
                                    <div className="space-y-1">
                                      <label className="text-xs font-black uppercase tracking-widest text-slate-700">Update Status</label>
                                      <select
                                        id={`select-update-status-${cmp.id}`}
                                        value={updateStatus}
                                        onChange={(e) => setUpdateStatus(e.target.value as ComplaintStatus)}
                                        className="w-full px-3 py-2 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                                      >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved (Closes Ticket)</option>
                                      </select>
                                    </div>

                                    {/* Select Priority */}
                                    <div className="space-y-1">
                                      <label className="text-xs font-black uppercase tracking-widest text-slate-700">Update Priority</label>
                                      <select
                                        id={`select-update-priority-${cmp.id}`}
                                        value={updatePriority}
                                        onChange={(e) => setUpdatePriority(e.target.value as ComplaintPriority)}
                                        className="w-full px-3 py-2 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                                      >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Update comments */}
                                  <div className="space-y-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-700">Administrative History Notes / Progress Description</label>
                                    <textarea
                                      id={`textarea-update-note-${cmp.id}`}
                                      value={updateNote}
                                      onChange={(e) => setUpdateNote(e.target.value)}
                                      rows={2}
                                      placeholder="E.g. Dispatched plumber John to site, repair work scheduled between 2-4 PM."
                                      className="w-full px-3 py-2 text-xs border-2 border-slate-900 rounded-none focus:outline-none bg-white text-slate-900 font-bold"
                                    />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-normal block mt-1">
                                      Note: Submitting will generate and capture an automated status transition email sent directly to the resident's inbox list.
                                    </span>
                                  </div>

                                  <div className="flex justify-end pt-2">
                                    <button
                                      id={`btn-submit-update-${cmp.id}`}
                                      onClick={() => handleUpdateComplaint(cmp.id)}
                                      disabled={updateLoading}
                                      className="px-5 py-3 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black uppercase tracking-widest border-2 border-slate-900 transition-colors shadow-[2px_2px_0px_rgba(15,23,42,1)] cursor-pointer disabled:bg-slate-400"
                                    >
                                      {updateLoading ? "Saving..." : "Save Status Transition"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Panel: (Create Form + Small Notice widgets for Residents only) */}
              {!isAdmin && (
                <div className="lg:col-span-5 space-y-6">
                  {/* File Complaint Form */}
                  <ComplaintForm
                    currentUser={currentUser}
                    onAddComplaint={handleAddComplaint}
                  />

                  {/* Pinned board preview widget */}
                  <div className="bg-white border-4 border-slate-900 p-5 space-y-4 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-slate-900 stroke-[3]" />
                      Bulletin Quickview
                    </h4>
                    
                    <div className="divide-y-2 divide-slate-950 max-h-[220px] overflow-y-auto space-y-3 pr-1">
                      {notices.slice(0, 3).map(not => (
                        <div key={not.id} className="pt-3 first:pt-0">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                            not.isImportant ? "bg-red-600 text-white border-slate-900" : "bg-white text-slate-900 border-slate-900"
                          }`}>
                            {not.isImportant ? "Important" : "General"}
                          </span>
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight block">{not.title}</span>
                          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{not.content}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveTab("notices")}
                      className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 block text-center pt-3 w-full border-t-2 border-slate-900 cursor-pointer"
                    >
                      Open Full Notice Board →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "notices" && (
          <div id="notices-tab-content" className="max-w-4xl mx-auto">
            <NoticeBoard
              notices={notices}
              currentUser={currentUser}
              onAddNotice={handleAddNotice}
            />
          </div>
        )}

        {activeTab === "emails" && (
          <div id="emails-tab-content">
            <EmailSimulator emails={emails} />
          </div>
        )}

        {activeTab === "docs" && (
          <div id="docs-tab-content">
            <SystemDesignDocs />
          </div>
        )}

      </main>

      {/* Corporate footer */}
      <footer className="bg-slate-900 border-t-4 border-slate-950 py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-12 space-y-2">
        <p>Society Maintenance & SLA Audit Portal. Developed in accordance with Housing Committee guidelines.</p>
        <p className="text-slate-500 font-medium">Built using React 19 + Express 4 Persistent JSON relational mapping.</p>
      </footer>
    </div>
  );
}
