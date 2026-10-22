import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import BooksPage from "../pages/BookPage";
import BookDetailsPage from "../pages/BookDetailsPage";
import BookLoader from "./loaders/BookLoader";
import BooksPageLoader from "./loaders/BooksPageLoader";
import Scaffold from "../pages/scaffold";
import { bookDetailPagePath, booksPagePath } from "./pagePaths";
import AppError from "../pages/errors/AppError";
import BooksPageError from "../pages/errors/BooksPageError";
import BookDetailsPageError from "../pages/errors/BookDetailsPageError";

const router = createBrowserRouter([
  {
    element: <Scaffold />,
    ErrorBoundary: AppError,
    children: [
      {
        path: "/",
        element: <Navigate to={booksPagePath} replace />,
      },
      {
        path: booksPagePath,
        element: <BooksPage />,
        loader: BooksPageLoader,
        ErrorBoundary: BooksPageError,
      },
      {
        path: bookDetailPagePath,
        element: <BookDetailsPage />,
        loader: BookLoader,
        ErrorBoundary: BookDetailsPageError,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
