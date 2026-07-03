import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User, Complaint, Notice, EmailLog, Settings } from "./models";

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing. Please configure it in your environment or Settings menu.");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    // Configure serverSelectionTimeoutMS to fail quickly (5s) instead of hanging the startup loop
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected successfully to MongoDB Atlas.");

    // Run seeding check
    await seedDatabaseIfNeeded();

    // Run password migration if any existing users have plain text or no passwords
    await migratePasswordsIfNeeded();
  } catch (error) {
    console.error("Error connecting to MongoDB database:", error);
    console.warn("\n======================================================================");
    console.warn("⚠️ NOTICE: FAILED TO CONNECT TO MONGODB ATLAS CLOUD DATABASE.");
    console.warn("This is usually because your current IP address is not on your MongoDB Atlas cluster's IP whitelist.");
    console.warn("To connect to your cloud database, please whitelist '0.0.0.0/0' (all IPs) in your Atlas Network Access settings.");
    console.warn("======================================================================\n");
    throw error;
  }
}


export async function migratePasswordsIfNeeded() {
  try {
    const users = await User.find({}).select("+password");
    console.log(`Checking ${users.length} users for password hashing/migration...`);
    let migratedCount = 0;
    for (const user of users) {
      const currentPassword = user.get("password");
      
      // A bcrypt hash always starts with $2 and is 60 chars long
      const isHashed = typeof currentPassword === "string" && 
                       currentPassword.length === 60 && 
                       (currentPassword.startsWith("$2b$") || currentPassword.startsWith("$2a$") || currentPassword.startsWith("$2y$"));
      
      if (!isHashed) {
        // Migration required
        const plainPassword = typeof currentPassword === "string" && currentPassword ? currentPassword : "password123";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        user.set("password", hashedPassword);
        await user.save();
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`Successfully migrated/hashed passwords for ${migratedCount} users.`);
    } else {
      console.log("All existing user passwords are secure and hashed.");
    }
  } catch (error) {
    console.error("Failed to migrate passwords:", error);
  }
}

