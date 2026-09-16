import Link from "next/link";
export default function NotFound() {
  return (
    <div className="state">
      <h1>Không tìm thấy trang</h1>
      <Link className="button" href="/">
        Về Trang chủ
      </Link>
    </div>
  );
}
