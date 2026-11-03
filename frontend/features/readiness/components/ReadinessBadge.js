import Badge from "@/frontend/components/ui/Badge";

export default function ReadinessBadge({ isReady }) {
  return (
    <Badge tone={isReady ? "success" : "warning"} dot>
      {isReady ? "Ready" : "Not ready"}
    </Badge>
  );
}
