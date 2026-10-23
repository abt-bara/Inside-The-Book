import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type SubmitEvent,
} from "react";
import apiConfig from "../../../shared/api-config.json";
import type { Book } from "../types/Book";

interface VolumeDraft {
  key: number;
  id?: number;
  title: string;
  number: string;
  images: File[];
  existingImageCount: number;
}

interface BookDraft {
  title: string;
  author: string;
  editor: string;
  distributor: string;
  description: string;
  year: string;
  month: string;
  day: string;
}

interface CachedDraft extends BookDraft {
  volumes: { title: string; number: string }[];
}

interface NewBookDialogProps {
  onClose: () => void;
  onSaved: () => void;
  editBookId?: number;
}

const draftStorageKey = "inside-the-book:new-book-draft";
const currentYear = new Date().getFullYear();
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const emptyBookDraft: BookDraft = {
  title: "",
  author: "",
  editor: "",
  distributor: "",
  description: "",
  year: "",
  month: "",
  day: "",
};

function readCachedDraft(): { draft: CachedDraft | null; warning: string } {
  try {
    const cached = localStorage.getItem(draftStorageKey);
    if (!cached) return { draft: null, warning: "" };

    const parsed: unknown = JSON.parse(cached);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Saved draft data is invalid.");
    }

    const candidate = parsed as Partial<CachedDraft>;
    const textFields = [
      "title",
      "author",
      "editor",
      "distributor",
      "description",
      "year",
      "month",
      "day",
    ] as const;
    if (
      !textFields.every((field) => typeof candidate[field] === "string") ||
      !Array.isArray(candidate.volumes) ||
      !candidate.volumes.every(
        (volume) =>
          volume &&
          typeof volume.title === "string" &&
          typeof volume.number === "string",
      )
    ) {
      throw new Error("Saved draft data is invalid.");
    }
    return { draft: candidate as CachedDraft, warning: "" };
  } catch {
    return {
      draft: null,
      warning: "The saved draft could not be loaded. A fresh form is ready.",
    };
  }
}

interface ImageSlot {
  slot: string;
}

interface BookPayload {
  title: string;
  author: string;
  editor: string;
  distributor: string;
  description: string;
  year: string;
  new: boolean;
  images: ImageSlot[];
  vols: {
    title: string;
    number: number;
    images: ImageSlot[];
  }[];
}

interface BookUpdatePayload {
  title?: string;
  author?: string;
  editor?: string;
  distributor?: string;
  description?: string;
  year?: string;
  new?: boolean;
  images: ImageSlot[];
  vols: {
    vol_id: number;
    images: ImageSlot[];
  }[];
}

function toDraftDate(year: string): Pick<BookDraft, "year" | "month" | "day"> {
  const [dateYear = "", month = "", day = ""] = year.split("-");
  return {
    year: dateYear,
    month: month ? month.padStart(2, "0") : "",
    day: day ? day.padStart(2, "0") : "",
  };
}

function toApiDate(draft: BookDraft): string {
  return [
    draft.year,
    draft.month,
    draft.day ? draft.day.padStart(2, "0") : "",
  ].filter(Boolean).join("-");
}

function normalizeApiDate(value: string): string {
  return value
    .split("-")
    .map((part, index) => (index > 0 && part ? part.padStart(2, "0") : part))
    .join("-");
}

function bookApiPath(bookId: number): string {
  return apiConfig.api.book.replace("{book_id}", String(bookId));
}

