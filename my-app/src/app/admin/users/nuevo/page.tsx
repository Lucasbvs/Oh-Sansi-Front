"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";

type RoleOption = { id: string; name: string };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function CreateUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [ci, setCi] = useState("");
  const [password, setPassword] = useState("");

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [roleId, setRoleId] = useState<string>("");

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function getToken() {
    return typeof window !== "undefined"
      ? localStorage.getItem("ohsansi_token")
      : null;
  }

  // Traer roles (solo los seleccionables desde el back)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const token = getToken();
        const res = await fetch(`${API}/api/roles?onlySelectable=1`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);

        const list: RoleOption[] = (json.roles || []).map((r: any) => ({
          id: r.id,
          name: r.name,
        }));

        setRoles(list);
      } catch (e: any) {
        setMsg(e.message || "No se pudieron cargar los roles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtra para mostrar solo Estudiante y Tutor si existen;
  // si no existen, usa todos.
  const roleOptions = useMemo(() => {
    const preferred = roles.filter((r) =>
      ["ESTUDIANTE", "TUTOR"].includes(r.name.toUpperCase())
    );
    return preferred.length > 0 ? preferred : roles;
  }, [roles]);

  useEffect(() => {
    if (roleOptions.length && !roleId) {
      setRoleId(roleOptions[0].id);
    }
  }, [roleOptions, roleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (password.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (!roleId) {
      setMsg("Seleccione un rol válido");
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const res = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          password,
          ciudad,
          ci: ci || null,
          roleId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setMsg("Usuario creado correctamente");
      // limpiar
      setName("");
      setEmail("");
      setCiudad("");
      setCi("");
      setPassword("");
      if (roleOptions.length) setRoleId(roleOptions[0].id);
    } catch (err: any) {
      setMsg(err.message || "Error al crear el usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-6">
        {/* Card centrada al estilo del registro público */}
        <div className="w-full max-w-md rounded-2xl bg-gray-300 shadow-xl p-5">
          {/* sin el título “Oh! Sansi!” ni el texto de login */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-extrabold text-[#3c468e]">
              Crear usuario
            </h1>
            <p className="text-sm text-gray-700 mt-1">
              Complete los datos para crear la cuenta
            </p>
          </div>

          {loading ? (
            <div className="h-24 rounded-xl bg-gray-200 animate-pulse" />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {msg && (
                <p
                  className={`text-sm rounded-lg p-2 border ${
                    /error|http|no se pudo|no se pudieron|inválid/i.test(
                      msg ?? ""
                    )
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}
                >
                  {msg}
                </p>
              )}

              <label className="block">
                <span className="text-sm font-medium text-black">
                  Nombre completo
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                  placeholder="Ingrese su nombre completo"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-black">
                  Correo electrónico
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  required
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-black">Ciudad</span>
                  <select
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                    required
                  >
                    <option value="">Seleccione una ciudad</option>
                    <option value="PANDO">Pando</option>
                    <option value="LAPAZ">La Paz</option>
                    <option value="COCHABAMBA">Cochabamba</option>
                    <option value="BENI">Beni</option>
                    <option value="SANTACRUZ">Santa Cruz</option>
                    <option value="ORURO">Oruro</option>
                    <option value="POTOSI">Potosí</option>
                    <option value="CHUQUISACA">Chuquisaca</option>
                    <option value="TARIJA">Tarija</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-black">
                    Carnet de identidad
                  </span>
                  <input
                    type="text"
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                    placeholder="12345678"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-black">Rol</span>
                <select
                  className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
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

              <label className="block">
                <span className="text-sm font-medium text-black">
                  Contraseña
                </span>
                <div className="mt-1 flex items-center rounded-lg border border-black focus-within:ring-2 focus-within:ring-[#4854A1]">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg bg-white text-black px-3 py-2 text-sm outline-none"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    minLength={6}
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

              <div className="pt-1 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-[#4854A1] text-white py-2 font-semibold hover:bg-[#3a468a] transition disabled:opacity-60 text-sm"
                >
                  {saving ? "Creando..." : "Crear usuario"}
                </button>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/usuarios"
                  className="text-xs underline text-gray-700 hover:text-black"
                >
                  Cancelar y volver
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
