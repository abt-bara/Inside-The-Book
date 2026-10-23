import { useState } from "react";
import { Link, useLoaderData, useRevalidator } from "react-router-dom";
import EditBookDialog from "../Components/EditBookDialog";
import BookImageCarousel from "../Components/BookImageCarousel";
import { useTheme } from "../Hooks/useTheme";
import { booksPagePath } from "../services/pagePaths";
import type { Book } from "../types/Book";

function BookDetailsPage() {
  const book = useLoaderData() as Book;
  const { theme } = useTheme();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const revalidator = useRevalidator();
  const volumeCount = book.vols?.length ?? 0;
  const metadata = [
    ["Author", book.author],
    ["Editor", book.editor],
    ["Distributor", book.distributor],
    ["Number of volumes", `${volumeCount} ${volumeCount === 1 ? "volume" : "volumes"}`],
    ["Publication date", book.year],
  ];

  return (
    <main className="book-details-page">
      <div className="book-details-page__toolbar">
        <Link className="book-details-back" to={booksPagePath}>
          <span aria-hidden="true">←</span> All books
        </Link>
        <button
          className="book-details-edit"
          type="button"
          aria-label={`Edit ${book.title}`}
          onClick={() => setIsEditOpen(true)}
        >
          <span aria-hidden="true">✎</span> Edit book
        </button>
      </div>
      <article className={`book-details-card book-details-card--${theme}  entry-widget`}>
        <div className="book-details-card__cover">
          <BookImageCarousel images={book.images ?? []} label={`${book.title} cover`} />
        </div>
        <div className="divider-jade-v book-details-card__divider" aria-hidden="true" />
        <section className="book-details-card__content" aria-labelledby="book-title">
          <span
            className={`book-status ${book.new ? "book-status--new" : "book-status--existing"}`}
            aria-label={`Print status: ${book.new ? "new" : "existing"}`}
          >
            Print status · {book.new ? "New" : "Existing"}
          </span>
          <h1 id="book-title" className="book-details-card__title">{book.title}</h1>
          <dl className="book-metadata">
            {metadata.map(([label, value]) => (
              <div className="book-metadata__row" key={label}>
                <dt>{label}</dt>
                <dd>{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
          {book.description && (
            <p className="book-details-card__description">{book.description}</p>
          )}
        </section>
      </article>
      {book.vols?.some((volume) => (volume.images?.length ?? 0) > 0) && (
        <section className="book-volumes" aria-label={`${book.title} volume images`}>
          <h2>Volumes</h2>
          <div className="book-volumes__grid">
            {book.vols.map((volume) => (
              <article className="book-volume-card entry-widget" key={volume.id}>
                <h3>
                  {volume.title || `Volume ${volume.number}`}
                </h3>
                <BookImageCarousel
                  images={volume.images ?? []}
                  label={volume.title || `Volume ${volume.number}`}
                />
              </article>
            ))}
          </div>
        </section>
      )}
      {isEditOpen && (
        <EditBookDialog
          bookId={book.id}
          onClose={() => setIsEditOpen(false)}
          onUpdated={() => revalidator.revalidate()}
        />
      )}
    </main>
  );
}

export default BookDetailsPage;
