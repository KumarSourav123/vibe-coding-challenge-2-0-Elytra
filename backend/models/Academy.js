import mongoose from "mongoose";
import { JOIN_CODE_PATTERN } from "@/backend/utils/joinCode";
import { toJSONTransform } from "@/backend/utils/schemaHelpers";

/**
 * An academy (tenant). Every User, Player, Session and Match belongs to one,
 * and all queries are scoped to the signed-in user's academy.
 * Join codes decide the role of people who join: coach code -> COACH, scout code -> SCOUT.
 */
const academySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Academy name is required"],
      trim: true,
      minlength: [2, "Academy name must be at least 2 characters"],
      maxlength: [100, "Academy name must be at most 100 characters"],
    },
    coachJoinCode: {
      type: String,
      required: true,
      unique: true,
      match: [JOIN_CODE_PATTERN, "Invalid join code format"],
    },
    scoutJoinCode: {
      type: String,
      required: true,
      unique: true,
      match: [JOIN_CODE_PATTERN, "Invalid join code format"],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        toJSONTransform(doc, ret);
        // Join codes are secrets - only the academy service exposes them, to Head Coaches.
        delete ret.coachJoinCode;
        delete ret.scoutJoinCode;
        return ret;
      },
    },
  }
);

const Academy = mongoose.models.Academy || mongoose.model("Academy", academySchema);

export default Academy;
