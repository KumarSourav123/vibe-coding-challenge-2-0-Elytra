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

/** Expose `id` instead of `_id` and hide `__v` when documents are serialised. */
export function toJSONTransform(_doc, ret) {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
}
