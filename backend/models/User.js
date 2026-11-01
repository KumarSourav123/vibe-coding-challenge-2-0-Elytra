import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Hidden by default on queries
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['coach', 'player', 'scout'],
        message: '{VALUE} is not a valid user role',
      },
      lowercase: true,
      trim: true,
    },
    sport: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model across Next.js hot reloads
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;

