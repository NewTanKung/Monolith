"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, AlertTriangle } from "lucide-react";
let scrollLocks = 0;
let originalOverflow = "";

export function Dialog({
  open,
  title,
  children,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    if (scrollLocks++ === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (--scrollLocks === 0) document.body.style.overflow = originalOverflow;
    };
  }, [open]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={"workspace-dialog" + (wide ? " is-wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="ปิดหน้าต่าง"
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      {children}
    </dialog>
  );
}

type Confirmation = {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
};
const ConfirmContext = createContext<(value: Confirmation) => Promise<boolean>>(
  () => Promise.resolve(false),
);
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [question, setQuestion] = useState<Confirmation | null>(null);
  const pending = useRef<((answer: boolean) => void) | null>(null);
  function settle(answer: boolean) {
    pending.current?.(answer);
    pending.current = null;
    setQuestion(null);
  }
  useEffect(
    () => () => {
      pending.current?.(false);
    },
    [],
  );
  return (
    <ConfirmContext.Provider
      value={(value) =>
        new Promise((resolve) => {
          pending.current?.(false);
          pending.current = resolve;
          setQuestion(value);
        })
      }
    >
      {children}
      <Dialog
        open={!!question}
        title={question?.title || "ยืนยันการเปลี่ยนแปลง"}
        onClose={() => settle(false)}
      >
        <div className="dialog-body">
          <div className="confirm-symbol">
            <AlertTriangle size={22} aria-hidden="true" />
          </div>
          <p className="text-muted">{question?.description}</p>
        </div>
        <footer className="dialog-actions">
          <button
            className="secondary-button"
            autoFocus
            onClick={() => settle(false)}
          >
            ยกเลิก
          </button>
          <button
            className={question?.danger ? "danger-button" : "primary-button"}
            onClick={() => settle(true)}
          >
            {question?.confirmLabel || "ยืนยัน"}
          </button>
        </footer>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
export function useConfirm() {
  return useContext(ConfirmContext);
}
