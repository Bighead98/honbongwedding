import { useEffect, useRef, type ReactNode, type KeyboardEvent, type RefObject } from "react";
import Icon from "./Icon";
import { createPortal } from "react-dom";
export default function Dialog({
  children,
  title,
  onClose,
  onNavigate,
  className = "",
  initialFocus,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  onNavigate?: (direction: number) => void;
  className?: string;
  initialFocus?: RefObject<HTMLElement | null>;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    const background = document.getElementById("invitation");
    const previousInert = background?.inert ?? false;
    const previousHidden = background?.getAttribute("aria-hidden");
    document.body.style.overflow = "hidden";
    if (background) { background.inert = true; background.setAttribute("aria-hidden", "true"); }
    (initialFocus?.current ?? close.current)?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (background) {
        background.inert = previousInert;
        if (background.hidden) background.setAttribute("aria-hidden", "true");
        else if (previousHidden === null || previousHidden === undefined) background.removeAttribute("aria-hidden");
        else background.setAttribute("aria-hidden", previousHidden);
      }
      if (previous?.isConnected && !previous.closest("[hidden], [inert]")) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [initialFocus]);
  function keyboard(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (onNavigate && event.key === "ArrowLeft") {
      event.preventDefault();
      onNavigate(-1);
    }
    if (onNavigate && event.key === "ArrowRight") {
      event.preventDefault();
      onNavigate(1);
    }
    if (event.key === "Tab") {
      const elements = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], textarea, input, [tabindex="0"]',
        ) ?? [],
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  return createPortal(
    <div
      className={`dialog-backdrop ${className}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="dialog"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={keyboard}
      >
        <button
          className="dialog-close icon-button"
          onClick={onClose}
          aria-label="닫기"
          ref={close}
        >
          <Icon name="close" size={24} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
