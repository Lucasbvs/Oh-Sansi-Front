// app/admin/users/nuevo/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

type CreateResponse = {
  ok: boolean;
  message?: string;
  user?: { id: string; name: string; email: string; role: string };
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Roles permitidos a crear por el ADMIN (no incluimos ADMIN / SUPERADMIN aquí)
const ROLES_UI = [
  { value: "RESPONSABLEACADEMICO", label: "Responsable Académico" },
  { value: "EVALUADOR", label: "Evaluador" },
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "TUTOR", label: "Tutor" },
];

export default function AdminCreateUserPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    ciudad: "",
    ci: "",
    role: "ESTUDIANTE", // por defecto
    password: "",
    confirmPassword: "",
  });

  // Verifica que el usuario logueado sea ADMIN antes de mostrar el formulario
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
        if (!token) {
          router.replace("/login?message=Inicia%20sesión");
          return;
        }

        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/login?message=Sesión%20inválida");
          return;
        }

        const me = await res.json();
        const role = (me?.user?.role ?? "").toUpperCase();
        if (role !== "ADMIN") {
          router.replace("/?error=No%20autorizado");
          return;
        }

        setAuthChecked(true);
      } catch {
        router.replace("/login?message=Error%20de%20sesión");
      }
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("ohsansi_token");
      if (!token) {
        setErrorMsg("Sesión inválida");
        return;
      }

      const res = await fetch(`${API}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          ciudad: formData.ciudad || null,
          ci: formData.ci || null,
          role: formData.role, // debe coincidir con enum Role del backend
        }),
      });

      const data: CreateResponse = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.message ?? "Error al crear el usuario");
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
            <p className="text-sm text-gray-600 mt-1">Crear usuario (solo ADMIN)</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-black">Rol</span>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                >
                  {ROLES_UI.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>

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
                    onClick={() => setShowPwd(v => !v)}
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
              onClick={handleSubmit}
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
