import Button from "./Button";
import Card from "./Card";
import EmptyState from "./EmptyState";

/** Friendly "not found" panel for detail pages, with a link back to the list. */
export default function NotFoundCard({ title, description, backHref, backLabel }) {
  return (
    <Card>
      <EmptyState
        icon="search"
        title={title}
        description={description}
        action={
          <Button href={backHref} variant="secondary" size="sm">
            {backLabel}
          </Button>
        }
      />
    </Card>
  );
}
