import mongoose from 'mongoose';

const PlayerScoreSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Player reference is required'],
    },
    score: {
      type: Number,
      required: [true, 'Player score is required'],
      default: 0,
      min: [0, 'Score cannot be negative'],
    },
  },
  {
    _id: false,
  }
);

const MatchSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Match date is required'],
    },
    sport: {
      type: String,
      required: [true, 'Sport is required'],
      trim: true,
      lowercase: true,
    },
    opponent: {
      type: String,
      required: [true, 'Opponent team or academy name is required'],
      trim: true,
    },
    participatingPlayers: [PlayerScoreSchema],
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
const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

export default Match;

