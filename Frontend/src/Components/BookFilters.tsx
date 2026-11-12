import type { ChangeEvent } from "react";
import type { BookFilters as BookFiltersState } from "../services/bookFilters";
import { useSettings } from "../Hooks/useSettings";

interface BookFiltersProps {
  filters: BookFiltersState;
  onChange: (filters: BookFiltersState) => void;
  totalCount: number;
  resultCount: number;
}

function BookFilters({
  filters,
  onChange,
  totalCount,
  resultCount,
}: BookFiltersProps) {
  const { t } = useSettings();

  function updateText(
    field: keyof Pick<
      BookFiltersState,
      | "query"
      | "title"
      | "author"
      | "editor"
      | "distributor"
      | "description"
      | "year"
      | "volume"
    >,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    onChange({ ...filters, [field]: event.currentTarget.value });
  }

  return (
    <section className="book-filters" aria-label={t("Filter books")}>
      <label className="book-filters__search">
        <span className="book-filters__search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          value={filters.query}
          onChange={(event) => updateText("query", event)}
          placeholder={t("Search books, authors, editors, volumes…")}
          aria-label={t("Search all book information")}
        />
        {filters.query && (
          <button
            type="button"
            className="book-filters__clear-search"
            onClick={() => onChange({ ...filters, query: "" })}
            aria-label={t("Clear search")}
          >
            ×
          </button>
        )}
      </label>

      <details className="book-filters__advanced">
        <summary>{t("Advanced filters")}</summary>
        <div className="book-filters__fields">
          <label>
            <span>{t("Title")}</span>
            <input
              value={filters.title}
              onChange={(event) => updateText("title", event)}
              placeholder={t("Book title")}
            />
          </label>
          <label>
            <span>{t("Author")}</span>
            <input
              value={filters.author}
              onChange={(event) => updateText("author", event)}
              placeholder={t("Author")}
            />
          </label>
          <label>
            <span>{t("Editor")}</span>
            <input
              value={filters.editor}
              onChange={(event) => updateText("editor", event)}
              placeholder={t("Editor")}
            />
          </label>
          <label>
            <span>{t("Distributor")}</span>
            <input
              value={filters.distributor}
              onChange={(event) => updateText("distributor", event)}
              placeholder={t("Distributor")}
            />
          </label>
          <label>
            <span>{t("Publication year")}</span>
            <input
              value={filters.year}
              onChange={(event) => updateText("year", event)}
              placeholder={t("Year")}
            />
          </label>
          <label>
            <span>{t("Description")}</span>
            <input
              value={filters.description}
              onChange={(event) => updateText("description", event)}
              placeholder={t("Words in the description")}
            />
          </label>
          <label>
            <span>{t("Volume")}</span>
            <input
              value={filters.volume}
              onChange={(event) => updateText("volume", event)}
              placeholder={t("Volume title or number")}
            />
          </label>
          <label>
            <span>{t("Book status")}</span>
            <select
              value={filters.newStatus}
              onChange={(event) => {
                const newStatus = event.currentTarget.value;
                if (newStatus === "any" || newStatus === "new" || newStatus === "not-new") {
                  onChange({ ...filters, newStatus });
                }
              }}
            >
              <option value="any">{t("Any status")}</option>
              <option value="new">{t("New books")}</option>
              <option value="not-new">{t("Not marked new")}</option>
            </select>
          </label>
          <label>
            <span>{t("Cover images")}</span>
            <select
              value={filters.imageStatus}
              onChange={(event) => {
                const imageStatus = event.currentTarget.value;
                if (
                  imageStatus === "any" ||
                  imageStatus === "with-images" ||
                  imageStatus === "without-images"
                ) {
                  onChange({ ...filters, imageStatus });
                }
              }}
            >
              <option value="any">{t("Any")}</option>
              <option value="with-images">{t("Has images")}</option>
              <option value="without-images">{t("No images")}</option>
            </select>
          </label>
        </div>
      </details>

      <p className="book-filters__count" role="status" aria-live="polite">
        {t("Showing {resultCount} of {totalCount} books")
          .replace("{resultCount}", String(resultCount))
          .replace("{totalCount}", String(totalCount))}
      </p>
    </section>
  );
}

export default BookFilters;
