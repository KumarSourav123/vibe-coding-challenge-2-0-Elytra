import Badge from "@/frontend/components/ui/Badge";

/** Active/Inactive status plus a note while the player still has a temporary password. */
export default function PlayerStatusBadges({ player }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <Badge tone={player.isActive ? "success" : "neutral"} dot>
        {player.isActive ? "Active" : "Inactive"}
      </Badge>
      {player.account?.mustChangePassword && <Badge tone="warning">Temporary password</Badge>}
      {!player.account && <Badge tone="danger">No login</Badge>}
    </span>
  );
}