function NewBookDialog({
  onClose,
  onSaved,
  editBookId,
}: NewBookDialogProps) {
  const isEditing = editBookId !== undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [cachedDraft] = useState(readCachedDraft);
  const [draft, setDraft] = useState<BookDraft>(
    cachedDraft.draft ?? emptyBookDraft,
  );
  const [bookImages, setBookImages] = useState<File[]>([]);
  const [volumes, setVolumes] = useState<VolumeDraft[]>(
    () =>
      cachedDraft.draft?.volumes.map((volume, key) => ({
        ...volume,
        key,
        images: [],
        existingImageCount: 0,
      })) ?? [],
  );
  const [nextVolumeKey, setNextVolumeKey] = useState(
    () => cachedDraft.draft?.volumes.length ?? 0,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(cachedDraft.warning);
  const [cacheWarning, setCacheWarning] = useState("");
  const [initialBook, setInitialBook] = useState<Book | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(isEditing);
  const [isEditReady, setIsEditReady] = useState(!isEditing);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    if (editBookId === undefined) return;

    const controller = new AbortController();

    fetch(`${apiConfig.apiPrefix}${bookApiPath(editBookId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Book loading failed (${response.status}).`);
        }
        return response.json() as Promise<Book>;
      })
      .then((book) => {
        setError("");
        setInitialBook(book);
        setDraft({
          title: book.title,
          author: book.author,
          editor: book.editor,
          distributor: book.distributor,
          description: book.description,
          ...toDraftDate(book.year),
        });
        setBookImages([]);
        setVolumes(
          book.vols.map((volume, key) => ({
            key,
            id: volume.id,
            title: volume.title,
            number: String(volume.number),
            images: [],
            existingImageCount: volume.images.length,
          })),
        );
        setNextVolumeKey(book.vols.length);
        setIsEditReady(true);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name === "AbortError") return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "An unexpected error occurred while loading the book.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingEdit(false);
      });

    return () => controller.abort();
  }, [editBookId]);

  const saveDraft = (nextDraft: BookDraft, nextVolumes: VolumeDraft[]) => {
    if (isEditing) return;
    try {
      const toCache: CachedDraft = {
        ...nextDraft,
        volumes: nextVolumes.map(({ title, number }) => ({ title, number })),
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(toCache));
      setCacheWarning("");
    } catch {
      setCacheWarning("Draft caching is unavailable in this browser.");
    }
  };

  const updateDraft = (update: Partial<BookDraft>) => {
    const nextDraft = { ...draft, ...update };
    setDraft(nextDraft);
    saveDraft(nextDraft, volumes);
  };

  const closeWithAnimation = (afterSubmit = false) => {
    if (isSubmitting && !afterSubmit) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialogRef.current?.close();
      return;
    }

    setIsClosing(true);
  };

  const handleAnimationEnd = (event: AnimationEvent<HTMLDialogElement>) => {
    if (isClosing && event.target === event.currentTarget) {
      dialogRef.current?.close();
    }
  };

  const addVolume = () => {
    const nextVolumes = [
      ...volumes,
      {
        key: nextVolumeKey,
        title: "",
        number: String(volumes.length + 1),
        images: [],
        existingImageCount: 0,
      },
    ];
    setVolumes(nextVolumes);
    saveDraft(draft, nextVolumes);
    setNextVolumeKey((key) => key + 1);
  };

  const updateVolume = (key: number, update: Partial<VolumeDraft>) => {
    const nextVolumes = volumes.map((volume) =>
      volume.key === key ? { ...volume, ...update } : volume,
    );
    setVolumes(nextVolumes);
    saveDraft(draft, nextVolumes);
  };

  const removeVolume = (key: number) => {
    const nextVolumes = volumes.filter((volume) => volume.key !== key);
    setVolumes(nextVolumes);
    saveDraft(draft, nextVolumes);
  };

  const submitBook = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    if (isEditing) {
      if (!draft.title.trim()) {
        setError("Book name is required.");
        return;
      }
    } else {
      const requiredFields = [
        ["Book name", draft.title],
        ["Author", draft.author],
        ["Distributor", draft.distributor],
        ["Description", draft.description],
        ["Publication year", draft.year],
      ];
      const missingField = requiredFields.find(([, value]) => !value.trim());

      if (missingField) {
        setError(`${missingField[0]} is required.`);
        return;
      }

      const incompleteVolumeIndex = volumes.findIndex(
        (volume) => !volume.title.trim() || !volume.number.trim(),
      );
      if (incompleteVolumeIndex !== -1) {
        setError(`Complete the title and number for volume ${incompleteVolumeIndex + 1}.`);
        return;
      }
    }

    if (
      !isEditing &&
      bookImages.length === 0 &&
      volumes.every((volume) => volume.images.length === 0)
    ) {
      setError("Select at least one image for the book or one of its volumes.");
      return;
    }

    if (isEditing && !initialBook) {
      setError("The book data has not loaded yet. Please try again.");
      return;
    }

    setIsSubmitting(true);
    const commonFields = {
      title: String(formData.get("title") ?? "").trim(),
      author: String(formData.get("author") ?? "").trim(),
      editor: String(formData.get("editor") ?? "").trim(),
      distributor: String(formData.get("distributor") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      year: toApiDate(draft),
      new: true,
    };

    let requestUrl = `${apiConfig.apiPrefix}${apiConfig.api.books}`;
    let requestInit: RequestInit;

    if (editBookId !== undefined && initialBook) {
      const changedFields: Omit<BookUpdatePayload, "images" | "vols"> = {};
      if (commonFields.title !== initialBook.title) changedFields.title = commonFields.title;
      if (commonFields.author !== initialBook.author) changedFields.author = commonFields.author;
      if (commonFields.editor !== initialBook.editor) changedFields.editor = commonFields.editor;
      if (commonFields.distributor !== initialBook.distributor) {
        changedFields.distributor = commonFields.distributor;
      }
      if (commonFields.description !== initialBook.description) {
        changedFields.description = commonFields.description;
      }
      if (commonFields.year !== normalizeApiDate(initialBook.year)) {
        changedFields.year = commonFields.year;
      }
      if (!initialBook.new) changedFields.new = true;

      const bookImageSlots = bookImages.map((_, index) => ({
        slot: `book-image-${index}`,
      }));
      const volumeImageUploads = volumes
        .filter(
          (volume): volume is VolumeDraft & { id: number } =>
            volume.id !== undefined && volume.images.length > 0,
        )
        .map((volume) => ({
          volume,
          slots: volume.images.map((_, index) => ({
            slot: `volume-${volume.id}-image-${index}`,
          })),
        }));
      const hasImageChanges =
        bookImageSlots.length > 0 || volumeImageUploads.length > 0;

      if (Object.keys(changedFields).length === 0 && !hasImageChanges) {
        setError("There are no changes to save.");
        setIsSubmitting(false);
        return;
      }

      requestUrl = `${apiConfig.apiPrefix}${bookApiPath(editBookId)}`;
      if (hasImageChanges) {
        const payload: BookUpdatePayload = {
          ...changedFields,
          images: bookImageSlots,
          vols: volumeImageUploads.map(({ volume, slots }) => ({
            vol_id: volume.id,
            images: slots,
          })),
        };
        const requestBody = new FormData();
        requestBody.append("payload", JSON.stringify(payload));
        bookImages.forEach((image, index) => {
          requestBody.append(`book-image-${index}`, image);
        });
        volumeImageUploads.forEach(({ volume }) => {
          volume.images.forEach((image, index) => {
            requestBody.append(`volume-${volume.id}-image-${index}`, image);
          });
        });
        requestInit = { method: "PATCH", body: requestBody };
      } else {
        requestInit = {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changedFields),
        };
      }
    } else {
      const payload: BookPayload = {
        ...commonFields,
        images: bookImages.map((_, index) => ({ slot: `book-image-${index}` })),
        vols: volumes.map((volume, volumeIndex) => ({
          title: volume.title.trim(),
          number: Number(volume.number),
          images: volume.images.map((_, imageIndex) => ({
            slot: `volume-${volumeIndex}-image-${imageIndex}`,
          })),
        })),
      };
      const requestBody = new FormData();
      requestBody.append("payload", JSON.stringify(payload));
      bookImages.forEach((image, index) => {
        requestBody.append(`book-image-${index}`, image);
      });
      volumes.forEach((volume, volumeIndex) => {
        volume.images.forEach((image, imageIndex) => {
          requestBody.append(`volume-${volumeIndex}-image-${imageIndex}`, image);
        });
      });
      requestInit = { method: "POST", body: requestBody };
    }

    try {
      const response = await fetch(requestUrl, requestInit);

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message ||
            `Book ${isEditing ? "update" : "creation"} failed (${response.status}).`,
        );
      }

      await response.json();
      if (!isEditing) {
        try {
          localStorage.removeItem(draftStorageKey);
        } catch {
          setCacheWarning("The saved draft could not be cleared.");
        }
      }
      onSaved();
      closeWithAnimation(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `An unexpected error occurred while ${isEditing ? "updating" : "creating"} the book.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      className={`new-book-dialog ${isClosing ? "is-closing" : ""}`}
      ref={dialogRef}
      aria-labelledby="book-dialog-title"
      onAnimationEnd={handleAnimationEnd}
      onCancel={(event) => {
        event.preventDefault();
        closeWithAnimation();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeWithAnimation();
        }
      }}
    >
      <div className="new-book-dialog__header">
        <div>
          <p className="new-book-dialog__eyebrow">Library</p>
          <h2 id="book-dialog-title">{isEditing ? "Edit book" : "Add a new book"}</h2>
        </div>
        <button
          className="new-book-dialog__close"
          type="button"
          aria-label={`Close ${isEditing ? "edit" : "new book"} form`}
          onClick={() => closeWithAnimation()}
        >
          ×
        </button>
      </div>
      {isEditing && !isEditReady ? (
        <p className="new-book-form__loading" role={isLoadingEdit ? "status" : "alert"}>
          {isLoadingEdit ? "Loading book details…" : error}
        </p>
      ) : (
      <form
        ref={formRef}
        className="new-book-form"
        onSubmit={submitBook}
        onInvalid={() => setError("Please complete all required fields before saving.")}
        onChange={() => {
          if (error) setError("");
        }}
      >
        <div className="new-book-form__fields">
          <label className="new-book-form__field new-book-form__field--wide">
            <span>Book name <span aria-hidden="true">*</span></span>
            <input
              name="title"
              required
              maxLength={200}
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.currentTarget.value })}
            />
          </label>
          <label className="new-book-form__field">
            <span>
              Author {!isEditing && <span aria-hidden="true">*</span>}
            </span>
            <input
              name="author"
              required={!isEditing}
              maxLength={100}
              value={draft.author}
              onChange={(event) => updateDraft({ author: event.currentTarget.value })}
            />
          </label>
          <label className="new-book-form__field">
            <span>
              Editor {!isEditing && <span aria-hidden="true">*</span>}
            </span>
            <input
              name="editor"
              required={!isEditing}
              maxLength={100}
              value={draft.editor}
              onChange={(event) => updateDraft({ editor: event.currentTarget.value })}
            />
          </label>
          <label className="new-book-form__field">
            <span>
              Distributor {!isEditing && <span aria-hidden="true">*</span>}
            </span>
            <input
              name="distributor"
              required={!isEditing}
              maxLength={100}
              value={draft.distributor}
              onChange={(event) => updateDraft({ distributor: event.currentTarget.value })}
            />
          </label>
          <div
            className="new-book-form__date-group"
            role="group"
            aria-labelledby="publication-date-label"
          >
            <span id="publication-date-label" className="new-book-form__date-label">
              Publication date {!isEditing && <span aria-hidden="true">*</span>}
            </span>
            <div className="new-book-form__date-fields">
              <label className="new-book-form__field">
                <span>Year</span>
                <input
                  name="year"
                  type="number"
                  min="1500"
                  max={currentYear}
                  step="1"
                  inputMode="numeric"
                  placeholder="YYYY"
                  required={!isEditing}
                  value={draft.year}
                  onChange={(event) => updateDraft({ year: event.currentTarget.value, day: "" })}
                />
              </label>
              <label className="new-book-form__field">
                <span>
                  Month <span className="new-book-form__optional">(optional)</span>
                </span>
                <select
                  name="month"
                  value={draft.month}
                  onChange={(event) => updateDraft({ month: event.currentTarget.value, day: "" })}
                >
                  <option value="">Select month</option>
                  {months.map((month, index) => (
                    <option key={month} value={String(index + 1).padStart(2, "0")}>{month}</option>
                  ))}
                </select>
              </label>
              <label className="new-book-form__field">
                <span>
                  Day <span className="new-book-form__optional">(optional)</span>
                </span>
                <select
                  name="day"
                  value={draft.day}
                  disabled={!draft.month}
                  onChange={(event) => updateDraft({ day: event.currentTarget.value })}
                >
                  <option value="">Select day</option>
                  {Array.from(
                    {
                      length: draft.month
                        ? new Date(
                            Number(draft.year) || 2000,
                            Number(draft.month),
                            0,
                          ).getDate()
                        : 0,
                    },
                    (_, index) => String(index + 1).padStart(2, "0"),
                  ).map((day) => (
                    <option key={day} value={day}>{Number(day)}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <label className="new-book-form__field new-book-form__field--wide">
            <span>
              Description {!isEditing && <span aria-hidden="true">*</span>}
            </span>
            <textarea
              name="description"
              rows={4}
              required={!isEditing}
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.currentTarget.value })}
            />
          </label>
        </div>

        <section className="new-book-form__image-section" aria-labelledby="book-images-title">
          <div className="new-book-form__section-heading">
            <div>
              <h3 id="book-images-title">Book images</h3>
              <p>
                {isEditing
                  ? `${initialBook?.images.length ?? 0} existing image(s). Add more images below if needed.`
                  : "At least one image is required across the book and its volumes. Text and volume details are cached; image files must be selected again when reopening a saved draft."}
              </p>
            </div>
          </div>
          <label className="new-book-form__file">
            <span>Select book images</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => setBookImages(Array.from(event.currentTarget.files ?? []))}
            />
            <small>
              {bookImages.length
                ? `${bookImages.length} image(s) selected`
                : isEditing
                  ? `${initialBook?.images.length ?? 0} existing image(s) · JPEG, PNG, or WebP · 5 MB max each.`
                  : "JPEG, PNG, or WebP · 5 MB max each."}
            </small>
          </label>
        </section>

        <section className="new-book-form__volumes" aria-labelledby="book-volumes-title">
          <div className="new-book-form__section-heading">
            <div>
              <h3 id="book-volumes-title">Volumes</h3>
              <p>
                {isEditing
                  ? "Existing volumes are kept. Add images to any volume below."
                  : "Volume images are stored separately from book images."}
              </p>
            </div>
            {!isEditing && (
              <button className="new-book-form__add-volume" type="button" onClick={addVolume}>
                + Add volume
              </button>
            )}
          </div>
          {volumes.map((volume, index) => (
            <fieldset className="new-book-volume" key={volume.key}>
              <legend>Volume {index + 1}</legend>
              {!isEditing && (
                <button
                  className="new-book-volume__remove"
                  type="button"
                  onClick={() => removeVolume(volume.key)}
                >
                  Remove
                </button>
              )}
              <div className="new-book-form__fields">
                <label className="new-book-form__field">
                  <span>Volume title <span aria-hidden="true">*</span></span>
                  <input
                    aria-label={`Volume ${index + 1} title`}
                    required
                    maxLength={200}
                    value={volume.title}
                    disabled={isEditing}
                    onChange={(event) => updateVolume(volume.key, { title: event.currentTarget.value })}
                  />
                </label>
                <label className="new-book-form__field">
                  <span>Volume number <span aria-hidden="true">*</span></span>
                  <input
                    aria-label={`Volume ${index + 1} number`}
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={volume.number}
                    disabled={isEditing}
                    onChange={(event) => updateVolume(volume.key, { number: event.currentTarget.value })}
                  />
                </label>
                <label className="new-book-form__file new-book-form__field--wide">
                  <span>Images for this volume</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) =>
                      updateVolume(volume.key, {
                        images: Array.from(event.currentTarget.files ?? []),
                      })
                    }
                  />
                  <small>
                    {volume.images.length
                      ? `${volume.images.length} image(s) selected`
                      : isEditing
                        ? `${volume.existingImageCount} existing image(s) · JPEG, PNG, or WebP · 5 MB max each`
                        : "JPEG, PNG, or WebP · 5 MB max each"}
                  </small>
                </label>
              </div>
            </fieldset>
          ))}
        </section>

        {cacheWarning && <p className="new-book-form__cache-warning" role="status">{cacheWarning}</p>}
        {error && <p className="new-book-form__error" role="alert">{error}</p>}
        <div className="new-book-form__actions">
          <button
            className="new-book-form__cancel"
            type="button"
            onClick={() => {
              if (isEditing && initialBook) {
                setDraft({
                  title: initialBook.title,
                  author: initialBook.author,
                  editor: initialBook.editor,
                  distributor: initialBook.distributor,
                  description: initialBook.description,
                  ...toDraftDate(initialBook.year),
                });
                setVolumes(
                  initialBook.vols.map((volume, key) => ({
                    key,
                    id: volume.id,
                    title: volume.title,
                    number: String(volume.number),
                    images: [],
                    existingImageCount: volume.images.length,
                  })),
                );
                setNextVolumeKey(initialBook.vols.length);
                setBookImages([]);
                setError("");
              } else {
                formRef.current?.reset();
                setDraft(emptyBookDraft);
                setBookImages([]);
                setVolumes([]);
                setNextVolumeKey(0);
                setError("");
                try {
                  localStorage.removeItem(draftStorageKey);
                  setCacheWarning("");
                } catch {
                  setCacheWarning("The saved draft could not be cleared.");
                }
              }
            }}
            disabled={isSubmitting}
          >
            {isEditing ? "Reset changes" : "Reset form"}
          </button>
          <button
            className="new-book-form__cancel"
            type="button"
            onClick={() => closeWithAnimation()}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button className="btn-jade new-book-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing ? "Updating book…" : "Saving book…"
              : isEditing ? "Save changes" : "Save book"}
          </button>
        </div>
      </form>
      )}
    </dialog>
  );
}

export default NewBookDialog;
