import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Windows DNS resolution with MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if not supported in environment
}

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'mentorlagbe_db';

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db = null;

export async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB Database: ${dbName}`);

    // Create Indexes for optimal query performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('tuitions').createIndex({ approvalStatus: 1, isActive: 1 });
    await db.collection('tuitions').createIndex({ tutorEmail: 1 });
    await db.collection('tuitions').createIndex({ subject: 1, classLevel: 1, mode: 1 });
    await db.collection('applications').createIndex({ tuitionId: 1, studentEmail: 1 });
    await db.collection('applications').createIndex({ studentEmail: 1 });
    await db.collection('applications').createIndex({ tutorEmail: 1 });
    await db.collection('payments').createIndex({ userEmail: 1 });
    await db.collection('payments').createIndex({ transactionId: 1 });

    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export function getCollections() {
  const database = getDb();
  return {
    usersCollection: database.collection('users'),
    tuitionsCollection: database.collection('tuitions'),
    applicationsCollection: database.collection('applications'),
    paymentsCollection: database.collection('payments'),
  };
}
