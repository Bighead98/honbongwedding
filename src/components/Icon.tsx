import type { CSSProperties } from "react";
export type IconName =
  | "music"
  | "pause"
  | "heart"
  | "leaf"
  | "close"
  | "left"
  | "right"
  | "chevron"
  | "copy"
  | "phone"
  | "message"
  | "pin"
  | "calendar"
  | "share"
  | "arrow"
  | "image";
const paths: Record<IconName, string[]> = {
  music: [
    "M9 18V5l11-2v13",
    "M9 5l11-2",
    "M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z",
    "M20 16a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z",
  ],
  pause: ["M8 5v14", "M16 5v14"],
  heart: [
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  ],
  leaf: ["M5 21c2-8 7-12 13-16", "M5 15C1 4 9 2 20 3c1 11-5 17-15 12Z"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  left: ["m15 5-7 7 7 7"],
  right: ["m9 5 7 7-7 7"],
  chevron: ["m6 9 6 6 6-6"],
  copy: ["M9 9h11v11H9Z", "M15 5V3H3v12h2"],
  phone: [
    "M5 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c0 2-2 3-4 2C9 19 5 15 3 7 2 5 3 3 5 3Z",
  ],
  message: [
    "M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z",
    "M7 8h10",
    "M7 12h7",
  ],
  pin: [
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z",
    "M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  ],
  calendar: [
    "M3 5h18v16H3Z",
    "M3 10h18",
    "M7 3v4",
    "M17 3v4",
    "M8 14h2",
    "M14 14h2",
  ],
  share: ["M12 16V3", "m7 8 5-5 5 5", "M5 13v8h14v-8"],
  arrow: ["M4 12h16", "m14 6 6 6-6 6"],
  image: ["M3 3h18v18H3Z", "m3 17 6-6 4 4 3-3 5 5", "M9 7h.01"],
};
export default function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name].map((d, i) => (
        <path d={d} key={i} />
      ))}
    </svg>
  );
}
