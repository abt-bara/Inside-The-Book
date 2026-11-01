import { useLoaderData, useRevalidator } from "react-router-dom";
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
import { useSettings } from "../Hooks/useSettings";
import userServices from "../api/UserServices";

interface QrStyleSettings {
  gradientStart: string;
  gradientEnd: string;
  textColor: string;
  widthCm: number;
  heightCm: number;
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
  widthCm: 7,
  heightCm: 9,
};

const qrSettingsKey = "inside-the-book.qr-style";
const colorPattern = /^#[\da-f]{6}$/i;

function clampCm(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(20, Math.max(3, value));
}

function isQrStyleSettings(value: unknown): value is QrStyleSettings {
  if (typeof value !== "object" || value === null) return false;
  const settings = value as Record<string, unknown>;
  return (
    typeof settings.gradientStart === "string" &&
    colorPattern.test(settings.gradientStart) &&
    typeof settings.gradientEnd === "string" &&
    colorPattern.test(settings.gradientEnd) &&
    typeof settings.textColor === "string" &&
    colorPattern.test(settings.textColor) &&
    typeof settings.widthCm === "number" &&
    typeof settings.heightCm === "number"
  );
}

function getStoredQrSettings(): StoredQrSettings {
  try {
    const saved = window.localStorage.getItem(qrSettingsKey);
    if (!saved) return { settings: defaultQrStyle, message: "" };

    const parsed: unknown = JSON.parse(saved);
    if (isQrStyleSettings(parsed)) {
      return {
        settings: {
          ...defaultQrStyle,
          ...parsed,
          widthCm: clampCm(parsed.widthCm, defaultQrStyle.widthCm),
          heightCm: clampCm(parsed.heightCm, defaultQrStyle.heightCm),
        },
        message: "",
      };
    }

    return {
      settings: defaultQrStyle,
      message: "Saved QR settings were invalid; using the defaults.",
    };
  } catch {
    return {
      settings: defaultQrStyle,
      message: "QR settings could not be loaded from this browser.",
    };
  }
}