export async function seedDatabaseIfNeeded() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("Database already initialized. Skipping seeding.");
      return;
    }

    console.log("Database is empty. Initiating high-fidelity data seeding...");

    // 1. Seed Users (passwords hashed using bcryptSync)
    const defaultPasswordHash = bcrypt.hashSync("password123", 10);
    const initialUsers = [
      {
        id: "usr_admin1",
        email: "admin@society.com",
        name: "Sarah Jenkins (Admin)",
        role: "admin",
        apartment: "Admin Office",
        password: defaultPasswordHash,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "usr_resident1",
        email: "john@society.com",
        name: "John Doe",
        role: "resident",
        apartment: "Block A - 402",
        password: defaultPasswordHash,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "usr_resident2",
        email: "alice@society.com",
        name: "Alice Smith",
        role: "resident",
        apartment: "Block B - 105",
        password: defaultPasswordHash,
        createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    await User.insertMany(initialUsers);

    // 2. Seed Complaints
    const initialComplaints = [
      {
        id: "cmp_1",
        residentId: "usr_resident1",
        residentName: "John Doe",
        residentApartment: "Block A - 402",
        category: "Elevator",
        description: "The lift gets stuck frequently when descending past the 3rd floor. The digital panel displays an intermittent error. Please inspect immediately.",
        status: "In Progress",
        priority: "High",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        overdue: false,
        photoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%231e293b'/><circle cx='200' cy='150' r='60' fill='%23ef4444' opacity='0.8'/><path d='M200 110 L200 190 M160 150 L240 150' stroke='white' stroke-width='6'/><text x='50%' y='90%' fill='white' font-family='sans-serif' font-size='16' text-anchor='middle'>Block A Elevator Failure</text></svg>",
        history: [
          {
            id: "hist_1a",
            complaintId: "cmp_1",
            status: "Open",
            priority: "Medium",
            note: "Complaint submitted by resident.",
            actorName: "John Doe",
            actorRole: "resident",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "hist_1b",
            complaintId: "cmp_1",
            status: "In Progress",
            priority: "High",
            note: "Elevator maintenance engineers from Otis notified. Cable alignment issue suspected.",
            actorName: "Sarah Jenkins (Admin)",
            actorRole: "admin",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: "cmp_2",
        residentId: "usr_resident2",
        residentName: "Alice Smith",
        residentApartment: "Block B - 105",
        category: "Plumbing",
        description: "Continuous water seepage discovered in basement parking slot B-12. Main overhead pipes are corroded and dripping rapidly.",
        status: "Open",
        priority: "Medium",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        overdue: false,
        photoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%230f172a'/><path d='M150 150 Q 200 80 250 150 T 350 150' fill='none' stroke='%2338bdf8' stroke-width='6'/><circle cx='200' cy='180' r='10' fill='%2338bdf8'/><text x='50%' y='90%' fill='white' font-family='sans-serif' font-size='16' text-anchor='middle'>Water Seepage Parking Slot B-12</text></svg>",
        history: [
          {
            id: "hist_2a",
            complaintId: "cmp_2",
            status: "Open",
            priority: "Medium",
            note: "Water leakage reported. Dampening the ceiling structure.",
            actorName: "Alice Smith",
            actorRole: "resident",
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: "cmp_3",
        residentId: "usr_resident2",
        residentName: "Alice Smith",
        residentApartment: "Block B - 105",
        category: "Electrical",
        description: "High-voltage halogen streetlight at the entrance corridor is flickering violently, causing visual discomfort and dark zones.",
        status: "Resolved",
        priority: "Low",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        overdue: false,
        photoUrl: "",
        history: [
          {
            id: "hist_3a",
            complaintId: "cmp_3",
            status: "Open",
            priority: "Low",
            note: "Streetlight flickering.",
            actorName: "Alice Smith",
            actorRole: "resident",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "hist_3b",
            complaintId: "cmp_3",
            status: "Resolved",
            priority: "Low",
            note: "Halogen bulb and choke replaced by maintenance team. Re-verified stability.",
            actorName: "Sarah Jenkins (Admin)",
            actorRole: "admin",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ];
    await Complaint.insertMany(initialComplaints);

    // 3. Seed Notices
    const initialNotices = [
      {
        id: "not_1",
        title: "Rescheduled Annual General Meeting (AGM)",
        content: "Dear Residents,\n\nPlease take notice that the Annual General Meeting (AGM) originally scheduled for this Saturday has been rescheduled to next Sunday, July 12th, at 10:00 AM at the central amphitheater. Agenda items include structural audits and financial budgeting for 2026. Important items will be voted upon. Attendance is highly encouraged.\n\nWarm regards,\nManagement Committee.",
        isImportant: true,
        authorName: "Sarah Jenkins (Admin)",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "not_2",
        title: "Quarterly Pest Control Sprinkling Session",
        content: "Pest control and fumigation drive will be carried out across all corridors, basements, gardens, and drainage systems this Saturday between 9:00 AM and 1:00 PM. Kindly keep your entrance doors shut and ensure children do not step into common playground areas during this timeframe.",
        isImportant: false,
        authorName: "Sarah Jenkins (Admin)",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    await Notice.insertMany(initialNotices);

    // 4. Seed Emails
    const initialEmails = [
      {
        id: "em_1",
        recipientEmail: "john@society.com",
        recipientName: "John Doe",
        subject: "Update: Complaint #cmp_1 Status changed to In Progress",
        body: "Hello John Doe,\n\nYour complaint #cmp_1 regarding 'Elevator' has been updated to 'In Progress' by Sarah Jenkins (Admin).\n\nComments: Elevator maintenance engineers from Otis notified. Cable alignment issue suspected.\n\nYou can track the progress and full history through the portal.\n\nBest Regards,\nSociety Helpdesk",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: "status_change"
      },
      {
        id: "em_2",
        recipientEmail: "alice@society.com",
        recipientName: "Alice Smith",
        subject: "Update: Complaint #cmp_3 Status changed to Resolved",
        body: "Hello Alice Smith,\n\nYour complaint #cmp_3 regarding 'Electrical' has been updated to 'Resolved' by Sarah Jenkins (Admin).\n\nComments: Halogen bulb and choke replaced by maintenance team. Re-verified stability.\n\nThis ticket is now closed. Thank you for flagging this concern.\n\nBest Regards,\nSociety Helpdesk",
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        type: "status_change"
      }
    ];
    await EmailLog.insertMany(initialEmails);

    // 5. Seed Settings
    const initialSettings = {
      overdueThresholdDays: 3
    };
    await Settings.create(initialSettings);

    console.log("Database seeded successfully with initial data.");
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
