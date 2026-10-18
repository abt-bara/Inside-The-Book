import apiConfig from "../../../../shared/api-config.json";
import type { Book } from "../../types/Book";

export default async function BooksPageLoader():Promise<Book[]> {
  const response = await fetch(
    `${apiConfig.apiPrefix}${apiConfig.api.books}`,
  );
  if (!response.ok) {
    throw response;
  }
  return response.json();
}