function QrPage() {
  const books = useLoaderData() as Awaited<ReturnType<typeof BooksPageLoader>>;
  const [filters, setFilters] = useState<BookFiltersState>(emptyBookFilters);
  const [qrCards, setQrCards] = useState<GeneratedQr[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrError, setQrError] = useState("");
  const [printStatusError, setPrintStatusError] = useState("");
  const [isUpdatingPrintStatus, setIsUpdatingPrintStatus] = useState(false);
  const [storedSettings, setStoredSettings] = useState(getStoredQrSettings);
  const { t } = useSettings();
  const revalidator = useRevalidator();
  const { settings, message: settingsMessage } = storedSettings;
  const [sizeDrafts, setSizeDrafts] = useState(() => ({
    widthCm: String(settings.widthCm),
    heightCm: String(settings.heightCm),
  }));
  const sizeRatio = `${settings.widthCm.toFixed(1)} : ${settings.heightCm.toFixed(1)}`;
  const filteredBooks = useMemo(
    () => filterBooks(books, filters),
    [books, filters],
  );

  function updateSettings(
    field: keyof QrStyleSettings,
    value: string | number,
  ): QrStyleSettings {
    const currentRatio = settings.widthCm / settings.heightCm;
    const nextSettings: QrStyleSettings = { ...settings };

    if (field === "widthCm" || field === "heightCm") {
      const numericValue = clampCm(Number(value), settings[field]);

      if (field === "widthCm") {
        nextSettings.widthCm = numericValue;
        nextSettings.heightCm = clampCm(numericValue / currentRatio, settings.heightCm);
      } else {
        nextSettings.heightCm = numericValue;
        nextSettings.widthCm = clampCm(numericValue * currentRatio, settings.widthCm);
      }
    } else {
      if (typeof value === "string") nextSettings[field] = value;
    }

    try {
      window.localStorage.setItem(qrSettingsKey, JSON.stringify(nextSettings));
      setStoredSettings({ settings: nextSettings, message: "" });
    } catch {
      setStoredSettings({
        settings: nextSettings,
        message: "QR settings are active but could not be saved in this browser.",
      });
    }
    return nextSettings;
  }

  function commitSize(field: "widthCm" | "heightCm") {
    const rawValue = sizeDrafts[field];
    if (!rawValue.trim() || !Number.isFinite(Number(rawValue))) {
      setSizeDrafts({
        widthCm: String(settings.widthCm),
        heightCm: String(settings.heightCm),
      });
      return;
    }

    const nextSettings = updateSettings(field, Number(rawValue));
    setSizeDrafts({
      widthCm: String(nextSettings.widthCm),
      heightCm: String(nextSettings.heightCm),
    });
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
          const qrWidthPx = Math.max(180, Math.round(settings.widthCm * 38));
          const dataUrl = await QRCode.toDataURL(destination, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: qrWidthPx,
            color: { dark: "#111111", light: "#ffffff" },
          });
          return { book, dataUrl };
        }),
      );
      setQrCards(generated);
    } catch (error) {
      setQrError(
        error instanceof Error
          ? t("QR codes could not be generated: {message}").replace(
              "{message}",
              error.message,
            )
          : t("QR codes could not be generated."),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function printQrCodes() {
    if (!qrCards?.length || isUpdatingPrintStatus) return;

    setPrintStatusError("");
    window.print();

    const newBooks = qrCards.filter(({ book }) => book.new);
    if (newBooks.length === 0) return;

    setIsUpdatingPrintStatus(true);
    try {
      const results = await Promise.allSettled(
        newBooks.map(({ book }) => userServices.updateBook(book.id, { new: false })),
      );
      const updatedIds = new Set<number>();
      const failures: string[] = [];

      results.forEach((result, index) => {
        const book = newBooks[index].book;
        if (result.status === "fulfilled") {
          updatedIds.add(book.id);
        } else {
          failures.push(
            `${book.title}: ${
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error"
            }`,
          );
        }
      });

      setQrCards((current) =>
        current?.map((card) =>
          updatedIds.has(card.book.id)
            ? { ...card, book: { ...card.book, new: false } }
            : card,
        ) ?? null,
      );
      revalidator.revalidate();

      if (failures.length > 0) {
        setPrintStatusError(
          t("Printed books could not all be marked as existing: {details}").replace(
            "{details}",
            failures.join("; "),
          ),
        );
      }
    } finally {
      setIsUpdatingPrintStatus(false);
    }
  }

  return (
    <main className="books-page qr-page">
      <div className="books-page__heading qr-page__heading">
        <h1 className="books-page__title">{t("Book QR Codes")}</h1>
      </div>

      <BookFilters
        filters={filters}
        onChange={setFilters}
        totalCount={books.length}
        resultCount={filteredBooks.length}
      />
      {books.length === 0 ? (
        <div className="border-grad-glass bgrad-oasis books-page__empty entry-widget">
          <p>{t("There are no books right now.")}</p>
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
      <section className="qr-page__actions" aria-label={t("QR code actions")}>
        <p>{t("Select books with the search and filters, then generate a QR code for each matching book.")}</p>
        <button
          className="btn btn-jade"
          type="button"
          onClick={generateQrCodes}
          disabled={filteredBooks.length === 0 || isGenerating}
        >
          {isGenerating
            ? t("Generating…")
            : t("Generate QR codes ({count})").replace(
                "{count}",
                String(filteredBooks.length),
              )}
        </button>
      </section>

      <details className="qr-settings">
        <summary>{t("QR appearance settings")}</summary>
        <div className="qr-settings__fields">
          <label>
            <span>{t("Gradient start")}</span>
            <input
              type="color"
              value={settings.gradientStart}
              onChange={(event) =>
                updateSettings("gradientStart", event.currentTarget.value)
              }
            />
          </label>
          <label>
            <span>{t("Gradient end")}</span>
            <input
              type="color"
              value={settings.gradientEnd}
              onChange={(event) =>
                updateSettings("gradientEnd", event.currentTarget.value)
              }
            />
          </label>
          <label>
            <span>{t("Text color")}</span>
            <input
              type="color"
              value={settings.textColor}
              onChange={(event) =>
                updateSettings("textColor", event.currentTarget.value)
              }
            />
          </label>
          <label className="qr-settings__numeric">
            <span>{t("Width (cm)")}</span>
            <input
              type="number"
              min={3}
              max={20}
              step={0.5}
              value={sizeDrafts.widthCm}
              onChange={(event) =>
                setSizeDrafts((current) => ({
                  ...current,
                  widthCm: event.currentTarget.value,
                }))
              }
              onBlur={() => commitSize("widthCm")}
            />
          </label>
          <div className="qr-settings__ratio" aria-live="polite">
            {t("Ratio {ratio}").replace("{ratio}", sizeRatio)}
          </div>
          <label className="qr-settings__numeric">
            <span>{t("Height (cm)")}</span>
            <input
              type="number"
              min={3}
              max={20}
              step={0.5}
              value={sizeDrafts.heightCm}
              onChange={(event) =>
                setSizeDrafts((current) => ({
                  ...current,
                  heightCm: event.currentTarget.value,
                }))
              }
              onBlur={() => commitSize("heightCm")}
            />
          </label>
        </div>
        {settingsMessage && (
          <p className="qr-settings__message" role="status">{t(settingsMessage)}</p>
        )}
      </details>

      {qrError && (
        <p className="qr-page__error" role="alert">{qrError}</p>
      )}

      {qrCards !== null && (
        <section className="qr-print-area" aria-label={t("Generated book QR codes")}>
          <div className="qr-print-area__toolbar">
            <h2>
              {t("Generated codes ({count})").replace(
                "{count}",
                String(qrCards.length),
              )}
            </h2>
            <button
              className="btn btn-gold-shine"
              type="button"
              onClick={printQrCodes}
              disabled={qrCards.length === 0 || isUpdatingPrintStatus}
            >
              {isUpdatingPrintStatus ? t("Updating print status…") : t("Print QR codes")}
            </button>
          </div>
          {printStatusError && (
            <p className="qr-page__error" role="alert">{printStatusError}</p>
          )}
          {qrCards.length === 0 ? (
            <p className="qr-page__empty">{t("No books matched the selected filters.")}</p>
          ) : (
            <div
              className="qr-card-grid"
              style={{ "--qr-card-width": `${settings.widthCm}cm` } as CSSProperties}
            >
              {qrCards.map(({ book, dataUrl }) => (
                <article
                  className="qr-card"
                  key={book.id}
                  style={{
                    "--qr-gradient-start": settings.gradientStart,
                    "--qr-gradient-end": settings.gradientEnd,
                    "--qr-text-color": settings.textColor,
                    "--qr-card-width": `${settings.widthCm}cm`,
                    "--qr-card-height": `${settings.heightCm}cm`,
                  } as CSSProperties}
                >
                  <div className="qr-card__image">
                    <img
                      src={dataUrl}
                      alt={t("QR code linking to {title}").replace(
                        "{title}",
                        book.title,
                      )}
                    />
                  </div>
                  <p className="qr-card__scan">{t("SCAN ME")}</p>
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
