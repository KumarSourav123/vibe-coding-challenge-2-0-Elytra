import { ROLE_CARDS } from "../data/roles";
import RoleCard from "./RoleCard";

export default function RoleCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {ROLE_CARDS.map(({ key, ...role }) => (
        <RoleCard key={key} {...role} />
      ))}
    </div>
  );
}
