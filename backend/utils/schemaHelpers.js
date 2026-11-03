import mongoose from "mongoose";

/**
 * Validator: every entry in a sub-document array references a distinct player.
 * Used to prevent duplicate attendance and duplicate match participation.
 */
export const uniquePlayersValidator = {
  validator(entries) {
    const ids = entries.map((entry) => String(entry.player));
    return new Set(ids).size === ids.length;
  },
  message: "Each player can appear only once",
};

/** Required academy reference shared by every tenant-scoped model. */
export const academyField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Academy",
  required: [true, "Academy is required"],
  index: true,
};

/** Expose `id` instead of `_id` and hide `__v` when documents are serialised. */
export function toJSONTransform(_doc, ret) {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
}
