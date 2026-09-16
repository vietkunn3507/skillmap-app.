"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { AlertCircle, ArrowRight, LoaderCircle, X } from "lucide-react";
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function DataState({
  loading,
  error,
  retry,
  empty,
  children,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="state loading" role="status">
        <LoaderCircle className="spin" size={22} />
        <span>Đang tải dữ liệu…</span>
        <div className="skeleton" />
        <div className="skeleton short" />
      </div>
    );
  if (error)
    return (
      <div className="state" role="alert">
        <AlertCircle size={24} />
        <strong>{error}</strong>
        <button className="button secondary" onClick={retry}>
          Thử lại
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="state">
        <span>Chưa có dữ liệu phù hợp.</span>
        <p>Thử thay đổi bộ lọc hoặc bổ sung kỹ năng của bạn.</p>
      </div>
    );
  return <>{children}</>;
}
export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-note">
      <span className="badge">Minh họa</span>
      <span>
        {children || "Tính năng thử nghiệm — chưa có dịch vụ xử lý dữ liệu."}
      </span>
    </div>
  );
}
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-inner">
        <div className="sheet-handle" />
        <div className="section-title">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Arrow() {
  return <ArrowRight size={17} />;
}
