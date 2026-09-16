"use client";
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Search, Network, Sparkles, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useProfile } from "./profile-provider";
import { Mapi } from "./mapi/mascot";
import { Sheet } from "./ui";
import { authClient } from "@/lib/auth-client";
const tabs = [
  { href: "/dashboard", name: "Trang chủ", icon: Home },
  { href: "/explore", name: "Khám phá", icon: Search },
  { href: "/map", name: "Bản đồ", icon: Network },
  { href: "/ai", name: "AI", icon: Sparkles },
  { href: "/profile", name: "Hồ sơ", icon: User },
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { profile, saving } = useProfile();
  const [notice, setNotice] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="brand">
            <BrandLogo />
          </Link>
          <div className="header-actions">
            {profile.demo && (
              <span className="badge demo-badge">Tài khoản demo</span>
            )}
            {saving && <span className="save-status">Đang lưu…</span>}
            <button
              className="icon-button"
              aria-label="Thông báo"
              onClick={() => setNotice(true)}
            >
              <Bell size={20} />
            </button>
            <Link className="avatar" href="/profile" aria-label="Mở hồ sơ">
              {profile.name ? (
                profile.name[0].toUpperCase()
              ) : (
                <User size={18} />
              )}
            </Link>
          </div>
        </div>
      </header>
      <aside className="desktop-nav">
        <span className="eyebrow">KHÔNG GIAN CỦA BẠN</span>
        {tabs.map(({ href, name, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={path.startsWith(href) ? "selected" : ""}
          >
            {href === "/ai" ? (
              <Mapi size={24} decorative />
            ) : (
              <Icon size={20} />
            )}
            {name}
          </Link>
        ))}
        <button
          onClick={async () => {
            const result = await authClient.signOut();
            if (result.error) {
              setNotice(true);
              return;
            }
            window.location.assign("/login");
          }}
        >
          Đăng xuất
        </button>
      </aside>
      <main id="main" className="main">
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {tabs.map(({ href, name, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? path === "/dashboard"
              : path.startsWith(href);
          return (
            <Link
              href={href}
              key={href}
              aria-current={active ? "page" : undefined}
              className={active ? "nav-item active" : "nav-item"}
            >
              <span className="nav-icon">
                {href === "/ai" ? (
                  <Mapi size={24} decorative />
                ) : (
                  <Icon size={20} />
                )}
              </span>
              <span>{name}</span>
            </Link>
          );
        })}
      </nav>
      {notice && (
        <Sheet title="Thông báo" onClose={() => setNotice(false)}>
          <div className="state">
            <Bell />
            <h3>Bạn đã cập nhật mọi thứ</h3>
            <p>
              Chưa có thông báo mới. Kế hoạch học của bạn được lưu trong tài
              khoản của bạn.
            </p>
            <Link
              href="/map"
              className="button"
              onClick={() => setNotice(false)}
            >
              Xem lộ trình
            </Link>
          </div>
        </Sheet>
      )}
    </>
  );
}
