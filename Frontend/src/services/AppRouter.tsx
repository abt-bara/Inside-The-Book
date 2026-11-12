import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import BooksPage from "../pages/BookPage";
import BookDetailsPage from "../pages/BookDetailsPage";
import QrPage from "../pages/QrPage";
import BookLoader from "./loaders/BookLoader";
import BooksPageLoader from "./loaders/BooksPageLoader";
import Scaffold from "../pages/scaffold";
import { bookDetailPagePath, booksPagePath, qrPagePath } from "./pagePaths";
import AppError from "../pages/errors/AppError";
import BooksPageError from "../pages/errors/BooksPageError";
import BookDetailsPageError from "../pages/errors/BookDetailsPageError";
import RouteSkeleton from "../Components/RouteSkeleton";

const router = createBrowserRouter([
  {
    element: <Scaffold />,
    hydrateFallbackElement: (
      <RouteSkeleton pathname={window.location.pathname} />
    ),
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
        path: qrPagePath,
        element: <QrPage />,
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
