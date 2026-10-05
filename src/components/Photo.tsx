import { useState } from "react";
import type { Photo as PhotoData } from "../config/invitation";
import Icon from "./Icon";
export default function Photo({
  photo,
  eager = false,
  sizes = "(max-width: 480px) 100vw, 480px",
  className = "",
}: {
  photo: PhotoData | null;
  eager?: boolean;
  sizes?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed)
    return (
      <div
        className={`photo-placeholder ${className}`}
        role="img"
        aria-label={
          photo ? `${photo.alt} — 사진을 불러오지 못했습니다` : "사진 준비 중"
        }
      >
        <Icon name="leaf" size={38} />
        <span>
          {failed ? "사진을 불러오지 못했어요" : "소중한 순간을 담을 자리"}
        </span>
      </div>
    );
  return (
    <img
      className={className}
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width ?? 960}
      height={photo.height ?? 1440}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      style={{ objectPosition: photo.position }}
      onError={() => setFailed(true)}
    />
  );
}
