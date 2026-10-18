import { createBrowserRouter, RouterProvider } from "react-router-dom";
import apiConfig from "../../../shared/api-config.json";
import BooksPage from "../pages/BookPage";
import BookLoader from "./loaders/BookLoader";
import BooksPageLoader from "./loaders/BooksPageLoader";

const router = createBrowserRouter([
  {
    path: apiConfig.pages.books,
    element: <BooksPage />,
    loader: BooksPageLoader,
  },
  {
    path: apiConfig.pages.bookDetail,
    element: <BooksPage />,
    loader: BookLoader,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
