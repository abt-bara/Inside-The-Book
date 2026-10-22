import { useRouteError } from "react-router-dom";
import { booksPagePath } from "../../services/pagePaths";
import RouteErrorPage from "./RouteErrorPage";

export default function BooksPageError() {
  const error = useRouteError();

  return (
    <RouteErrorPage
      error={error}
      title="The books could not be loaded"
      notFoundMessage="The books page could not be found."
      destination={booksPagePath}
      destinationLabel="Back to books"
    />
  );
}
