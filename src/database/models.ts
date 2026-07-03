import mongoose, { Schema, Document } from "mongoose";
import { 
  Role, 
  ComplaintStatus, 
  ComplaintPriority,
  User as IUser,
  ComplaintHistory as IComplaintHistory,
  Complaint as IComplaint,
  Notice as INotice,
  EmailLog as IEmailLog,
  SystemSettings as ISystemSettings
} from "../types";

// Getter to serialize Date objects to ISO 8601 strings
const isoDateGetter = (val: any): string | any => {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return val;
};

// User Schema
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true, minlength: 2 },
  role: { type: String, required: true, enum: ["admin", "resident"] },
  apartment: { type: String, required: true, trim: true, minlength: 1 },
  password: { type: String, required: true, trim: true, minlength: 6, select: false },
  createdAt: { type: Date, required: true, get: isoDateGetter }
}, {
  timestamps: false,
  versionKey: false,
  toObject: { getters: true },
  toJSON: { getters: true }
});

// Complaint History Schema (embedded subdocument)
export const ComplaintHistorySchema = new Schema({
  id: { type: String, required: true, unique: true, trim: true },
  complaintId: { type: String, required: true, trim: true },
  status: { type: String, required: true, enum: ["Open", "In Progress", "Resolved"] },
  priority: { type: String, enum: ["Low", "Medium", "High"] },
  note: { type: String, trim: true },
  actorName: { type: String, required: true, trim: true },
  actorRole: { type: String, required: true, enum: ["admin", "resident"] },
  timestamp: { type: Date, required: true, get: isoDateGetter }
}, {
  timestamps: false,
  versionKey: false,
  toObject: { getters: true },
  toJSON: { getters: true }
});

// Complaint Schema
const ComplaintSchema = new Schema({
  id: { type: String, required: true, unique: true, trim: true },
  residentId: { type: String, required: true, trim: true, index: true },
  residentName: { type: String, required: true, trim: true },
  residentApartment: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, minlength: 2, index: true },
  description: { type: String, required: true, trim: true, minlength: 5 },
  photoUrl: { type: String, trim: true },
  status: { type: String, required: true, enum: ["Open", "In Progress", "Resolved"], index: true },
  priority: { type: String, required: true, enum: ["Low", "Medium", "High"] },
  createdAt: { type: Date, required: true, index: true, get: isoDateGetter },
  updatedAt: { type: Date, required: true, get: isoDateGetter },
  overdue: { type: Boolean, required: true, default: false },
  history: { type: [ComplaintHistorySchema], default: [] }
}, {
  timestamps: false,
  versionKey: false,
  toObject: { getters: true },
  toJSON: { getters: true }
});

// Notice Schema
const NoticeSchema = new Schema({
  id: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true, minlength: 3 },
  content: { type: String, required: true, trim: true, minlength: 5 },
  isImportant: { type: Boolean, required: true, default: false },
  authorName: { type: String, required: true, trim: true },
  createdAt: { type: Date, required: true, index: true, get: isoDateGetter }
}, {
  timestamps: false,
  versionKey: false,
  toObject: { getters: true },
  toJSON: { getters: true }
});

// Email Log Schema
const EmailLogSchema = new Schema({
  id: { type: String, required: true, unique: true, trim: true },
  recipientEmail: { type: String, required: true, trim: true },
  recipientName: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true, minlength: 3 },
  body: { type: String, required: true, trim: true, minlength: 5 },
  sentAt: { type: Date, required: true, index: true, get: isoDateGetter },
  type: { type: String, required: true, enum: ["status_change", "notice"] },
  status: { type: String, required: false, enum: ["Success", "Failed"] },
  errorMessage: { type: String, required: false }
}, {
  timestamps: false,
  versionKey: false,
  toObject: { getters: true },
  toJSON: { getters: true }
});

// Settings Schema
const SettingsSchema = new Schema({
  overdueThresholdDays: { type: Number, required: true, default: 3 }
}, {
  timestamps: false,
  versionKey: false,
  toObject: { getters: true },
  toJSON: { getters: true }
});

