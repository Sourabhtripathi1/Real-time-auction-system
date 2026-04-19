import { useState, useEffect, useRef, useCallback } from "react";

// ── Helper: extract URL from image object or string ────────
const getImageUrl = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.url || "";
};

// ── Placeholder SVG ────────────────────────────────────────
const Placeholder = ({ height }) => (
  <div
    className={`w-full ${height} bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2`}>
    <svg
      className="w-12 h-12 text-gray-300 dark:text-gray-700"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
    <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">
      No Images Available
    </span>
  </div>
);

// ── Arrow Button ───────────────────────────────────────────
const ArrowBtn = ({ direction, onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`absolute ${direction === "left" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100`}
    aria-label={direction === "left" ? "Previous image" : "Next image"}>
    {direction === "left" ? (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    )}
  </button>
);

// ── Single Slide Image ─────────────────────────────────────
const SlideImage = ({ url, index, total, objectFit }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="min-w-full h-full relative">
      {/* Shimmer background — visible until image loads */}
      {!loaded && !failed && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* Error fallback */}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <svg
            className="w-10 h-10 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <img
        src={url}
        alt={`Slide ${index + 1} of ${total}`}
        className={`w-full h-full ${objectFit}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        draggable={false}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// IMAGE SLIDER
// ═══════════════════════════════════════════════════════════
const ImageSlider = ({
  images = [],
  height = "h-48",
  showThumbnails = false,
  showDots = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  rounded = "rounded-xl",
  objectFit = "object-cover",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const thumbnailRef = useRef(null);

  const validImages = images?.filter((img) => getImageUrl(img)) || [];
  const total = validImages.length;

  // AutoPlay
  useEffect(() => {
    if (!autoPlay || isHovered || total <= 1) return;
    const iv = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, autoPlayInterval);
    return () => clearInterval(iv);
  }, [autoPlay, autoPlayInterval, isHovered, total]);

  // Auto‑scroll thumbnails
  useEffect(() => {
    if (showThumbnails && thumbnailRef.current) {
      const thumb = thumbnailRef.current.children[currentIndex];
      if (thumb) {
        thumb.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [currentIndex, showThumbnails]);

  const goTo = useCallback((i) => setCurrentIndex(i), []);
  const goPrev = useCallback(
    () => setCurrentIndex((c) => Math.max(0, c - 1)),
    [],
  );
  const goNext = useCallback(
    () => setCurrentIndex((c) => Math.min(total - 1, c + 1)),
    [total],
  );

  // Keyboard
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    },
    [goPrev, goNext],
  );

  const [dragOffset, setDragOffset] = useState(0);

  // Mouse / Touch Swipe & Drag
  const handleDragStart = (e) => {
    if (total <= 1) return;
    setIsDragging(true);
    dragStartX.current = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const currentX = e.type.includes("mouse") ? e.pageX : e.touches[0].clientX;
    const diff = currentX - dragStartX.current;
    
    // Dampening at the edges
    if (currentIndex === 0 && diff > 0) {
      setDragOffset(diff * 0.3);
    } else if (currentIndex === total - 1 && diff < 0) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleDragEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);

    const endX = e.type.includes("mouse") || e.type === "mouseleave" 
      ? e.pageX 
      : e.changedTouches?.[0]?.clientX;
      
    if (endX === undefined) return;

    const diff = dragStartX.current - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  if (total === 0) return <Placeholder height={height} />;

  return (
    <div className="w-full select-none">
      {/* Main Image Area */}
      <div
        className={`group relative w-full ${height} ${rounded} overflow-hidden bg-gray-100 dark:bg-gray-800 touch-pan-y ${total > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={(e) => {
          setIsHovered(false);
          handleDragEnd(e);
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Image slider">
        {/* Slide Track */}
        <div
          className={`flex h-full will-change-transform ${
            isDragging 
              ? "transition-none" 
              : "transition-transform duration-500 ease-out"
          }`}
          style={{ transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))` }}>
          {validImages.map((img, i) => (
            <SlideImage
              key={i}
              url={getImageUrl(img)}
              index={i}
              total={total}
              objectFit={objectFit}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        {total > 1 && currentIndex > 0 && (
          <ArrowBtn direction="left" onClick={goPrev} />
        )}
        {total > 1 && currentIndex < total - 1 && (
          <ArrowBtn direction="right" onClick={goNext} />
        )}

        {/* Dot Indicators */}
        {showDots && total > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {validImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? "bg-white w-2.5 h-2.5 shadow-sm"
                    : "bg-white/50 w-1.5 h-1.5 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && total > 1 && (
        <div
          ref={thumbnailRef}
          className="flex gap-2 mt-2 overflow-x-auto py-1 scrollbar-thin">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-14 h-14 flex-shrink-0 rounded-md overflow-hidden transition-all duration-200 ${
                i === currentIndex
                  ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-900 opacity-100"
                  : "opacity-60 hover:opacity-100"
              }`}>
              <img
                src={getImageUrl(img)}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
