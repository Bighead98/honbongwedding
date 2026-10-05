import type { Invitation } from "../config/invitation";
export function phoneHref(
  phone: string | null,
  consent: boolean,
  kind: "tel" | "sms",
) {
  if (!consent || !validPhone(phone)) return null;
  return `${kind}:${phone.replace(/[^\d+]/g, "")}`;
}
export function validPhone(phone: string | null): phone is string {
  return Boolean(
    phone &&
    /^\+?[\d\s()-]{8,24}$/.test(phone) &&
    /^\d{8,15}$/.test(phone.replace(/\D/g, "")),
  );
}
export async function copyText(value: string): Promise<boolean> {
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* 수동 선택 대안 표시 */
  }
  return false;
}
export function mapLinks(venue: Invitation["venue"]) {
  if (!venue.confirmed || !venue.name.trim() || !venue.address.trim())
    return null;
  const query = encodeURIComponent(`${venue.name} ${venue.address}`);
  const coords =
    venue.lat !== null &&
    venue.lng !== null &&
    Number.isFinite(venue.lat) &&
    Number.isFinite(venue.lng) &&
    Math.abs(venue.lat) <= 90 &&
    Math.abs(venue.lng) <= 180;
  return {
    naver: venue.naverUrl?.startsWith("https://")
      ? venue.naverUrl
      : `https://map.naver.com/v5/search/${query}`,
    kakao: venue.kakaoUrl?.startsWith("https://")
      ? venue.kakaoUrl
      : coords
        ? `https://map.kakao.com/link/to/${encodeURIComponent(venue.name)},${venue.lat},${venue.lng}`
        : `https://map.kakao.com/link/search/${query}`,
  };
}
interface KakaoSdk {
  isInitialized(): boolean;
  init(key: string): void;
  Share: { sendDefault(options: object): void };
}
declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}
let sdkPromise: Promise<KakaoSdk> | null = null;
export function loadKakao(): Promise<KakaoSdk> {
  if (window.Kakao) return Promise.resolve(window.Kakao);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js";
    script.integrity =
      "sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy";
    script.crossOrigin = "anonymous";
    const timer = window.setTimeout(() => {
      script.remove();
      sdkPromise = null;
      reject(new Error("카카오톡 연결 시간 초과"));
    }, 10000);
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.Kakao) resolve(window.Kakao);
      else {
        sdkPromise = null;
        script.remove();
        reject(new Error("카카오 SDK 미확인"));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      sdkPromise = null;
      script.remove();
      reject(new Error("카카오 SDK 로딩 실패"));
    };
    document.head.append(script);
  });
  return sdkPromise;
}
