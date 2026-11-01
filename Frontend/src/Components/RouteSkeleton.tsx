import { bookDetailPagePath, booksPagePath, qrPagePath } from "../services/pagePaths";
import { useSettings } from "../Hooks/useSettings";

function BooksSkeleton({ t }: { t: (text: string) => string }) {
  return (
    <main className="books-page route-skeleton" aria-busy="true">
      <div className="books-page__heading">
        <div className="route-skeleton__heading" />
      </div>
      <div className="books-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="route-skeleton__book" key={index}>
            <div className="route-skeleton__cover" />
            <div className="route-skeleton__book-content">
              <div className="route-skeleton__line route-skeleton__line--title" />
              <div className="route-skeleton__line route-skeleton__line--short" />
            </div>
          </div>
        ))}
      </div>
      <span className="route-skeleton__status" role="status">
        {t("Loading books…")}
      </span>
    </main>
  );
}

function BookDetailsSkeleton({ t }: { t: (text: string) => string }) {
  return (
    <main className="book-details-page route-skeleton" aria-busy="true">
      <div className="book-details-page__toolbar" aria-hidden="true">
        <div className="route-skeleton__toolbar-link" />
        <div className="route-skeleton__toolbar-button" />
      </div>
      <article className="book-details-card route-skeleton__details">
        <div className="route-skeleton__details-cover" aria-hidden="true" />
        <div className="book-details-card__divider" aria-hidden="true" />
        <div className="route-skeleton__details-content" aria-hidden="true">
          <div className="route-skeleton__line route-skeleton__line--status" />
          <div className="route-skeleton__line route-skeleton__line--title" />
          <div className="route-skeleton__line" />
          <div className="route-skeleton__line route-skeleton__line--short" />
          <div className="route-skeleton__line route-skeleton__line--paragraph" />
        </div>
      </article>
      <span className="route-skeleton__status" role="status">
        {t("Loading book details…")}
      </span>
    </main>
  );
}

export default function RouteSkeleton({ pathname }: { pathname: string }) {
  const { t } = useSettings();

  if (pathname === booksPagePath || pathname === "/" || pathname === `${booksPagePath}/`) {
    return <BooksSkeleton t={t} />;
  }

  if (pathname === qrPagePath || pathname === `${qrPagePath}/`) {
    return <BooksSkeleton t={t} />;
  }

  if (pathname.startsWith(bookDetailPagePath.replace(":book_id", ""))) {
    return <BookDetailsSkeleton t={t} />;
  }

  return (
    <main className="books-page route-skeleton" aria-busy="true">
      <span className="route-skeleton__status" role="status">{t("Loading page…")}</span>
    </main>
  );
}
