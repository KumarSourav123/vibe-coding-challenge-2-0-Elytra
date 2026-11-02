import mongoose from "mongoose";
import { normalizeSport } from "@/backend/utils/sport";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "@/backend/utils/constants";
import { toJSONTransform, uniquePlayersValidator } from "@/backend/utils/schemaHelpers";

/**
 * Practice session (core rules #2-#5).
 * Attendance is embedded so a session and its attendance are read and closed
 * together. Closed-session immutability is enforced in the Phase 4 service.
 */
const attendanceSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Player is required"],
    },
    status: {
      type: String,
      enum: { values: Object.values(ATTENDANCE_STATUS), message: "Status must be PRESENT or ABSENT" },
      required: [true, "Attendance status is required"],
    },
    markedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    // Calendar day of the session, stored as UTC midnight (see API_CONTRACTS.md).
    date: { type: Date, required: [true, "Date is required"] },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
      set: normalizeSport,
      maxlength: [50, "Sport must be at most 50 characters"],
    },
    status: {
      type: String,
      enum: { values: Object.values(SESSION_STATUS), message: "Status must be OPEN or CLOSED" },
      default: SESSION_STATUS.OPEN,
    },
    attendance: {
      type: [attendanceSchema],
      default: [],
      validate: uniquePlayersValidator,
    },
    closedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true, toJSON: { transform: toJSONTransform } }
);

sessionSchema.index({ date: 1, sport: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ "attendance.player": 1 });

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;
