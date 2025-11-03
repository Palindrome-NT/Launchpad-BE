import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI as string

    await mongoose.connect(mongoURI);

    console.log('✅ MongoDB Connected Successfully', mongoURI);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default connectDB;
