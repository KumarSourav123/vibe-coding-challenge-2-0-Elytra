import mongoose from 'mongoose';

const AttendanceRecordSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player ID is required for attendance'],
    },
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: {
        values: ['present', 'absent'],
        message: '{VALUE} must be either "present" or "absent"',
      },
      lowercase: true,
      trim: true,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const SessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['open', 'closed'],
        message: 'Status must be either "open" or "closed"',
      },
      default: 'open',
      lowercase: true,
    },
    attendance: [AttendanceRecordSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model across Next.js hot reloads
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

export default Session;

