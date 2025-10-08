"use client";

import { useEffect, useState } from "react";

type MeUser = { id: string; name: string; email: string; role: string };
type MeResponse = { ok: boolean; user?: MeUser };

function useAuthUserHook() {
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("ohsansi_token")
            : null;

        if (!token) {
          if (alive) setUser(null);
          return;
        }

        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data: MeResponse = await res.json();

        if (res.ok && data?.ok && data.user) {
          if (alive) setUser(data.user);
        } else {
          if (alive) setUser(null);
        }
      } catch {
        if (alive) setError("No se pudo obtener el usuario");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [API]);

  return { user, loading, error };
}

export default useAuthUserHook;      // ✅ default export
export const useAuthUser = useAuthUserHook; // ✅ named export (por si algún import usa llaves)