// Compile Models
import fs from "fs";
import path from "path";

// Flag to control fallback behavior
export let useLocalFallback = false;

export function setUseLocalFallback(val: boolean) {
  useLocalFallback = val;
}

const LOCAL_DB_PATH = path.join(process.cwd(), "database.json");

export function readLocalStore() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    return {
      users: [],
      complaints: [],
      notices: [],
      emails: [],
      settings: []
    };
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
  } catch (err) {
    return {
      users: [],
      complaints: [],
      notices: [],
      emails: [],
      settings: []
    };
  }
}

export function writeLocalStore(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write to local store:", err);
  }
}

function matchQuery(item: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  for (const key of Object.keys(query)) {
    const val = query[key];
    const itemVal = item[key];
    if (val && typeof val === "object" && "$regex" in val) {
      const regex = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex);
      if (!regex.test(itemVal || "")) return false;
    } else if (val && typeof val === "object" && "$in" in val) {
      // Basic support for $in if needed
      return true;
    } else {
      if (itemVal !== val) return false;
    }
  }
  return true;
}

export class DocWrapper {
  [key: string]: any;
  private _collectionName: string;

  constructor(data: any, collectionName: string) {
    Object.assign(this, data);
    this._collectionName = collectionName;
  }

  toObject() {
    const obj = { ...this };
    delete obj._collectionName;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }

  get(key: string) {
    return this[key];
  }

  set(key: string, value: any) {
    this[key] = value;
    return this;
  }

  async save() {
    const store = readLocalStore();
    if (!store[this._collectionName]) {
      store[this._collectionName] = [];
    }
    const index = store[this._collectionName].findIndex((item: any) => item.id === this.id);
    const plainData = this.toObject();
    if (index !== -1) {
      store[this._collectionName][index] = plainData;
    } else {
      store[this._collectionName].push(plainData);
    }
    writeLocalStore(store);
    return this;
  }
}

class QueryChain {
  private results: any[];
  private collectionName: string;

  constructor(results: any[], collectionName: string) {
    this.results = results;
    this.collectionName = collectionName;
  }

  select(fields: string) {
    return this;
  }

  sort(sortObj: any) {
    const key = Object.keys(sortObj)[0];
    const dir = sortObj[key];
    this.results.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA === undefined && valB === undefined) return 0;
      if (valA === undefined) return dir === -1 ? 1 : -1;
      if (valB === undefined) return dir === -1 ? -1 : 1;
      
      const timeA = new Date(valA).getTime();
      const timeB = new Date(valB).getTime();
      if (!isNaN(timeA) && !isNaN(timeB)) {
        return dir === -1 ? timeB - timeA : timeA - timeB;
      }
      
      if (valA < valB) return dir === -1 ? 1 : -1;
      if (valA > valB) return dir === -1 ? -1 : 1;
      return 0;
    });
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const wrapped = this.results.map(item => new DocWrapper(item, this.collectionName));
    return Promise.resolve(wrapped).then(onfulfilled, onrejected);
  }
}

class QueryChainOne {
  private result: any;
  private collectionName: string;

  constructor(result: any, collectionName: string) {
    this.result = result;
    this.collectionName = collectionName;
  }

  select(fields: string) {
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const wrapped = this.result ? new DocWrapper(this.result, this.collectionName) : null;
    return Promise.resolve(wrapped).then(onfulfilled, onrejected);
  }
}

class ModelProxy {
  private collectionName: string;
  private realModel: any;

  constructor(collectionName: string, realModel: any) {
    this.collectionName = collectionName;
    this.realModel = realModel;
  }

  async countDocuments() {
    if (!useLocalFallback) {
      try {
        return await this.realModel.countDocuments();
      } catch (err) {
        console.warn("Mongoose query failed, activating local fallback...");
        useLocalFallback = true;
      }
    }
    const store = readLocalStore();
    return (store[this.collectionName] || []).length;
  }

