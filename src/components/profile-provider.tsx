"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Profile } from "@/lib/types";
import { profileDefaults } from "@/lib/profile-data";
const Context = createContext<{
  profile: Profile;
  ready: boolean;
  user: { id: string; email: string };
  saving: boolean;
  update: (p: Partial<Profile>) => void;
  refresh: () => Promise<void>;
}>({
  profile: profileDefaults,
  ready: false,
  user: { id: "", email: "" },
  saving: false,
  update: () => {},
  refresh: async () => {},
});
export function ProfileProvider({
  children,
  initialProfile,
  user,
}: {
  children: ReactNode;
  initialProfile: Profile;
  user: { id: string; email: string };
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [warning, setWarning] = useState("");
  const [saving, setSaving] = useState(false);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const failed = useRef<Partial<Profile>>({});
  async function refresh() {
    const r = await fetch("/api/profile", { cache: "no-store" });
    if (r.status === 401) {
      window.location.assign("/login");
      return;
    }
    if (!r.ok) throw Error("Không tải được hồ sơ.");
    setProfile(await r.json());
  }
  function update(patch: Partial<Profile>) {
    setProfile((p) => ({ ...p, ...patch }));
    setSaving(true);
    pending.current++;
    queue.current = queue.current.then(async () => {
      const send = { ...failed.current, ...patch };
      try {
        const r = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(send),
        });
        if (r.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (!r.ok) throw Error();
        failed.current = {};
        setWarning("");
      } catch {
        failed.current = send;
        setWarning("Chưa lưu được thay đổi. Vui lòng thử lại.");
      } finally {
        pending.current--;
        setSaving(pending.current > 0);
      }
    });
  }
  return (
    <Context.Provider
      value={{ profile, ready: true, user, saving, update, refresh }}
    >
      {warning && (
        <div role="alert" className="storage-warning">
          {warning} <button onClick={() => update({})}>Thử lưu lại</button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export const useProfile = () => useContext(Context);
