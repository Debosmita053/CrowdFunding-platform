import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aranyasen993_db_user:your_actual_password@cluster0.pxdxdkf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI || MONGODB_URI.includes('<db_password>') || MONGODB_URI.includes('your_actual_password')) {
  console.warn('⚠️  MongoDB URI not properly configured. Please set up your .env.local file with the correct MONGODB_URI.');
  console.warn('📝 See SETUP.md for detailed instructions.');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
