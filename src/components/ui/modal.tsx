"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Wider panel for forms */
  size?: "sm" | "md";
  closeOnBackdrop?: boolean;
  disableClose?: boolean;
};

const EXIT_MS = 200;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "sm",
  closeOnBackdrop = true,
  disableClose = false,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"open" | "closing">("closing");

  useEffect(() => {
    let enterTimer = 0;
    let leaveTimer = 0;
    let raf1 = 0;
    let raf2 = 0;

    if (open) {
      enterTimer = window.setTimeout(() => {
        setMounted(true);
        setPhase("closing");
        raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setPhase("open"));
        });
      }, 0);
    } else {
      enterTimer = window.setTimeout(() => {
        setPhase("closing");
        leaveTimer = window.setTimeout(() => setMounted(false), EXIT_MS);
      }, 0);
    }

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(leaveTimer);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || phase !== "open") return;
    panelRef.current
      ?.querySelector<HTMLElement>("button, input, textarea, select")
      ?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !disableClose) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, phase, disableClose, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="modal-backdrop"
      data-state={phase}
      role="presentation"
      onClick={() => {
        if (closeOnBackdrop && !disableClose) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modal-panel"
        data-size={size}
        data-state={phase}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="section-title">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="muted modal-description">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
