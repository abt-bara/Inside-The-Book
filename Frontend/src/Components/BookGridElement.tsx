import type { Book } from "../types/Book";
import { Link } from "react-router-dom";
import { getBookDetailPagePath } from "../services/pagePaths";
import { useSettings } from "../Hooks/useSettings";

function BookGridElement({
  id,
  title,
  author,
  images,
}: Book) {
  const cover = images[0]?.image_url;
  const { t } = useSettings();

  return (
    <Link
      className="book-grid-card entry-widget"
      to={getBookDetailPagePath(id)}
    >
      <span className="book-grid-card__cover">
        {cover ? (
          <img
            src={cover}
            alt={t("Cover of {title}").replace("{title}", title)}
            loading="lazy"
          />
        ) : (
          <span className="book-grid-card__placeholder" aria-hidden="true">
            {t("No cover")}
          </span>
        )}
      </span>
      <span className="book-grid-card__content">
        <span className="book-grid-card__title">{title}</span>
        <span className="book-grid-card__writer-row">
          <span className="book-grid-card__writer-label">{t("Writer")}</span>
          <span className="book-grid-card__author">{author || t("Author unknown")}</span>
        </span>
      </span>
    </Link>
  );
}
export default BookGridElement;
