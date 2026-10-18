import type { LoaderFunctionArgs } from "react-router-dom";
import apiConfig from "../../../../shared/api-config.json";

export default async function BookLoader({ params }: LoaderFunctionArgs) {
  const bookId = params.book_id;
  if (!bookId) {
    throw new Response("Book ID is required.", { status: 400 });
  }

  const bookPath = apiConfig.api.book.replace(
    "{book_id}",
    encodeURIComponent(bookId),
  );
  const response = await fetch(`${apiConfig.apiPrefix}${bookPath}`);
  if (!response.ok) {
    throw response;
  }
  return response.json();
}
