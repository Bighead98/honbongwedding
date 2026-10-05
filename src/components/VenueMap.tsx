import { useState } from "react";
import type { Invitation } from "../config/invitation";
import Icon from "./Icon";
export default function VenueMap({ venue }: { venue: Invitation["venue"] }) {
  const [failed, setFailed] = useState(false);
  if (venue.confirmed && venue.mapImage && !failed)
    return (
      <figure className="venue-map">
        <img
          src={venue.mapImage}
          alt={`${venue.name} 간단 약도: 합정역 2번 출구에서 도보 약 4분, 우리은행 옆`}
          width={720}
          height={480}
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <figcaption>
          <a className="button venue-map-enlarge" href={venue.mapImage} target="_blank" rel="noreferrer">
            약도 크게 보기
          </a>
        </figcaption>
      </figure>
    );
  return (
    <div className="map-placeholder">
      <Icon name="pin" size={29} />
      <p>{venue.confirmed ? venue.name : "반가운 만남을 기다리는 곳"}</p>
      <span>
        {venue.confirmed
          ? "아래 지도에서 위치와 경로를 확인해주세요"
          : "장소 확정 후 지도에서 확인하실 수 있어요"}
      </span>
    </div>
  );
}
