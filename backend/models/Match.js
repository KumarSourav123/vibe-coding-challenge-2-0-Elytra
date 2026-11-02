import mongoose from "mongoose";
import { normalizeSport } from "@/backend/utils/sport";
import { toJSONTransform, uniquePlayersValidator } from "@/backend/utils/schemaHelpers";

/**
 * Match with per-player scores (core rules #6-#8).
 * Participation is validated against same-date, same-sport attendance in the
 * Phase 5 service; the schema only guarantees structural integrity.
 */
const participantSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Player is required"],
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [0, "Score cannot be negative"],
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    // Calendar day of the match, stored as UTC midnight (see API_CONTRACTS.md).
    date: { type: Date, required: [true, "Date is required"] },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
      set: normalizeSport,
      maxlength: [50, "Sport must be at most 50 characters"],
    },
    opponent: {
      type: String,
      required: [true, "Opponent is required"],
      trim: true,
      maxlength: [100, "Opponent must be at most 100 characters"],
    },
    participants: {
      type: [participantSchema],
      default: [],
      validate: uniquePlayersValidator,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, toJSON: { transform: toJSONTransform } }
);

matchSchema.index({ date: 1, sport: 1 });
matchSchema.index({ "participants.player": 1 });

const Match = mongoose.models.Match || mongoose.model("Match", matchSchema);

export default Match;
