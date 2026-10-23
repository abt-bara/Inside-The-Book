import { useLoaderData, useRevalidator } from "react-router-dom";
import { useState } from "react";
import BookGridElement from "../Components/BookGridElement";
import NewBookDialog from "../Components/NewBookDialog";
import type { Book } from "../types/Book";
import BooksPageLoader from "../services/loaders/BooksPageLoader";

function BooksPage() {
  const books = useLoaderData() as Awaited<ReturnType<typeof BooksPageLoader>>;
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const revalidator = useRevalidator();

  return (
    <main className="books-page">
      <div className="books-page__heading">
        <h1 className="books-page__title">Inside the Book — في الكتاب</h1>
        <button
          className="btn-jade-gold books-page__add-button"
          type="button"
          onClick={() => setIsNewBookOpen(true)}
        >
          <span aria-hidden="true">+</span> New book
        </button>
      </div>
      {books.length === 0 ? (
        <div className="books-page__empty entry-widget">
          <p>There are no books right now.</p>
          <button
            className="btn-jade"
            type="button"
            onClick={() => setIsNewBookOpen(true)}
          >
            Add your first book
          </button>
        </div>
      ) : (
        <div className="books-grid">
          {books.map((book: Book) => (
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
