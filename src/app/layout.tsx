import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SkillMAP — Hiểu kỹ năng. Chọn đúng hướng.",
  description:
    "Khám phá nghề nghiệp và kỹ năng từ dữ liệu tuyển dụng Việt Nam.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
