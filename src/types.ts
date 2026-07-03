export type Role = 'resident' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  apartment: string;
  createdAt: string;
  password?: string;
}

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved';
export type ComplaintPriority = 'Low' | 'Medium' | 'High';

export interface ComplaintHistory {
  id: string;
  complaintId: string;
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  note?: string;
  actorName: string;
  actorRole: Role;
  timestamp: string;
}

export interface Complaint {
  id: string;
  residentId: string;
  residentName: string;
  residentApartment: string;
  category: string;
  description: string;
  photoUrl?: string; // Cloudinary CDN secure URL
  status: ComplaintStatus;
  priority: ComplaintPriority;
  createdAt: string;
  updatedAt: string;
  overdue: boolean;
  history: ComplaintHistory[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  authorName: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  type: 'status_change' | 'notice';
  status?: 'Success' | 'Failed';
  errorMessage?: string;
}

export interface SystemSettings {
  overdueThresholdDays: number; // Configurable overdue threshold
}

export interface DatabaseSchema {
  users: User[];
  complaints: Complaint[];
  notices: Notice[];
  emails: EmailLog[];
  settings: SystemSettings;
}
