import mongoose from "mongoose";
import { normalizeSport } from "@/backend/utils/sport";
import { academyField, toJSONTransform } from "@/backend/utils/schemaHelpers";

/** Player profile created by a Coach (core rule #1: name, age, sport). */
const playerSchema = new mongoose.Schema(
  {
    academy: academyField,
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [5, "Age must be at least 5"],
      max: [60, "Age must be at most 60"],
      validate: { validator: Number.isInteger, message: "Age must be a whole number" },
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
      set: normalizeSport,
      maxlength: [50, "Sport must be at most 50 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { transform: toJSONTransform } }
);

playerSchema.index({ sport: 1, isActive: 1 });

const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

export default Player;
