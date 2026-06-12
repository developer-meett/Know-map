import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const TARGET_EMAIL = 'meetsuhagiya420@gmail.com';

async function makeAdmin() {
  if (!MONGO_URI) {
    console.error('❌ Error: MONGO_URI is missing from .env');
    process.exit(1);
  }

  try {
    console.log(`⏳ Connecting to MongoDB Atlas...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!');

    console.log(`⏳ Searching for user: ${TARGET_EMAIL}...`);
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: TARGET_EMAIL },
      { $set: { isAdmin: true, role: 'admin' } }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ User ${TARGET_EMAIL} not found! Please log into the app first to create your account.`);
    } else {
      console.log(`🎉 Success! ${TARGET_EMAIL} is now an Admin.`);
      console.log(`🔄 Please refresh your browser to see the Admin tab.`);
    }
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();
