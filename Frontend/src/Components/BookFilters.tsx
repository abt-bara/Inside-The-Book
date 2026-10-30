import type { ChangeEvent } from "react";
import type { BookFilters as BookFiltersState } from "../services/bookFilters";

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
    <section className="book-filters" aria-label="Filter books">
      <label className="book-filters__search">
        <span className="book-filters__search-icon" aria-hidden="true">⌕</span>
        <input
          type="search"
          value={filters.query}
          onChange={(event) => updateText("query", event)}
          placeholder="Search books, authors, editors, volumes…"
          aria-label="Search all book information"
        />
        {filters.query && (
          <button
            type="button"
            className="book-filters__clear-search"
            onClick={() => onChange({ ...filters, query: "" })}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </label>

      <details className="book-filters__advanced">
        <summary>Advanced filters</summary>
        <div className="book-filters__fields">
          <label>
            <span>Title</span>
            <input
              value={filters.title}
              onChange={(event) => updateText("title", event)}
              placeholder="Book title"
            />
          </label>
          <label>
            <span>Author</span>
            <input
              value={filters.author}
              onChange={(event) => updateText("author", event)}
              placeholder="Author"
            />
          </label>
          <label>
            <span>Editor</span>
            <input
              value={filters.editor}
              onChange={(event) => updateText("editor", event)}
              placeholder="Editor"
            />
          </label>
          <label>
            <span>Distributor</span>
            <input
              value={filters.distributor}
              onChange={(event) => updateText("distributor", event)}
              placeholder="Distributor"
            />
          </label>
          <label>
            <span>Publication year</span>
            <input
              value={filters.year}
              onChange={(event) => updateText("year", event)}
              placeholder="Year"
            />
          </label>
          <label>
            <span>Description</span>
            <input
              value={filters.description}
              onChange={(event) => updateText("description", event)}
              placeholder="Words in the description"
            />
          </label>
          <label>
            <span>Volume</span>
            <input
              value={filters.volume}
              onChange={(event) => updateText("volume", event)}
              placeholder="Volume title or number"
            />
          </label>
          <label>
            <span>Book status</span>
            <select
              value={filters.newStatus}
              onChange={(event) => {
                const newStatus = event.currentTarget.value;
                if (newStatus === "any" || newStatus === "new" || newStatus === "not-new") {
                  onChange({ ...filters, newStatus });
                }
              }}
            >
              <option value="any">Any status</option>
              <option value="new">New books</option>
              <option value="not-new">Not marked new</option>
            </select>
          </label>
          <label>
            <span>Cover images</span>
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
              <option value="any">Any</option>
              <option value="with-images">Has images</option>
              <option value="without-images">No images</option>
            </select>
          </label>
        </div>
      </details>

      <p className="book-filters__count" role="status" aria-live="polite">
        Showing {resultCount} of {totalCount} books
      </p>
    </section>
  );
}

export default BookFilters;
