import apiConfig from "../../../shared/api-config.json";

export const apiRootPath = apiConfig.apiPrefix.replace(/\/$/, "") || "/";
export const booksPagePath = apiConfig.pages.books;
export const bookDetailPagePath = apiConfig.pages.bookDetail;

export function getBookDetailPagePath(bookId: number): string {
  return bookDetailPagePath.replace(":book_id", String(bookId));
}
