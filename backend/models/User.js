import mongoose from "mongoose";
import { ROLES } from "@/backend/utils/constants";
import { PASSWORD_HASH_PATTERN } from "@/backend/utils/password";
import { academyField, toJSONTransform } from "@/backend/utils/schemaHelpers";

/**
 * Login account for Coach, Player and Scout.
 * `passwordHash` only accepts values produced by hashPassword(), so a
 * plain-text password can never be saved by mistake.
 */
const userSchema = new mongoose.Schema(
  {
    academy: academyField,
    // The academy creator; only the Head Coach manages join codes and the academy name.
    isHeadCoach: { type: Boolean, default: false },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is invalid"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      match: [PASSWORD_HASH_PATTERN, "Password must be hashed before saving"],
      select: false,
    },
    role: {
      type: String,
      enum: { values: Object.values(ROLES), message: "Role must be COACH, PLAYER or SCOUT" },
      required: [true, "Role is required"],
    },
    // Linked player profile; set only for PLAYER accounts.
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    // True while the user has a temporary password set by a Coach.
    mustChangePassword: { type: Boolean, default: false },
    // Must match the `sv` claim in the session token; incrementing it signs
    // the user out everywhere (password change/reset).
    sessionVersion: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        toJSONTransform(doc, ret);
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.path("player").validate(function validatePlayerLink(value) {
  return this.role === ROLES.PLAYER || value == null;
}, "Only PLAYER accounts can be linked to a player profile");

// At most one login account per player profile.
userSchema.index(
  { player: 1 },
  { unique: true, partialFilterExpression: { player: { $type: "objectId" } } }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
