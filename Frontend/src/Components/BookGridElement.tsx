import type { Book } from "../types/Book";
import { Link } from "react-router-dom";
import { getBookDetailPagePath } from "../services/pagePaths";

function BookGridElement({
  id,
  title,
  author,
  images,
}: Book) {
  const cover = images[0]?.image_url;

  return (
    <Link className="book-grid-card entry-widget border-grad-animated "  to={getBookDetailPagePath(id)}>
      <span className="book-grid-card__cover">
        {cover ? (
          <img src={cover} alt={`Cover of ${title}`} loading="lazy" />
        ) : (
          <span className="book-grid-card__placeholder" aria-hidden="true">
            No cover
          </span>
        )}
      </span>
      <span className="book-grid-card__content">
        <span className="book-grid-card__title">{title}</span>
        <span className="book-grid-card__writer-row">
          <span className="book-grid-card__writer-label">Writer</span>
          <span className="book-grid-card__author">{author || "Author unknown"}</span>
        </span>
      </span>
    </Link>
  );
}
export default BookGridElement;
