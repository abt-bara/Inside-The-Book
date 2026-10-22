import { useRouteError } from "react-router-dom";
import { booksPagePath } from "../../services/pagePaths";
import RouteErrorPage from "./RouteErrorPage";

export default function BookDetailsPageError() {
  const error = useRouteError();

  return (
    <RouteErrorPage
      error={error}
      title="This book could not be loaded"
      notFoundMessage="This book could not be found. It may have been removed."
      destination={booksPagePath}
      destinationLabel="Back to all books"
    />
  );
}
