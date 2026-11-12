import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { BookImage } from "../types/Book";
import BookImagePopup from "./BookImagePopup";
import { useSettings } from "../Hooks/useSettings";

interface BookImageCarouselProps {
  images: BookImage[];
  label: string;
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function BookImageCarousel({ images, label }: BookImageCarouselProps) {
  const count = images.length;
  const { t } = useSettings();

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  // While we are scrolling on purpose, the observer ignores the slides we pass on the way.
  const pendingIndex = useRef<number | null>(null);
  const pendingTimer = useRef<number | undefined>(undefined);
  const trackRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [popupIndex, setPopupIndex] = useState<number | null>(null);

  // Never trust the stored index if `images` shrank.
  const current = Math.min(activeIndex, Math.max(count - 1, 0));

  // The scroll position is the single source of truth for the counter.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (pendingIndex.current !== null) {
            if (index !== pendingIndex.current) continue;
            pendingIndex.current = null;
          }
          setActiveIndex(index);
        }
      },
      { root: track, threshold: 0.6 },
    );

    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => () => window.clearTimeout(pendingTimer.current), []);

  const goTo = useCallback(
    (target: number, behavior: ScrollBehavior = "smooth") => {
      if (count === 0) return;
      const index = (target + count) % count;
      const slide = slideRefs.current[index];
      if (!slide) return;

      pendingIndex.current = index;
      window.clearTimeout(pendingTimer.current);
      pendingTimer.current = window.setTimeout(() => {
        pendingIndex.current = null;
      }, 800);

      // Jumping across several slides (wrap-around) is instant, not a long sweep.
      const farJump = Math.abs(index - current) > 1;
      setActiveIndex(index);
      slide.scrollIntoView({
        behavior: farJump || prefersReducedMotion() ? "auto" : behavior,
        inline: "start",
        block: "nearest",
      });
    },
    [count, current],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(current - 1);
    }
  };

  if (count === 0) {
    return <div className="book-image-carousel__empty">{t("No images available")}</div>;
  }

  return (
    <section
      className="book-image-carousel"
      aria-label={`${label} ${t("image gallery")}`}
    >
      <div
        className="book-image-carousel__track"
        ref={trackRef}
        role="group"
        aria-label={`${label} ${t("images")}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {images.map((image, index) => (
          <div
            className="book-image-carousel__slide"
            key={image.id}
            data-index={index}
            ref={(element) => {
              slideRefs.current[index] = element;
            }}
          >
            <img
              src={image.image_url}
              alt={`${label}, image ${index + 1} of ${count}`}
              loading={index === 0 ? "eager" : "lazy"}
              draggable={false}
            />
            <button
              type="button"
              className="book-image-carousel__expand"
              aria-label={t("View image {index} full screen").replace(
                "{index}",
                String(index + 1),
              )}
              onClick={() => setPopupIndex(index)}
            >
              <span aria-hidden="true">⛶</span>
            </button>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="book-image-carousel__controls">
          <button
            type="button"
            aria-label={t("Previous {label} image").replace("{label}", label)}
            onClick={() => goTo(current - 1)}
          >
            ‹
          </button>
          <span aria-live="polite">
            {current + 1} / {count}
          </span>
          <button
            type="button"
            aria-label={t("Next {label} image").replace("{label}", label)}
            onClick={() => goTo(current + 1)}
          >
            ›
          </button>
        </div>
      )}

      {popupIndex !== null && (
        <BookImagePopup
          images={images}
          label={label}
          initialIndex={popupIndex}
          onClose={(lastIndex) => {
            setPopupIndex(null);
            goTo(lastIndex, "auto"); // carousel follows where the popup ended
          }}
        />
      )}
    </section>
  );
}

export default BookImageCarousel;