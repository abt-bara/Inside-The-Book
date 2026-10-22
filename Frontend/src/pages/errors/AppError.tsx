import { useRouteError } from "react-router-dom";
import { booksPagePath } from "../../services/pagePaths";
import RouteErrorPage from "./RouteErrorPage";

export default function AppError() {
  const error = useRouteError();

  return (
    <RouteErrorPage
      error={error}
      title="This page could not be opened"
      notFoundMessage="The page you requested could not be found."
      destination={booksPagePath}
      destinationLabel="Go to all books"
    />
  );
}
