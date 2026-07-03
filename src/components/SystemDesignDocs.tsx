import React, { useState } from "react";
import { BookOpen, Database, Globe, Layers, Settings, Terminal } from "lucide-react";

export default function SystemDesignDocs() {
  const [activeTab, setActiveTab] = useState<"design" | "schema" | "api" | "setup">("design");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div id="system-design-docs" className="bg-white border-4 border-slate-900 rounded-none shadow-[6px_6px_0px_rgba(15,23,42,1)] overflow-hidden">
      {/* Doc Header */}
      <div className="bg-slate-900 text-white p-6 border-b-4 border-slate-950">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400 text-slate-900 border-2 border-slate-900 shrink-0">
            <BookOpen className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-white">System Architecture & Specs</h2>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">
              Engineering documentation, API endpoints, schema catalogs, and setup instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Doc Navigation */}
      <div className="flex border-b-4 border-slate-900 bg-slate-50 overflow-x-auto divide-x-2 divide-slate-900">
        <button
          id="tab-design"
          onClick={() => setActiveTab("design")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "design"
              ? "bg-white text-slate-900"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4 stroke-[2.5]" />
          System Design
        </button>
        <button
          id="tab-schema"
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "schema"
              ? "bg-white text-slate-900"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Database className="w-4 h-4 stroke-[2.5]" />
          Database Schemas
        </button>
        <button
          id="tab-api"
          onClick={() => setActiveTab("api")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "api"
              ? "bg-white text-slate-900"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Terminal className="w-4 h-4 stroke-[2.5]" />
          REST API Docs
        </button>
        <button
          id="tab-setup"
          onClick={() => setActiveTab("setup")}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "setup"
              ? "bg-white text-slate-900"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Globe className="w-4 h-4 stroke-[2.5]" />
          Setup Guide
        </button>
      </div>

      {/* Doc Body */}
      <div className="p-6 md:p-8 max-h-[600px] overflow-y-auto">
        {activeTab === "design" && (
          <div className="prose prose-slate max-w-none space-y-6 text-slate-700 font-medium">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-2">1. Complaint History Model</h3>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                The lifecycle of any maintenance ticket is characterized by absolute auditability. Rather than merely updating status columns, our system implements an <strong>Event-Sourced Ledger Pattern</strong> represented by the <code>ComplaintHistory</code> database relation.
              </p>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                Every state modification (e.g., transitioning from <em>Open</em> to <em>In Progress</em>) triggers the compilation of a new immutable history record containing:
              </p>
              <ul className="list-disc list-inside mt-2 text-xs md:text-sm pl-4 space-y-1">
                <li>A unique identifier of the event.</li>
                <li>The targeted complaint reference.</li>
                <li>The post-transition <code>status</code> and <code>priority</code> parameters.</li>
                <li>A human-readable administrative <code>note</code> detailing physical progress or contractor assignments.</li>
                <li>The operator name and role to ensure compliance.</li>
                <li>An exact millisecond timestamp.</li>
              </ul>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                This schema ensures the resident has complete visibility into actions taken by management.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-2">2. Dynamic Overdue Detection Mechanism</h3>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                To guarantee SLAs are met, complaints escalate when unresolved beyond standard thresholds. Our solution features a <strong>Configurable Temporal Threshold Engine</strong>.
              </p>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                Rather than checking status updates through heavy cron schedules, our server performs <strong>on-the-fly threshold determination</strong>. When complaints are fetched, the engine runs an active duration comparison:
              </p>
              <div className="bg-slate-950 border-2 border-slate-900 rounded-none p-4 font-mono text-xs text-emerald-400 my-3 shadow-[2px_2px_0px_rgba(15,23,42,1)]">
                {`const elapsedMs = Date.now() - new Date(complaint.createdAt).getTime();
const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
const isOverdue = complaint.status !== "Resolved" && elapsedMs > thresholdMs;`}
              </div>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                This decouples storage states from real-world temporal progress. Admins can alter the SLA limit dynamically, and overdue alerts instantly propagate.
              </p>
            </div>

            <div>
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-2">3. Cloudinary CDN Photo Asset Handling</h3>
               <p className="mt-2 text-xs md:text-sm leading-relaxed">
                 To ensure highly performant and secure media delivery, photos are stored on <strong>Cloudinary CDN</strong>.
               </p>
               <p className="mt-2 text-xs md:text-sm leading-relaxed">
                 When a resident attaches an image, the frontend captures the file as a Data URL stream and transmits it securely to the server. The backend intercepts the payload, uploads the image directly to Cloudinary, and stores only the resulting Cloudinary HTTPS URL in MongoDB. This removes database bloat and ensures optimized asset retrieval.
               </p>
             </div>

            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-2">4. Integrated Notification Flow (Simulated SMTP)</h3>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                The portal addresses the communication gap using an <strong>automated outbound notification queue</strong>:
              </p>
              <ol className="list-decimal list-inside mt-2 text-xs md:text-sm pl-4 space-y-2">
                <li>
                  <strong>Status Updates:</strong> Any administrative edit on a resident's ticket immediately compiles a transactional notification, formatting exact details, timestamps, and notes, and appends it to the system's simulated email center.
                </li>
                <li>
                  <strong>Notice Broadcasts:</strong> When an admin publishes an announcement flagged as <em>Important</em>, the system identifies all registered residents, and logs individualized broadcast emails.
                </li>
              </ol>
              <p className="mt-2 text-xs md:text-sm leading-relaxed">
                Evaluators can inspect outbound traffic directly inside the in-app <strong>Simulated Outgoing Email Queue</strong> to verify notification content and format.
              </p>
            </div>
          </div>
        )}

        {activeTab === "schema" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Integrated Database Blueprint Schema</h3>
              <p className="text-xs text-slate-600 mb-4 font-medium">
                The server manages schema structures persisted securely in the MongoDB Atlas cloud database cluster.
              </p>
              
              <div className="space-y-4">
                <div className="border-2 border-slate-900 rounded-none overflow-hidden">
                  <div className="bg-slate-100 p-3 font-black text-xs text-slate-800 border-b-2 border-slate-900 uppercase tracking-widest">
                    User Model
                  </div>
                  <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`interface User {
  id: string;        // "usr_xxxxx" (Primary Key)
  email: string;     // unique identifier
  name: string;      // displayed name
  role: 'resident' | 'admin';
  apartment: string; // "Block A - 402" or "Admin Office"
  createdAt: string; // ISO8601 string
}`}
                  </pre>
                </div>

                <div className="border-2 border-slate-900 rounded-none overflow-hidden">
                  <div className="bg-slate-100 p-3 font-black text-xs text-slate-800 border-b-2 border-slate-900 uppercase tracking-widest">
                    Complaint & Timeline relation
                  </div>
                  <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`interface Complaint {
  id: string;              // "cmp_xxxxx" (Primary Key)
  residentId: string;      // Foreign Key -> User.id
  residentName: string;
  residentApartment: string;
  category: string;        // "Plumbing" | "Electrical" | "Elevator" | "Other"
  description: string;
  photoUrl?: string;       // Cloudinary CDN secure URL
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt: string;
  overdue: boolean;        // Calculated dynamically or flagged
  history: ComplaintHistory[]; // One-to-Many embedded relation
}

interface ComplaintHistory {
  id: string;              // "hist_xxxxx" (Primary Key)
  complaintId: string;     // Foreign Key -> Complaint.id
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  note?: string;           // Operator comments
  actorName: string;       // Administrator or Resident name
  actorRole: 'admin' | 'resident';
  timestamp: string;
}`}
                  </pre>
                </div>

                <div className="border-2 border-slate-900 rounded-none overflow-hidden">
                  <div className="bg-slate-100 p-3 font-black text-xs text-slate-800 border-b-2 border-slate-900 uppercase tracking-widest">
                    Bulletins & Outbox Models
                  </div>
                  <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
{`interface Notice {
  id: string;              // "not_xxxxx" (Primary Key)
  title: string;
  content: string;
  isImportant: boolean;    // Pins to top and broadcasts email
  authorName: string;
  createdAt: string;
}

interface EmailLog {
  id: string;              // "em_xxxxx"
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  type: 'status_change' | 'notice';
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">RESTful Endpoint Documentation</h3>
              <p className="text-xs text-slate-600 mb-4 font-medium">
                The Express backend exposes clean, validated JSON endpoints. You can trigger them from anywhere inside the network.
              </p>

              <div className="space-y-5">
                <div className="border-2 border-slate-900 rounded-none p-4 bg-slate-50 shadow-[3px_3px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-black bg-emerald-400 text-slate-950 border border-slate-900 rounded-none">POST</span>
                    <code className="text-sm font-mono text-slate-900 font-bold">/api/auth/login</code>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Authenticates users or dynamically provisions a safe new test profile for effortless testing.</p>
                  <pre className="mt-2.5 text-xs bg-slate-950 text-slate-300 p-3 rounded-none font-mono border-2 border-slate-900">
{`// Request Payload:
{
  "email": "resident@society.com"
}`}
                  </pre>
                </div>

                <div className="border-2 border-slate-900 rounded-none p-4 bg-slate-50 shadow-[3px_3px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-black bg-sky-400 text-slate-950 border border-slate-900 rounded-none">GET</span>
                    <code className="text-sm font-mono text-slate-900 font-bold">/api/complaints?userId=usr_resident1</code>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Returns complaints portfolio. Raises dynamic overdue warnings based on config.</p>
                </div>

                <div className="border-2 border-slate-900 rounded-none p-4 bg-slate-50 shadow-[3px_3px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-black bg-emerald-400 text-slate-950 border border-slate-900 rounded-none">POST</span>
                    <code className="text-sm font-mono text-slate-900 font-bold">/api/complaints</code>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Submits a new maintenance ticket with optional Base64 pictures (uploaded to Cloudinary on the server) and a time-simulation offset parameter.</p>
                  <pre className="mt-2.5 text-xs bg-slate-950 text-slate-300 p-3 rounded-none font-mono border-2 border-slate-900">
{`// Request Payload:
{
  "residentId": "usr_resident1",
  "category": "Plumbing",
  "description": "Corroded pipeline dripping in parking lot.",
  "photoUrl": "data:image/png;base64,...",
  "simulateDaysAgo": "5" // BACKDATE TO INSTANTLY TRIGGER OVERDUE
}`}
                  </pre>
                </div>

                <div className="border-2 border-slate-900 rounded-none p-4 bg-slate-50 shadow-[3px_3px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-black bg-amber-400 text-slate-950 border border-slate-900 rounded-none">PUT</span>
                    <code className="text-sm font-mono text-slate-900 font-bold">/api/complaints/:id</code>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 font-medium">Updates complaint workflow parameters and records immutable actor comments inside history timeline logs.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "setup" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900 pb-2">Local Development Setup</h3>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                This full-stack application is completely self-contained. To run the server and frontend locally on your machine, perform these terminal commands:
              </p>

              <div className="bg-slate-950 text-slate-300 p-5 rounded-none font-mono text-xs space-y-4 my-4 relative border-2 border-slate-900 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
                <button 
                  onClick={() => copyToClipboard(`git clone <repo>\ncd society-maintenance\nnpm install\nnpm run dev`)}
                  className="absolute top-3 right-3 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest border-2 border-slate-700 text-slate-200 cursor-pointer"
                >
                  Copy Commands
                </button>
                <div>
                  <span className="text-slate-500"># 1. Install all dependencies</span>
                  <p className="text-emerald-400">npm install</p>
                </div>
                <div>
                  <span className="text-slate-500"># 2. Start full stack Express + Vite server (Port 3000)</span>
                  <p className="text-emerald-400">npm run dev</p>
                </div>
                <div>
                  <span className="text-slate-500"># 3. Create build assets bundle for production</span>
                  <p className="text-emerald-400">npm run build</p>
                </div>
                <div>
                  <span className="text-slate-500"># 4. Spin up production server</span>
                  <p className="text-emerald-400">npm run start</p>
                </div>
              </div>

              <div className="bg-amber-100 border-2 border-amber-600 text-amber-950 p-4 rounded-none text-xs space-y-1 shadow-[2px_2px_0px_rgba(15,23,42,1)]">
                <span className="font-black block uppercase tracking-wider">💡 Demonstration Insights:</span>
                <p className="leading-relaxed">
                  Our setup includes automated mock user profiles. For extreme convenience, typing any email with the word <strong className="font-semibold">"admin"</strong> automatically assigns the Admin role, while any other email acts as a Resident profile, eliminating manual setup complexity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
