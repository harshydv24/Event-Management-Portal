import 'dotenv/config';
import mongoose from 'mongoose';
import admin from '../config/firebaseAdmin.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Club from '../models/Club.js';
import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';

interface MigrationStats {
  collection: string;
  totalFound: number;
  migrated: number;
  errors: number;
}

const stats: MigrationStats[] = [];

/**
 * Safely convert Firestore timestamp or date string to Date object.
 */
const toDate = (val: unknown): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};

/**
 * Migrate the 'users' collection from Firestore to MongoDB.
 */
const migrateUsers = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('\n👤 Migrating Users...');
  const stat: MigrationStats = { collection: 'users', totalFound: 0, migrated: 0, errors: 0 };
  stats.push(stat);

  try {
    const snapshot = await db.collection('users').get();
    stat.totalFound = snapshot.size;

    if (snapshot.empty) {
      console.log('   ℹ️ No users found in Firestore.');
      return;
    }

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        await User.updateOne(
          { _id: doc.id },
          {
            $set: {
              _id: doc.id,
              email: data.email || `${doc.id}@migrated.local`,
              name: data.name || data.displayName || 'Unknown User',
              role: ['student', 'club', 'department'].includes(data.role) ? data.role : 'student',
              uid: data.uid || data.universityId || undefined,
              clubId: data.clubId || undefined,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
            },
          },
          { upsert: true }
        );
        stat.migrated++;
      } catch (err) {
        stat.errors++;
        console.error(`   ❌ Failed to migrate user ${doc.id}:`, err);
      }
    }
    console.log(`   ✅ Users migrated: ${stat.migrated}/${stat.totalFound} (errors: ${stat.errors})`);
  } catch (error) {
    console.warn('   ⚠️ Could not read users collection from Firestore (skipping):', (error as Error).message);
  }
};

/**
 * Migrate the 'clubs' collection from Firestore to MongoDB.
 */
const migrateClubs = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('\n🏛️ Migrating Clubs...');
  const stat: MigrationStats = { collection: 'clubs', totalFound: 0, migrated: 0, errors: 0 };
  stats.push(stat);

  try {
    const snapshot = await db.collection('clubs').get();
    stat.totalFound = snapshot.size;

    if (snapshot.empty) {
      console.log('   ℹ️ No clubs found in Firestore.');
      return;
    }

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        await Club.updateOne(
          { _id: doc.id },
          {
            $set: {
              _id: doc.id,
              name: data.name || 'Unnamed Club',
              description: data.description || '',
              logo: data.logo || undefined,
              facultyAdvisor: data.facultyAdvisor || {
                id: 'migrated-advisor',
                name: 'Faculty Advisor',
                designation: 'Advisor',
                isFacultyAdvisor: true,
              },
              president: data.president || {
                id: 'migrated-president',
                name: 'Club President',
                designation: 'President',
                isPresident: true,
              },
              coreTeam: Array.isArray(data.coreTeam) ? data.coreTeam : [],
              eventsCount: typeof data.eventsCount === 'number' ? data.eventsCount : 0,
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
            },
          },
          { upsert: true }
        );
        stat.migrated++;
      } catch (err) {
        stat.errors++;
        console.error(`   ❌ Failed to migrate club ${doc.id}:`, err);
      }
    }
    console.log(`   ✅ Clubs migrated: ${stat.migrated}/${stat.totalFound} (errors: ${stat.errors})`);
  } catch (error) {
    console.warn('   ⚠️ Could not read clubs collection from Firestore (skipping):', (error as Error).message);
  }
};

/**
 * Migrate the 'events' collection from Firestore to MongoDB.
 */
const migrateEvents = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('\n📅 Migrating Events...');
  const stat: MigrationStats = { collection: 'events', totalFound: 0, migrated: 0, errors: 0 };
  stats.push(stat);

  try {
    const snapshot = await db.collection('events').get();
    stat.totalFound = snapshot.size;

    if (snapshot.empty) {
      console.log('   ℹ️ No events found in Firestore.');
      return;
    }

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const validStatuses = ['pending_approval', 'approved', 'rejected', 'venue_selected', 'completed'];
        const status = validStatuses.includes(data.status) ? data.status : 'pending_approval';

        await Event.updateOne(
          { name: data.name, clubId: data.clubId },
          {
            $set: {
              name: data.name || 'Untitled Event',
              description: data.description || '',
              date: data.date || new Date().toISOString().split('T')[0],
              time: data.time || undefined,
              venue: data.venue || undefined,
              expectedParticipants: typeof data.expectedParticipants === 'number' ? data.expectedParticipants : 50,
              guestName: data.guestName || undefined,
              poster: data.poster || undefined,
              proposalPdf: data.proposalPdf || undefined,
              m2mPdf: data.m2mPdf || undefined,
              clubId: data.clubId || 'general',
              clubName: data.clubName || 'General Club',
              departmentName: data.departmentName || undefined,
              organizerName: data.organizerName || undefined,
              status,
              feedback: data.feedback || undefined,
              participants: Array.isArray(data.participants) ? data.participants : [],
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
            },
          },
          { upsert: true }
        );
        stat.migrated++;
      } catch (err) {
        stat.errors++;
        console.error(`   ❌ Failed to migrate event ${doc.id}:`, err);
      }
    }
    console.log(`   ✅ Events migrated: ${stat.migrated}/${stat.totalFound} (errors: ${stat.errors})`);
  } catch (error) {
    console.warn('   ⚠️ Could not read events collection from Firestore (skipping):', (error as Error).message);
  }
};

