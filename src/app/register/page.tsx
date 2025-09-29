"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RegisterResponse = {
  ok: boolean;
  message?: string;
  token?: string;
  user?: { id: string; name: string; email: string; role: string };
};

export default function RegisterPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data: RegisterResponse = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.message ?? "Error al crear la cuenta");
        return;
      }

      router.push("/login?message=Cuenta creada exitosamente");
    } catch {
      setErrorMsg("Error al crear la cuenta. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center gap-3 p-4 text-white bg-[#4854A1]">
        <Image src="/UMSS.png" alt="UMSS" width={36} height={36} />
      </header>

      {/* MAIN CENTRADO VERTICALMENTE */}
      <main className="flex-1 flex items-center justify-center py-4">
        <div className="w-full max-w-md rounded-2xl bg-[#A7B0FF] shadow-xl p-5">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-extrabold">
              <span className="text-[#3c468e]">Oh!</span>{" "}
              <span className="text-[#e34b5a]">Sansi!</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Crear nueva cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nombre Completo */}
            <label className="block">
              <span className="text-sm font-medium text-black">Nombre completo</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                placeholder="Ingrese su nombre completo"
                required
              />
            </label>

            {/* Email */}
            <label className="block">
              <span className="text-sm font-medium text-black">Correo electrónico</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 w-full rounded-lg text-black border border-black bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4854A1]"
                placeholder="nombre@correo.com"
                autoComplete="email"
                required
              />
            </label>

            {/* Contraseña CON BOTÓN MOSTRAR */}
            <label className="block">
              <span className="text-sm font-medium text-black">Contraseña</span>
              <div className="mt-1 flex items-center rounded-lg border border-black focus-within:ring-2 focus-within:ring-[#4854A1]">
                <input
                  type={showPwd ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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

            {}
            <label className="block">
              <span className="text-sm font-medium text-black">Confirmar contraseña</span>
              <div className="mt-1 flex items-center rounded-lg border border-black focus-within:ring-2 focus-within:ring-[#4854A1]">
                <input
                  type={showPwd ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
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

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4854A1] text-white py-2 font-semibold hover:bg-[#3a468a] transition disabled:opacity-60 text-sm"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <p className="text-center text-xs text-gray-600">
              ¿Ya tiene una cuenta?{" "}
              <Link href="/login" className="text-black font-semibold hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </main>

      {}
      <footer className="bg-[#4854A1] text-white py-3 mt-auto">
        <div className="mx-auto max-w-6xl px-4 md:px-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-sm">Contáctanos: ohsansi@sansi.com</p>
            <p className="font-semibold text-sm">Whatsapp: (+591)71530671</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-semibold text-sm">Avenida Oquendo Nro. 2147</p>
            <p className="font-semibold text-sm">Cochabamba - Bolivia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}