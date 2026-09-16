"use client";
import { BrandLogo } from "@/components/brand-logo";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Signal,
  Wifi,
  BatteryFull,
  Maximize,
  ArrowUpRight,
} from "lucide-react";
import { Mapi } from "./mapi/mascot";
export default function PhonePresentation({
  signedIn,
  demoEnabled,
}: {
  signedIn: boolean;
  demoEnabled: boolean;
}) {
  const [ready, setReady] = useState(signedIn);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [screen, setScreen] = useState("/dashboard");
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function resize() {
      setScale(
        Math.min(
          1,
          (window.innerHeight - 90) / 880,
          (window.innerWidth - 28) / 414,
        ),
      );
    }
    resize();
    window.addEventListener("resize", resize);
    const screen = new URLSearchParams(window.location.search).get("screen");
    if (
      screen &&
      ["/dashboard", "/profile", "/map", "/ai", "/explore"].includes(screen)
    )
      setScreen(screen);
    return () => window.removeEventListener("resize", resize);
  }, []);
  useEffect(() => {
    if (signedIn) return;
    let live = true;
    setError("");
    if (!demoEnabled) {
      setError(
        "Tài khoản demo chưa được bật. Bạn có thể đăng nhập để tiếp tục.",
      );
      return;
    }
    fetch("/api/demo-login", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw Error();
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setError("Chưa mở được tài khoản demo. Vui lòng thử lại.");
      });
    return () => {
      live = false;
    };
  }, [signedIn, demoEnabled, attempt]);
  return (
    <div className="presentation-stage" ref={stage}>
      <header className="presentation-toolbar">
        <Link href="/dashboard" className="brand">
          <BrandLogo />
        </Link>
        <div>
          <Link href="/dashboard">
            Mở bản trình duyệt
            <ArrowUpRight size={13} />
          </Link>
          <button
            aria-label="Toàn màn hình"
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await stage.current?.requestFullscreen();
              } catch {
                setError("Trình duyệt chưa hỗ trợ toàn màn hình.");
              }
            }}
          >
            <Maximize size={17} />
          </button>
        </div>
      </header>
      <div
        className="phone-footprint"
        style={{ width: 414 * scale, height: 880 * scale }}
      >
        <div className="phone-device" style={{ transform: `scale(${scale})` }}>
          <i className="phone-side-button side-one" />
          <i className="phone-side-button side-two" />
          <i className="phone-side-button side-three" />
          <div className="phone-screen">
            <div className="phone-status" aria-hidden="true">
              <time>09:41</time>
              <span className="phone-island" />
              <span className="phone-status-icons">
                <Signal size={16} fill="currentColor" />
                <Wifi size={16} />
                <BatteryFull size={23} />
              </span>
            </div>
            {ready ? (
              <iframe
                name="skillmap-phone"
                title="Ứng dụng SkillMAP trong màn hình điện thoại"
                className="phone-app"
                src={screen}
                onLoad={(e) => {
                  try {
                    e.currentTarget.contentDocument?.documentElement.classList.add(
                      "inside-phone",
                    );
                  } catch {}
                }}
              />
            ) : (
              <div className="phone-boot">
                <Mapi state={error ? "attention" : "thinking"} size={90} />
                <h1>{error ? "Chưa thể mở SkillMAP" : "Chào Phương"}</h1>
                <p>{error || "Đang mở bản đồ nghề nghiệp của bạn…"}</p>
                {error && (
                  <>
                    <button
                      className="button"
                      onClick={() => setAttempt((n) => n + 1)}
                    >
                      Thử lại
                    </button>
                    <Link href="/login">Đăng nhập</Link>
                  </>
                )}
              </div>
            )}
            <div className="phone-home-area" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </div>
      {ready && error && (
        <p role="status" className="presentation-message">
          {error}
        </p>
      )}
    </div>
  );
}
