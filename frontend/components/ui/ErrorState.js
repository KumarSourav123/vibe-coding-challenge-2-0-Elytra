import Alert from "./Alert";
import Button from "./Button";

/** Shows a failed apiRequest result, with the right next step for auth errors. */
export default function ErrorState({ result, onRetry, title = "Something went wrong" }) {
  if (result?.code === "UNAUTHENTICATED") {
    return (
      <Alert tone="warning" title="Your session has ended">
        <p>Please sign in again to continue.</p>
        <Button href="/login" size="sm" className="mt-3">
          Sign in
        </Button>
      </Alert>
    );
  }

  if (result?.code === "PASSWORD_CHANGE_REQUIRED") {
    return (
      <Alert tone="warning" title="Change your password first">
        <p>{result.message}</p>
        <Button href="/account/password" size="sm" className="mt-3">
          Change password
        </Button>
      </Alert>
    );
  }

  return (
    <Alert tone="danger" title={title}>
      <p>{result?.message ?? "Please try again."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon="refresh" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
