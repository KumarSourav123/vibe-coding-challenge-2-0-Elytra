import Badge from "@/frontend/components/ui/Badge";

export default function SessionStatusBadge({ status }) {
  return status === "CLOSED" ? (
    <Badge>Closed</Badge>
  ) : (
    <Badge tone="info" dot>
      Open
    </Badge>
  );
}
