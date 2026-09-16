import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSession } from "@/server/session";
import { ArrowRight, Network, Compass, BookOpen } from "lucide-react";
export default async function Welcome() {
  if (await currentSession()) redirect("/dashboard");
  return (
    <div className="welcome">
      <header className="welcome-header">
        <Link className="brand" href="/">
          <BrandLogo />
        </Link>
        <Link href="/login" className="button secondary">
          Đăng nhập <ArrowRight size={16} />
        </Link>
      </header>
      <main>
        <section className="welcome-hero">
          <div>
            <span className="eyebrow">BẢN ĐỒ NGHỀ NGHIỆP CỦA BẠN</span>
            <h1>
              Hiểu kỹ năng.
              <br />
              <em>Chọn đúng hướng.</em>
            </h1>
            <p>
              Nhìn rõ thế mạnh, tìm nghề phù hợp và biến khoảng cách kỹ năng
              thành bước đi tiếp theo.
            </p>
            <div className="action-row">
              <Link className="button" href="/signup">
                Bắt đầu miễn phí <ArrowRight size={18} />
              </Link>
              <Link className="text-link" href="/login">
                Khám phá bản demo →
              </Link>
            </div>
          </div>
          <div className="welcome-visual">
            <img
              src="/images/badge.png"
              alt="Mạng lưới nghề nghiệp và kỹ năng"
            />
            <span className="welcome-chip">
              Kỹ năng hôm nay · Cơ hội ngày mai
            </span>
          </div>
        </section>
        <section className="welcome-features">
          {[
            [
              Compass,
              "Hiểu vị trí của bạn",
              "Tập hợp kỹ năng, kinh nghiệm và mục tiêu trong một hồ sơ riêng.",
            ],
            [
              Network,
              "Khám phá nghề phù hợp",
              "Đối chiếu hồ sơ với nghề nghiệp và dữ liệu tuyển dụng.",
            ],
            [
              BookOpen,
              "Biết nên học gì tiếp theo",
              "Lưu kỹ năng và xây dựng lộ trình học theo mục tiêu.",
            ],
          ].map(([Icon, title, copy], i) => {
            const I = Icon as typeof Compass;
            return (
              <article className="card" key={i}>
                <I />
                <h2>{title as string}</h2>
                <p>{copy as string}</p>
              </article>
            );
          })}
        </section>
      </main>
      <footer>SkillMAP · Hiểu mình hơn, đi xa hơn.</footer>
    </div>
  );
}
