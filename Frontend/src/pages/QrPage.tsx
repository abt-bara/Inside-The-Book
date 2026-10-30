import { useLoaderData } from "react-router-dom";
import { useMemo, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import type { Book } from "../types/Book";
import BookFilters from "../Components/BookFilters";
import BooksPageLoader from "../services/loaders/BooksPageLoader";
import {
  emptyBookFilters,
  filterBooks,
  type BookFilters as BookFiltersState,
} from "../services/bookFilters";
import { getBookDetailPagePath } from "../services/pagePaths";
import BookGridElement from "../Components/BookGridElement";

interface QrStyleSettings {
  gradientStart: string;
  gradientEnd: string;
  textColor: string;
}

interface StoredQrSettings {
  settings: QrStyleSettings;
  message: string;
}

interface GeneratedQr {
  book: Book;
  dataUrl: string;
}

const defaultQrStyle: QrStyleSettings = {
  gradientStart: "#2862d5",
  gradientEnd: "#f0d432",
  textColor: "#ffffff",
};

const qrSettingsKey = "inside-the-book.qr-style";
const colorPattern = /^#[\da-f]{6}$/i;

function isQrStyleSettings(value: unknown): value is QrStyleSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.gradientStart === "string" &&
    colorPattern.test(settings.gradientStart) &&
    typeof settings.gradientEnd === "string" &&
    colorPattern.test(settings.gradientEnd) &&
    typeof settings.textColor === "string" &&
    colorPattern.test(settings.textColor)
  );
}

function getStoredQrSettings(): StoredQrSettings {
  try {
    const saved = window.localStorage.getItem(qrSettingsKey);
    if (!saved) return { settings: defaultQrStyle, message: "" };

    const parsed: unknown = JSON.parse(saved);
    if (isQrStyleSettings(parsed)) {
      return { settings: parsed, message: "" };
    }

    return {
      settings: defaultQrStyle,
      message: "Saved QR colors were invalid; using the defaults.",
    };
  } catch {
    return {
      settings: defaultQrStyle,
      message: "QR color settings could not be loaded from this browser.",
    };
  }
}

function QrPage() {
  const books = useLoaderData() as Awaited<ReturnType<typeof BooksPageLoader>>;
  const [filters, setFilters] = useState<BookFiltersState>(emptyBookFilters);
  const [qrCards, setQrCards] = useState<GeneratedQr[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrError, setQrError] = useState("");
  const [storedSettings, setStoredSettings] = useState(getStoredQrSettings);
  const { settings, message: settingsMessage } = storedSettings;
  const filteredBooks = useMemo(
    () => filterBooks(books, filters),
    [books, filters],
  );

  function updateSettings(field: keyof QrStyleSettings, value: string) {
    const updatedSettings = { ...settings, [field]: value };
    try {
      window.localStorage.setItem(qrSettingsKey, JSON.stringify(updatedSettings));
      setStoredSettings({ settings: updatedSettings, message: "" });
    } catch {
      setStoredSettings({
        settings: updatedSettings,
        message: "QR colors are active but could not be saved in this browser.",
      });
    }
  }

  async function generateQrCodes() {
    setIsGenerating(true);
    setQrError("");
    setQrCards(null);
    try {
      const generated = await Promise.all(
        filteredBooks.map(async (book) => {
          const destination = new URL(
            getBookDetailPagePath(book.id),
            window.location.origin,
          ).toString();
          const dataUrl = await QRCode.toDataURL(destination, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 280,
            color: { dark: "#111111", light: "#ffffff" },
          });
          return { book, dataUrl };
        }),
      );
      setQrCards(generated);
    } catch (error) {
      setQrError(
        error instanceof Error
          ? `QR codes could not be generated: ${error.message}`
          : "QR codes could not be generated.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="books-page qr-page">
      <div className="books-page__heading qr-page__heading">
        <h1 className="books-page__title">Book QR Codes</h1>
      </div>

      <BookFilters
        filters={filters}
        onChange={setFilters}
        totalCount={books.length}
        resultCount={filteredBooks.length}
      />
            {books.length === 0 ? (
        <div className="border-grad-glass bgrad-oasis books-page__empty entry-widget">
          <p>There are no books right now.</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="books-page__empty entry-widget">
          <p>No books match these filters.</p>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book: Book) => (
            <BookGridElement key={book.id} {...book} />
          ))}
        </div>
      )}
      <section className="qr-page__actions" aria-label="QR code actions">
        <p>
          Select books with the search and filters, then generate a QR code for
          each matching book.
        </p>
        <button
          className="btn btn-jade"
          type="button"
          onClick={generateQrCodes}
          disabled={filteredBooks.length === 0 || isGenerating}
        >
          {isGenerating ? "Generating…" : `Generate QR codes (${filteredBooks.length})`}
        </button>
      </section>

      <details className="qr-settings">
        <summary>QR appearance settings</summary>
        <div className="qr-settings__fields">
          <label>
            <span>Gradient start</span>
            <input
              type="color"
              value={settings.gradientStart}
              onChange={(event) =>
                updateSettings("gradientStart", event.currentTarget.value)
              }
            />
          </label>
          <label>
            <span>Gradient end</span>
            <input
              type="color"
              value={settings.gradientEnd}
              onChange={(event) =>
                updateSettings("gradientEnd", event.currentTarget.value)
              }
            />
          </label>
          <label>
            <span>Text color</span>
            <input
              type="color"
              value={settings.textColor}
              onChange={(event) =>
                updateSettings("textColor", event.currentTarget.value)
              }
            />
          </label>
        </div>
        {settingsMessage && (
          <p className="qr-settings__message" role="status">{settingsMessage}</p>
        )}
      </details>

      {qrError && (
        <p className="qr-page__error" role="alert">{qrError}</p>
      )}

      {qrCards !== null && (
        <section className="qr-print-area" aria-label="Generated book QR codes">
          <div className="qr-print-area__toolbar">
            <h2>Generated codes <span>({qrCards.length})</span></h2>
            <button
              className="btn btn-gold-shine"
              type="button"
              onClick={() => window.print()}
              disabled={qrCards.length === 0}
            >
              Print QR codes
            </button>
          </div>
          {qrCards.length === 0 ? (
            <p className="qr-page__empty">No books matched the selected filters.</p>
          ) : (
            <div className="qr-card-grid">
              {qrCards.map(({ book, dataUrl }) => (
                <article
                  className="qr-card"
                  key={book.id}
                  style={{
                    "--qr-gradient-start": settings.gradientStart,
                    "--qr-gradient-end": settings.gradientEnd,
                    "--qr-text-color": settings.textColor,
                  } as CSSProperties}
                >
                  <div className="qr-card__image">
                    <img
                      src={dataUrl}
                      alt={`QR code linking to ${book.title}`}
                    />
                  </div>
                  <p className="qr-card__scan">SCAN ME</p>
                  <h3 className="qr-card__title">{book.title}</h3>
                  <p className="qr-card__author">{book.author || "Author unknown"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default QrPage;
