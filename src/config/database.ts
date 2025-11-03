import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.DB_HOST
      ? `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'launchpad'}`
      : 'mongodb://localhost:27017/launchpad';

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default connectDB;
