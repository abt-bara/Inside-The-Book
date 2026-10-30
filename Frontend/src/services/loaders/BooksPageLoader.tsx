import type { LoaderFunctionArgs } from "react-router-dom";
import userServices from "../../api/UserServices";

export default async function BooksPageLoader({
  request,
}: LoaderFunctionArgs) {
  return userServices.getBooks(request.signal);
}