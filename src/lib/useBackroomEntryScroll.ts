import { useLayoutEffect, type RefObject } from "react";

export function useBackroomEntryScroll(start: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    let active = true;
    let frame = 0;
    let settleTimer = 0;

    const resetTop = () => {
      if (!active) return;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    const scheduleReset = () => {
      if (!active) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(resetTop);
    };
    const finish = () => {
      if (!active) return;
      active = false;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      viewport?.removeEventListener("resize", scheduleReset);
      window.removeEventListener("resize", scheduleReset);
      for (const event of ["pointerdown", "touchstart", "wheel", "keydown"] as const) {
        document.removeEventListener(event, finish, true);
      }
    };

    start.current?.focus({ preventScroll: true });
    resetTop();
    // 입력창 정리와 모바일 키보드가 닫힌 뒤에도 시작 위치를 맞춥니다.
    frame = window.requestAnimationFrame(() => {
      resetTop();
      frame = window.requestAnimationFrame(resetTop);
    });
    viewport?.addEventListener("resize", scheduleReset);
    window.addEventListener("resize", scheduleReset);
    for (const event of ["pointerdown", "touchstart", "wheel", "keydown"] as const) {
      document.addEventListener(event, finish, { capture: true, passive: true });
    }
    settleTimer = window.setTimeout(finish, 800);

    return finish;
  }, [start]);
}
