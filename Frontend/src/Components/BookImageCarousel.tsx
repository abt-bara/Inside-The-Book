import { useRef, useState, type KeyboardEvent } from "react";
import type { BookImage } from "../types/Book";

interface BookImageCarouselProps {
  images: BookImage[];
  label: string;
}

function BookImageCarousel({ images, label }: BookImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDialogElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToImage = (index: number) => {
    const boundedIndex = (index + images.length) % images.length;
    const slide = trackRef.current?.children[boundedIndex];
    if (slide instanceof HTMLElement) {
      trackRef.current?.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    }
    setActiveIndex(boundedIndex);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" && images.length > 1) {
      event.preventDefault();
      scrollToImage(activeIndex + 1);
    } else if (event.key === "ArrowLeft" && images.length > 1) {
      event.preventDefault();
      scrollToImage(activeIndex - 1);
    }
  };

  if (images.length === 0) {
    return <div className="book-image-carousel__empty">No images available</div>;
  }

  return (
    <section className="book-image-carousel" aria-label={`${label} image gallery`}>
      <div
        className="book-image-carousel__track"
        ref={trackRef}
        role="group"
        aria-label={`${label} images`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={(event) => {
          const track = event.currentTarget;
          const index = Math.round(track.scrollLeft / track.clientWidth);
          setActiveIndex(Math.min(index, images.length - 1));
        }}
      >
        {images.map((image, index) => (
          <div className="book-image-carousel__slide" key={image.id} data-carousel-slide>
            <img
              src={image.image_url}
              alt={`${label}, image ${index + 1} of ${images.length}`}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <button
              className="book-image-carousel__expand"
              type="button"
              aria-label={`View image ${index + 1} full screen`}
              onClick={() => {
                setActiveIndex(index);
                viewerRef.current?.showModal();
              }}
            >
              <span aria-hidden="true">⛶</span>
            </button>
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="book-image-carousel__controls">
          <button
            type="button"
            aria-label={`Previous ${label} image`}
            onClick={() => scrollToImage(activeIndex - 1)}
          >
            ‹
          </button>
          <span aria-live="polite">{activeIndex + 1} / {images.length}</span>
          <button
            type="button"
            aria-label={`Next ${label} image`}
            onClick={() => scrollToImage(activeIndex + 1)}
          >
            ›
          </button>
        </div>
      )}
      <dialog
        className="book-image-viewer"
        ref={viewerRef}
        aria-label={`${label} full-screen image viewer`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            viewerRef.current?.close();
          }
        }}
      >
        <div className="book-image-viewer__content">
          <button
            className="book-image-viewer__close"
            type="button"
            aria-label="Close full-screen image"
            onClick={() => viewerRef.current?.close()}
          >
            Close
          </button>
          <img
            src={images[activeIndex].image_url}
            alt={`${label}, image ${activeIndex + 1} of ${images.length}`}
          />
          {images.length > 1 && (
            <div className="book-image-viewer__controls">
              <button type="button" aria-label="Previous image" onClick={() => scrollToImage(activeIndex - 1)}>
                ‹
              </button>
              <span aria-live="polite">{activeIndex + 1} / {images.length}</span>
              <button type="button" aria-label="Next image" onClick={() => scrollToImage(activeIndex + 1)}>
                ›
              </button>
            </div>
          )}
        </div>
      </dialog>
    </section>
  );
}

export default BookImageCarousel;
