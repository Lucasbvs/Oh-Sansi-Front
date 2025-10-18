// app/admin/users/nuevo/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import useAuthUser from "@/hooks/useAuthUser";

type CreateResponse = {
  ok: boolean;
  message?: string;
  user?: { id: string; name: string; email: string; role: string };
};

type RoleItem = { id: string; name: string; slug: string; isSystem: boolean };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function AdminCreateUserPage() {
  const router = useRouter();
  const { user: me, loading: loadingMe } = useAuthUser();

  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    ciudad: "",
    ci: "",
    roleId: "",
    password: "",
    confirmPassword: "",
  });

  // Gate por permiso users.create
  useEffect(() => {
    if (loadingMe) return;

    const perms = (me as any)?.roleInfo?.permissions ?? {};
    const canCreate = !!perms?.users?.create;

    if (!canCreate) {
      router.replace("/?error=No%20autorizado");
      return;
    }
    setAuthChecked(true);
  }, [me, loadingMe, router]);

  // Cargar roles para el select
  useEffect(() => {
    if (!authChecked) return;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
        const res = await fetch(`${API}/api/roles`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: RoleItem[] = data?.roles ?? [];
        setRoles(list);
        if (list.length && !formData.roleId) {
          setFormData((f) => ({ ...f, roleId: list[0].id }));
        }
      } catch (e) {
        console.error(e);
        setErrorMsg("No se pudieron cargar los roles");
      }
    })();
  }, [authChecked]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!formData.roleId) {
      setErrorMsg("Seleccione un rol");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("ohsansi_token");
      if (!token) {
        setErrorMsg("Sesión inválida");
        return;
      }

      // POST a /api/users (nuevo)
      const res = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          ciudad: formData.ciudad || null, // se normaliza en el backend
          ci: formData.ci || null,
          roleId: formData.roleId,
        }),
      });

      const data: CreateResponse = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.message ?? `Error al crear el usuario (HTTP ${res.status})`);
        return;
      }

      router.push("/usuarios?message=Usuario%20creado");
    } catch {
      setErrorMsg("Error al crear el usuario. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-600">Verificando permisos…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-md rounded-2xl bg-gray-300 shadow-xl p-5">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-extrabold">
              <span className="text-[#3c468e]">Oh!</span>{" "}
              <span className="text-[#e34b5a]">Sansi!</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Crear usuario</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-black">Nombre completo</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                placeholder="Ingrese su nombre completo"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-black">Correo electrónico</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                placeholder="nombre@correo.com"
                autoComplete="email"
                required
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-black">Ciudad</span>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                  placeholder="Cochabamba"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-black">Carnet de identidad</span>
                <input
                  type="text"
                  value={formData.ci}
                  onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                  className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                  placeholder="12345678"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-black">Rol</span>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isSystem ? "(sistema)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-black">Contraseña</span>
                <div className="mt-1 flex items-center rounded-lg border border-black focus-within:ring-2 focus-within:ring-[#4854A1]">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg bg-white text-black px-3 py-2 text-sm outline-none"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="px-3 py-2 rounded-lg text-xs text-white bg-[#4854A1] transition"
                  >
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </label>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4854A1] text-white py-2 font-semibold hover:bg-[#3a468a] transition disabled:opacity-60 text-sm"
            >
              {loading ? "Creando usuario..." : "Crear usuario"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
