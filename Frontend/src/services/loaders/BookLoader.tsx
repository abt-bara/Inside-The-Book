import type { LoaderFunctionArgs } from "react-router-dom";
import userServices from "../../api/UserServices";
import type { Book } from "../../types/Book";

export default async function BookLoader({
  request,
  params,
}: LoaderFunctionArgs): Promise<Book> {
  const bookId = params.book_id;
  if (!bookId) {
    throw new Response("Book ID is required.", { status: 400 });
  }

  return userServices.getBook(Number(bookId), request.signal);
}
