import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { BookImage } from "../types/Book";
import { useSettings } from "../Hooks/useSettings";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
type ImageOrientation = "portrait" | "landscape";

interface BookImagePopupProps {
  images: BookImage[];
  label: string;
  /** Which image to show first. The popup is mounted fresh each time it opens. */
  initialIndex: number;
  /** Called after the dialog closes (button, Escape). Receives the last viewed index. */
  onClose: (lastIndex: number) => void;
}

function BookImagePopup({ images, label, initialIndex, onClose }: BookImagePopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { t } = useSettings();
  const count = images.length;

  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)),
  );
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [imageOrientation, setImageOrientation] = useState<{
    id: number;
    value: ImageOrientation;
  } | null>(null);

  // Open as a real modal on mount; lock the page scroll while it is open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keep the zoomed image centred whenever zoom or image changes.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const direction = getComputedStyle(viewport).direction === "rtl" ? -1 : 1;
    viewport.scrollLeft = direction * Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2);
  }, [zoom, index]);

  const image = images[index];
  if (!image) return null;
  const orientation =
    imageOrientation?.id === image.id ? imageOrientation.value : "landscape";

  const step = (delta: number) => {
    setIndex((current) => (current + delta + count) % count);
    setZoom(MIN_ZOOM);
  };

  const zoomBy = (delta: number) => {
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + delta)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    switch (event.key) {
      case "ArrowRight":
        if (count > 1) step(1);
        break;
      case "ArrowLeft":
        if (count > 1) step(-1);
        break;
      case "+":
      case "=":
        zoomBy(ZOOM_STEP);
        break;
      case "-":
        zoomBy(-ZOOM_STEP);
        break;
      case "0":
        setZoom(MIN_ZOOM);
        break;
      default:
        return; // Escape is handled natively by <dialog>
    }
    event.preventDefault();
  };

  return (
    <dialog
      ref={dialogRef}
      className="image-popup"
      aria-label={`${label} ${t("image gallery")}`}
      onClose={() => onClose(index)}
      onKeyDown={handleKeyDown}
    >
      <div className="image-popup__content">
        <header className="image-popup__toolbar">
          <div className="image-popup__zoom" role="group" aria-label={t("Zoom")}>
            <button
              type="button"
              className="image-popup__btn"
              aria-label={t("Zoom out")}
              onClick={() => zoomBy(-ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
            >
              −
            </button>
            <button
              type="button"
              className="image-popup__btn image-popup__btn--wide"
              aria-label={t("Reset zoom, currently {percent} percent").replace(
                "{percent}",
                String(Math.round(zoom * 100)),
              )}
              onClick={() => setZoom(MIN_ZOOM)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="image-popup__btn"
              aria-label={t("Zoom in")}
              onClick={() => zoomBy(ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="image-popup__btn image-popup__btn--wide"
            aria-label={t("Close image viewer")}
            onClick={() => dialogRef.current?.close()}
          >
            {t("Close")}
          </button>
        </header>

        <div className="image-popup__viewport" ref={viewportRef}>
          <div
            className="image-popup__stage"
            data-orientation={orientation}
            style={{ "--zoom": zoom } as CSSProperties}
          >
            <img
              src={image.image_url}
              alt={`${label}, ${t("image")} ${index + 1} ${t("of")} ${count}`}
              draggable={false}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                setImageOrientation({
                  id: image.id,
                  value: naturalHeight > naturalWidth ? "portrait" : "landscape",
                });
              }}
              onDoubleClick={() =>
                setZoom((z) => (z === MIN_ZOOM ? 2 : MIN_ZOOM))
              }
            />
          </div>
        </div>

        {count > 1 && (
          <footer className="image-popup__nav">
            <button
              type="button"
              className="image-popup__btn"
              aria-label={t("Previous image")}
              onClick={() => step(-1)}
            >
              ‹
            </button>
            <span aria-live="polite">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              className="image-popup__btn"
              aria-label={t("Next image")}
              onClick={() => step(1)}
            >
              ›
            </button>
          </footer>
        )}
      </div>
    </dialog>
  );
}

export default BookImagePopup;