  find(query: any = {}) {
    if (!useLocalFallback) {
      try {
        return this.realModel.find(query);
      } catch (err) {
        console.warn("Mongoose query failed, activating local fallback...");
        useLocalFallback = true;
      }
    }
    const store = readLocalStore();
    const items = store[this.collectionName] || [];
    const filtered = items.filter((item: any) => matchQuery(item, query));
    return new QueryChain(filtered, this.collectionName);
  }

  findOne(query: any = {}) {
    if (!useLocalFallback) {
      try {
        return this.realModel.findOne(query);
      } catch (err) {
        console.warn("Mongoose query failed, activating local fallback...");
        useLocalFallback = true;
      }
    }
    const store = readLocalStore();
    const items = store[this.collectionName] || [];
    const found = items.find((item: any) => matchQuery(item, query));
    return new QueryChainOne(found, this.collectionName);
  }

  async create(docData: any) {
    if (!useLocalFallback) {
      try {
        return await this.realModel.create(docData);
      } catch (err) {
        console.warn("Mongoose query failed, activating local fallback...");
        useLocalFallback = true;
      }
    }
    const store = readLocalStore();
    const plainData = docData instanceof DocWrapper ? docData.toObject() : docData;
    
    if (!plainData.id && this.collectionName !== "settings") {
      plainData.id = "id_" + Math.random().toString(36).substring(2, 11);
    }

    if (!store[this.collectionName]) {
      store[this.collectionName] = [];
    }
    store[this.collectionName].push(plainData);
    writeLocalStore(store);
    return new DocWrapper(plainData, this.collectionName);
  }

  async insertMany(docs: any[]) {
    if (!useLocalFallback) {
      try {
        return await this.realModel.insertMany(docs);
      } catch (err) {
        console.warn("Mongoose query failed, activating local fallback...");
        useLocalFallback = true;
      }
    }
    const store = readLocalStore();
    if (!store[this.collectionName]) {
      store[this.collectionName] = [];
    }
    for (const doc of docs) {
      const plainData = doc instanceof DocWrapper ? doc.toObject() : doc;
      store[this.collectionName].push(plainData);
    }
    writeLocalStore(store);
    return docs.map(d => new DocWrapper(d, this.collectionName));
  }

  async findOneAndUpdate(query: any, update: any, options: any = {}) {
    if (!useLocalFallback) {
      try {
        return await this.realModel.findOneAndUpdate(query, update, options);
      } catch (err) {
        console.warn("Mongoose query failed, activating local fallback...");
        useLocalFallback = true;
      }
    }
    const store = readLocalStore();
    const items = store[this.collectionName] || [];
    const index = items.findIndex((item: any) => matchQuery(item, query));
    if (index === -1) {
      if (options.upsert) {
        const newDoc = { ...query, ...update };
        items.push(newDoc);
        writeLocalStore(store);
        return new DocWrapper(newDoc, this.collectionName);
      }
      return null;
    }
    
    const current = items[index];
    const updated = { ...current, ...update };
    items[index] = updated;
    writeLocalStore(store);
    return new DocWrapper(updated, this.collectionName);
  }
}

const RealUser = mongoose.model<IUser & Document>("User", UserSchema);
const RealComplaint = mongoose.model<IComplaint & Document>("Complaint", ComplaintSchema);
const RealNotice = mongoose.model<INotice & Document>("Notice", NoticeSchema);
const RealEmailLog = mongoose.model<IEmailLog & Document>("EmailLog", EmailLogSchema);
const RealSettings = mongoose.model<ISystemSettings & Document>("Settings", SettingsSchema);

export const User = new ModelProxy("users", RealUser) as any;
export const Complaint = new ModelProxy("complaints", RealComplaint) as any;
export const Notice = new ModelProxy("notices", RealNotice) as any;
export const EmailLog = new ModelProxy("emails", RealEmailLog) as any;
export const Settings = new ModelProxy("settings", RealSettings) as any;


