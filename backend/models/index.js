// Single import point for all models, so every model is registered before
// any `populate()` call references it.
export { default as Academy } from "./Academy";
export { default as User } from "./User";
export { default as Player } from "./Player";
export { default as Session } from "./Session";
export { default as Match } from "./Match";
