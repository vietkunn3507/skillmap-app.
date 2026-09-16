"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="state">
      <h1>Đã có lỗi xảy ra</h1>
      <p>Vui lòng thử tải lại trang.</p>
      <button className="button" onClick={reset}>
        Thử lại
      </button>
    </section>
  );
}