/**
 * Migrate the 'announcements' collection from Firestore to MongoDB.
 */
const migrateAnnouncements = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('\n📢 Migrating Announcements...');
  const stat: MigrationStats = { collection: 'announcements', totalFound: 0, migrated: 0, errors: 0 };
  stats.push(stat);

  try {
    const snapshot = await db.collection('announcements').get();
    stat.totalFound = snapshot.size;

    if (snapshot.empty) {
      console.log('   ℹ️ No announcements found in Firestore.');
      return;
    }

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        await Announcement.updateOne(
          { title: data.title, clubId: data.clubId },
          {
            $set: {
              title: data.title || 'Announcement',
              content: data.content || '',
              clubId: data.clubId || 'general',
              clubName: data.clubName || 'General Club',
              authorId: data.authorId || 'admin',
              authorName: data.authorName || 'Administrator',
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
            },
          },
          { upsert: true }
        );
        stat.migrated++;
      } catch (err) {
        stat.errors++;
        console.error(`   ❌ Failed to migrate announcement ${doc.id}:`, err);
      }
    }
    console.log(`   ✅ Announcements migrated: ${stat.migrated}/${stat.totalFound} (errors: ${stat.errors})`);
  } catch (error) {
    console.warn('   ⚠️ Could not read announcements collection from Firestore (skipping):', (error as Error).message);
  }
};

/**
 * Migrate the 'notifications' collection from Firestore to MongoDB.
 */
const migrateNotifications = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('\n🔔 Migrating Notifications...');
  const stat: MigrationStats = { collection: 'notifications', totalFound: 0, migrated: 0, errors: 0 };
  stats.push(stat);

  try {
    const snapshot = await db.collection('notifications').get();
    stat.totalFound = snapshot.size;

    if (snapshot.empty) {
      console.log('   ℹ️ No notifications found in Firestore.');
      return;
    }

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        await Notification.updateOne(
          { userId: data.userId, message: data.message },
          {
            $set: {
              userId: data.userId || 'unknown',
              role: ['student', 'club', 'department'].includes(data.role) ? data.role : 'student',
              message: data.message || '',
              relatedEventId: data.relatedEventId || undefined,
              isRead: Boolean(data.isRead),
              createdAt: toDate(data.createdAt),
              updatedAt: toDate(data.updatedAt),
            },
          },
          { upsert: true }
        );
        stat.migrated++;
      } catch (err) {
        stat.errors++;
        console.error(`   ❌ Failed to migrate notification ${doc.id}:`, err);
      }
    }
    console.log(`   ✅ Notifications migrated: ${stat.migrated}/${stat.totalFound} (errors: ${stat.errors})`);
  } catch (error) {
    console.warn('   ⚠️ Could not read notifications collection from Firestore (skipping):', (error as Error).message);
  }
};

/**
 * Main migration entry point.
 */
const runMigration = async () => {
  console.log('===========================================================');
  console.log('🚀 Starting Firestore → MongoDB Data Migration Tool');
  console.log('===========================================================');

  await connectDB();
  const firestore = admin.firestore();

  await migrateUsers(firestore);
  await migrateClubs(firestore);
  await migrateEvents(firestore);
  await migrateAnnouncements(firestore);
  await migrateNotifications(firestore);

  console.log('\n===========================================================');
  console.log('📊 MIGRATION SUMMARY REPORT');
  console.log('===========================================================');
  console.table(stats);

  await mongoose.disconnect();
  console.log('✅ Migration process finished successfully. MongoDB connection closed.\n');
};

runMigration().catch((error) => {
  console.error('\n❌ Fatal migration error:', error);
  process.exit(1);
});

