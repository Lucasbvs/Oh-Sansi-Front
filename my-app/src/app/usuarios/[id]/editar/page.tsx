"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

/* ====== Ciudades (enum de Prisma) ====== */
type Ciudad =
  | "PANDO"
  | "LAPAZ"
  | "COCHABAMBA"
  | "BENI"
  | "SANTACRUZ"
  | "ORURO"
  | "POTOSI"
  | "CHUQUISACA"
  | "TARIJA";

const CIUDADES: { value: Ciudad; label: string }[] = [
  { value: "PANDO", label: "Pando" },
  { value: "LAPAZ", label: "La Paz" },
  { value: "COCHABAMBA", label: "Cochabamba" },
  { value: "BENI", label: "Beni" },
  { value: "SANTACRUZ", label: "Santa Cruz" },
  { value: "ORURO", label: "Oruro" },
  { value: "POTOSI", label: "Potosí" },
  { value: "CHUQUISACA", label: "Chuquisaca" },
  { value: "TARIJA", label: "Tarija" },
];

/* ====== Tipos ====== */
type RoleLite = { id: string; name: string; slug: string; isSystem: boolean };
type UserDto = {
  id: string;
  name: string;
  email: string;
  ciudad: Ciudad | null;
  ci: string | null;
  roleId: string;
  role: string; // slug
};

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState<Ciudad | "">(""); // <- ahora select
  const [ci, setCi] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");

  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setErrorMsg(null);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
        if (!token) {
          router.replace("/login?message=Inicia%20sesión");
          return;
        }

        // Cargar usuario y roles en paralelo
        const [userRes, rolesRes] = await Promise.all([
          fetch(`${API}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/api/roles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userRes.ok) throw new Error(`User HTTP ${userRes.status}`);
        if (!rolesRes.ok) throw new Error(`Roles HTTP ${rolesRes.status}`);

        const udata = (await userRes.json()) as { ok: boolean; user: UserDto };
        const rdata = (await rolesRes.json()) as { ok: boolean; roles: RoleLite[] };

        const u = udata.user;
        setName(u.name);
        setEmail(u.email);
        setCiudad((u.ciudad as Ciudad) ?? ""); // si viniera null
        setCi(u.ci ?? "");
        setRoleId(u.roleId);
        setRoles(rdata.roles);
      } catch (e) {
        console.error(e);
        setErrorMsg("No se pudo cargar el usuario/roles");
      } finally {
        setLoading(false);
      }
    })();
  }, [API, id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setSaving(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("ohsansi_token") : null;
      if (!token) {
        setErrorMsg("Sesión inválida");
        return;
      }

      const body: any = {
        name: name.trim(),
        email: email.trim(),
        // IMPORTANTE: enviar el valor del enum (p.ej. "COCHABAMBA")
        ciudad: ciudad || null,
        ci: ci || null,
        roleId: roleId || undefined,
      };
      if (password.trim().length >= 6) {
        body.password = password.trim();
      }

      const res = await fetch(`${API}/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      router.push("/usuarios");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      <main className="bg-white flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-bold mb-4 text-black">Editar usuario</h1>

        {loading ? (
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-gray-200 rounded-2xl p-6 shadow">
            {/* Nombre */}
            <label className="block">
              <span className="text-sm font-medium text-black">Nombre</span>
              <input
                className="mt-1 w-full text-black rounded-lg border px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            {/* Correo */}
            <label className="block">
              <span className="text-sm font-medium text-black">Correo</span>
              <input
                type="email"
                className="mt-1 w-full text-black rounded-lg border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {/* Ciudad + CI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-black">Ciudad</span>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value as Ciudad | "")}
                  required
                >
                  <option value="" disabled>
                    Seleccione…
                  </option>
                  {CIUDADES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-black">CI</span>
                <input
                  className="mt-1 w-full text-black rounded-lg border px-3 py-2"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="12345678"
                />
              </label>
            </div>

            {/* Rol */}
            <label className="block">
              <span className="text-sm font-medium text-black">Rol</span>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Password opcional */}
            <label className="block">
              <span className="text-sm font-medium text-black">Nueva contraseña (opcional)</span>
              <input
                type="password"
                className="mt-1 w-full text-black rounded-lg border px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacío para no cambiar"
              />
            </label>

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                {errorMsg}
              </p>
            )}

            <div className="flex justify-end gap-2 text-black">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-xl border">
                Cancelar
              </button>
              <button disabled={saving} className="px-4 py-2 rounded-xl bg-[#4854A1] text-white hover:bg-[#3a468a]">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
