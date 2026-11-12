import { useLoaderData, useRevalidator } from "react-router-dom";
import { useMemo, useState } from "react";
import BookGridElement from "../Components/BookGridElement";
import BookFilters from "../Components/BookFilters";
import NewBookDialog from "../Components/NewBookDialog";
import type { Book } from "../types/Book";
import BooksPageLoader from "../services/loaders/BooksPageLoader";
import {
  emptyBookFilters,
  filterBooks,
  type BookFilters as BookFiltersState,
} from "../services/bookFilters";
import { useSettings } from "../Hooks/useSettings";

function BooksPage() {
  const books = useLoaderData() as Awaited<ReturnType<typeof BooksPageLoader>>;
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [filters, setFilters] = useState<BookFiltersState>(emptyBookFilters);
  const revalidator = useRevalidator();
  const { t } = useSettings();
  const filteredBooks = useMemo(
    () => filterBooks(books, filters),
    [books, filters],
  );

  return (
    <main className="books-page">
      <div className="books-page__heading">
        <h1 className="books-page__title">{t("Book collection")}</h1>
        <button
          className="btn btn-gold-shine books-page__add-button"
          type="button"
          onClick={() => setIsNewBookOpen(true)}
        >
          <span aria-hidden="true">+</span> {t("New book")}
        </button>
      </div>
      <BookFilters
        filters={filters}
        onChange={setFilters}
        totalCount={books.length}
        resultCount={filteredBooks.length}
      />
      {books.length === 0 ? (
        <div className="books-page__empty d entry-widget">
          <p>{t("There are no books right now.")}</p>
          <button
            className="btn-jade"
            type="button"
            onClick={() => setIsNewBookOpen(true)}
          >
            {t("Add your first book")}
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="books-page__empty entry-widget">
          <p>{t("No books match these filters.")}</p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book: Book) => (
            <BookGridElement key={book.id} {...book} />
          ))}
        </div>
      )}
      {isNewBookOpen && (
        <NewBookDialog
          onClose={() => setIsNewBookOpen(false)}
          onSaved={() => revalidator.revalidate()}
        />
      )}
    </main>
  );
}
export default BooksPage;
