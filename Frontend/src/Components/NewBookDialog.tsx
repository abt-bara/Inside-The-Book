import {
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
  type FormEvent,
} from "react";
import apiConfig from "../../../shared/api-config.json";

interface VolumeDraft {
  key: number;
  title: string;
  number: string;
  images: File[];
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
  isNew: boolean;
}

interface CachedDraft extends BookDraft {
  volumes: { title: string; number: string }[];
}

interface NewBookDialogProps {
  onClose: () => void;
  onCreated: () => void;
}

const draftStorageKey = "inside-the-book:new-book-draft";
const currentYear = new Date().getFullYear();
const publicationYears = Array.from(
  { length: currentYear - 1499 },
  (_, index) => String(currentYear - index),
);
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
  isNew: false,
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
      typeof candidate.isNew !== "boolean" ||
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

function NewBookDialog({ onClose, onCreated }: NewBookDialogProps) {
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
      })) ?? [],
  );
  const [nextVolumeKey, setNextVolumeKey] = useState(
    () => cachedDraft.draft?.volumes.length ?? 0,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(cachedDraft.warning);
  const [cacheWarning, setCacheWarning] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const saveDraft = (nextDraft: BookDraft, nextVolumes: VolumeDraft[]) => {
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

  const submitBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const requiredFields = [
      ["Book name", draft.title],
      ["Author", draft.author],
      ["Editor", draft.editor],
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

    if (bookImages.length === 0 && volumes.every((volume) => volume.images.length === 0)) {
      setError("Select at least one image for the book or one of its volumes.");
      return;
    }

    setIsSubmitting(true);
    const payload: BookPayload = {
      title: String(formData.get("title") ?? "").trim(),
      author: String(formData.get("author") ?? "").trim(),
      editor: String(formData.get("editor") ?? "").trim(),
      distributor: String(formData.get("distributor") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      year: [
        draft.year,
        draft.month,
        draft.day ? draft.day.padStart(2, "0") : "",
      ].filter(Boolean).join("-"),
      new: draft.isNew,
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

    try {
      const response = await fetch(
        `${apiConfig.apiPrefix}${apiConfig.api.books}`,
        { method: "POST", body: requestBody },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Book creation failed (${response.status}).`);
      }

      await response.json();
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        setCacheWarning("The saved draft could not be cleared.");
      }
      onCreated();
      closeWithAnimation(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while creating the book.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      className={`new-book-dialog ${isClosing ? "is-closing" : ""}`}
      ref={dialogRef}
      aria-labelledby="new-book-title"
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
          <h2 id="new-book-title">Add a new book</h2>
        </div>
        <button
          className="new-book-dialog__close"
          type="button"
          aria-label="Close new book form"
          onClick={() => closeWithAnimation()}
        >
          ×
        </button>
      </div>
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
            <span>Author <span aria-hidden="true">*</span></span>
            <input
              name="author"
              required
              maxLength={100}
              value={draft.author}
              onChange={(event) => updateDraft({ author: event.currentTarget.value })}
            />
          </label>
          <label className="new-book-form__field">
            <span>Editor <span aria-hidden="true">*</span></span>
            <input
              name="editor"
              required
              maxLength={100}
              value={draft.editor}
              onChange={(event) => updateDraft({ editor: event.currentTarget.value })}
            />
          </label>
          <label className="new-book-form__field">
            <span>Distributor <span aria-hidden="true">*</span></span>
            <input
              name="distributor"
              required
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
              Publication date <span aria-hidden="true">*</span>
            </span>
            <div className="new-book-form__date-fields">
              <label className="new-book-form__field">
                <span>Year</span>
                <select
                  name="year"
                  required
                  value={draft.year}
                  onChange={(event) => updateDraft({ year: event.currentTarget.value, day: "" })}
                >
                  <option value="">Select year</option>
                  {publicationYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
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
            <span>Description <span aria-hidden="true">*</span></span>
            <textarea
              name="description"
              rows={4}
              required
              value={draft.description}
              onChange={(event) => updateDraft({ description: event.currentTarget.value })}
            />
          </label>
          <label className="new-book-form__checkbox">
            <input
              name="new"
              type="checkbox"
              checked={draft.isNew}
              onChange={(event) => updateDraft({ isNew: event.currentTarget.checked })}
            />
            <span>Mark as printed</span>
          </label>
        </div>

        <section className="new-book-form__image-section" aria-labelledby="book-images-title">
          <div className="new-book-form__section-heading">
            <div>
              <h3 id="book-images-title">Book images</h3>
              <p>
                At least one image is required across the book and its volumes.
                Text and volume details are cached; image files must be selected
                again when reopening a saved draft.
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
                : "JPEG, PNG, or WebP · 5 MB max each."}
            </small>
          </label>
        </section>

        <section className="new-book-form__volumes" aria-labelledby="book-volumes-title">
          <div className="new-book-form__section-heading">
            <div>
              <h3 id="book-volumes-title">Volumes</h3>
              <p>Volume images are stored separately from book images.</p>
            </div>
            <button className="new-book-form__add-volume" type="button" onClick={addVolume}>
              + Add volume
            </button>
          </div>
          {volumes.map((volume, index) => (
            <fieldset className="new-book-volume" key={volume.key}>
              <legend>Volume {index + 1}</legend>
              <button
                className="new-book-volume__remove"
                type="button"
                onClick={() => removeVolume(volume.key)}
              >
                Remove
              </button>
              <div className="new-book-form__fields">
                <label className="new-book-form__field">
                  <span>Volume title <span aria-hidden="true">*</span></span>
                  <input
                    aria-label={`Volume ${index + 1} title`}
                    required
                    maxLength={200}
                    value={volume.title}
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
            }}
            disabled={isSubmitting}
          >
            Reset form
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
            {isSubmitting ? "Saving book…" : "Save book"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default NewBookDialog;
