"use client";
import { AuthCareerMap } from "@/components/auth-career-map";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
const errorCopy = (message?: string) =>
  message?.toLowerCase().includes("already")
    ? "Email này đã có tài khoản."
    : message?.toLowerCase().includes("password") ||
        message?.toLowerCase().includes("credential")
      ? "Email hoặc mật khẩu chưa đúng."
      : message?.toLowerCase().includes("token")
        ? "Liên kết đã hết hạn hoặc không hợp lệ."
        : "Không thể thực hiện. Vui lòng kiểm tra thông tin và thử lại.";
export function AuthForm({
  mode,
  demoEnabled = false,
  localEmail = false,
}: {
  mode: "login" | "signup" | "forgot" | "reset";
  demoEnabled?: boolean;
  localEmail?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const params = useSearchParams();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let result;
      if (mode === "signup")
        result = await authClient.signUp.email({ email, password, name });
      else if (mode === "login")
        result = await authClient.signIn.email({ email, password });
      else if (mode === "forgot") {
        result = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin + "/reset-password",
        });
      } else
        result = await authClient.resetPassword({
          newPassword: password,
          token: params.get("token") || "",
        });
      if (result.error) {
        setError(errorCopy(result.error.message));
        return;
      }
      if (mode === "forgot")
        setNotice(
          localEmail
            ? "Yêu cầu đã được tiếp nhận. Chế độ trình diễn cục bộ không gửi email ra ngoài."
            : "Nếu email đã được đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu.",
        );
      else if (mode === "reset") {
        setNotice("Đã đổi mật khẩu. Bạn có thể đăng nhập lại.");
      } else window.location.assign("/dashboard");
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/demo-login", { method: "POST" });
      if (!r.ok) throw Error();
      window.location.assign("/dashboard");
    } catch {
      setError("Chưa thể mở tài khoản demo. Vui lòng thử lại.");
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-art">
        <Link href="/" className="brand">
          <BrandLogo />
        </Link>
        <div className="auth-intro">
          <span className="eyebrow">HÀNH TRÌNH CỦA RIÊNG BẠN</span>
          <h1>
            Hiểu kỹ năng.
            <br />
            Chọn đúng hướng.
          </h1>
          <p className="career-promise">
            <span>Từ những gì bạn đã có</span>{" "}
            <span>đến công việc bạn mơ ước.</span>
          </p>
          <AuthCareerMap />
        </div>
      </aside>
      <main className="auth-panel">
        <Link href="/" className="brand mobile-brand">
          <BrandLogo />
        </Link>
        <div className="auth-form">
          <span className="eyebrow">SKILLMAP</span>
          <h1>
            {mode === "login"
              ? "Chào mừng bạn trở lại"
              : mode === "signup"
                ? "Bắt đầu hành trình"
                : mode === "forgot"
                  ? "Quên mật khẩu?"
                  : "Tạo mật khẩu mới"}
          </h1>
          <p className="muted">
            {mode === "login"
              ? "Hiểu kỹ năng. Chọn đúng hướng."
              : mode === "signup"
                ? "Tạo tài khoản và khám phá hướng đi của bạn."
                : mode === "forgot"
                  ? "Nhập email đã dùng để đăng ký SkillMAP."
                  : "Chọn mật khẩu mới để bảo vệ tài khoản."}
          </p>
          <form onSubmit={submit} className="stack">
            {mode === "signup" && (
              <label>
                Tên của bạn
                <input
                  required
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
            )}
            {mode !== "reset" && (
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label>
                Mật khẩu
                <div className="password-field">
                  <input
                    type={visible ? "text" : "password"}
                    required
                    minLength={10}
                    maxLength={128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode !== "login" && <small>Tối thiểu 10 ký tự.</small>}
              </label>
            )}
            {mode === "login" && (
              <Link href="/forgot-password" className="text-link auth-forgot">
                Quên mật khẩu?
              </Link>
            )}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="success-text">
                {notice}
              </p>
            )}
            <button className="button" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  {mode === "login"
                    ? "Đăng nhập"
                    : mode === "signup"
                      ? "Đăng ký"
                      : mode === "forgot"
                        ? "Gửi liên kết khôi phục"
                        : "Lưu mật khẩu mới"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          {mode === "login" && demoEnabled && (
            <>
              <div className="auth-divider">
                <span>hoặc trải nghiệm ngay</span>
              </div>
              <button
                className="button secondary full"
                onClick={demo}
                disabled={busy}
              >
                <Sparkles size={18} />
                Dùng tài khoản demo
              </button>
              <p className="source centered">
                Hồ sơ Phương đã sẵn sàng. Thông tin cá nhân và độ phù hợp trong
                tài khoản này là dữ liệu demo.
              </p>
            </>
          )}
          {mode === "login" ? (
            <p className="auth-bottom">
              Chưa có tài khoản? <Link href="/signup">Đăng ký</Link>
            </p>
          ) : (
            <p className="auth-bottom">
              <Link href="/login">Quay lại đăng nhập</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
