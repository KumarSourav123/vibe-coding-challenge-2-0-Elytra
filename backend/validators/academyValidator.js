import { ROLES } from "@/backend/utils/constants";
import { checkString, createValidator } from "./common";

/** PATCH /api/academy body (docs/API_CONTRACTS.md §2.5d). */
export function validateRenameAcademyInput(body) {
  const v = createValidator();
  const name = checkString(v, "name", body.name, { label: "Academy name", min: 2, max: 100 });
  v.throwIfErrors();
  return { name };
}

/** POST /api/academy/join-codes body (§2.5e). */
export function validateRegenerateCodeInput(body) {
  const v = createValidator();
  if (![ROLES.COACH, ROLES.SCOUT].includes(body.role)) v.add("role", "Role must be COACH or SCOUT");
  v.throwIfErrors();
  return { role: body.role };
}
