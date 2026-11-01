import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1'],
      max: [100, 'Age must be realistic'],
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
      lowercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model across Next.js hot reloads
const Player = mongoose.models.Player || mongoose.model('Player', PlayerSchema);

export default Player;

