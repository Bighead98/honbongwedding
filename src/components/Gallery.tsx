import { useRef, useState } from "react";
import type { Photo as PhotoData } from "../config/invitation";
import Photo from "./Photo";
import Icon from "./Icon";
import Dialog from "./Dialog";
export default function Gallery({ photos }: { photos: PhotoData[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const navigate = (direction: number) =>
    setIndex((previous) =>
      previous === null
        ? null
        : (previous + direction + photos.length) % photos.length,
    );
  if (photos.length === 0)
    return <p className="muted">함께한 순간들을 곧 담아둘게요.</p>;
  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            className="gallery-thumb"
            aria-label={`사진 ${i + 1} 확대 보기: ${photo.alt}`}
            onClick={() => setIndex(i)}
          >
            <Photo
              key={photo.src}
              photo={photo}
              sizes="(max-width: 480px) 46vw, 215px"
            />
          </button>
        ))}
      </div>
      {index !== null && (
        <Dialog
          title="사진 갤러리 확대 보기"
          className="gallery-dialog"
          onClose={() => setIndex(null)}
          onNavigate={navigate}
        >
          <div
            className="lightbox-photo"
            onTouchStart={(event) => {
              touch.current = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
              };
            }}
            onTouchEnd={(event) => {
              if (!touch.current || !event.changedTouches[0]) return;
              const dx = event.changedTouches[0].clientX - touch.current.x;
              const dy = event.changedTouches[0].clientY - touch.current.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
                navigate(dx < 0 ? 1 : -1);
              touch.current = null;
            }}
          >
            <Photo
              key={photos[index].src}
              photo={photos[index]}
              eager
              sizes="(max-width: 960px) 100vw, 960px"
            />
          </div>
          <div className="lightbox-controls">
            <button
              className="icon-button"
              onClick={() => navigate(-1)}
              aria-label="이전 사진"
            >
              <Icon name="left" size={24} />
            </button>
            <span aria-live="polite">
              {index + 1} / {photos.length}
            </span>
            <button
              className="icon-button"
              onClick={() => navigate(1)}
              aria-label="다음 사진"
            >
              <Icon name="right" size={24} />
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
