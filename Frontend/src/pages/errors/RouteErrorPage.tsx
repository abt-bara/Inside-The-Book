import { Link, isRouteErrorResponse } from "react-router-dom";

type RouteErrorPageProps = {
  error: unknown;
  title: string;
  notFoundMessage: string;
  destination: string;
  destinationLabel: string;
};

function getErrorMessage(error: unknown, notFoundMessage: string): string {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return notFoundMessage;
    }

    return error.statusText || `The request failed with status ${error.status}.`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

export default function RouteErrorPage({
  error,
  title,
  notFoundMessage,
  destination,
  destinationLabel,
}: RouteErrorPageProps) {
  return (
    <main className="route-error" role="alert">
      <p className="route-error__eyebrow">Something went wrong</p>
      <h1 className="route-error__title">{title}</h1>
      <p className="route-error__message">
        {getErrorMessage(error, notFoundMessage)}
      </p>
      <Link className="route-error__link" to={destination}>
        {destinationLabel}
      </Link>
    </main>
  );
}
