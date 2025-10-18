"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LoginResponse = {
  ok: boolean;
  message?: string;
  token?: string;
  user?: { id: string; name: string; email: string; role: string };
};

export default function LoginPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: LoginResponse = await res.json();

      if (!res.ok || !data.ok || !data.token) {
        setErrorMsg(data.message ?? `Credenciales inválidas (HTTP ${res.status}).`);
        return;
      }

      localStorage.setItem("ohsansi_token", data.token);
      if (data.user) localStorage.setItem("ohsansi_user", JSON.stringify(data.user));
      router.push("/home");
    } catch {
      setErrorMsg("Error al iniciar sesión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center gap-3 p-4 text-white bg-[#4854A1]">
        <Image src="/UMSS.png" alt="UMSS" width={36} height={36} />
      </header>

      <main className="flex-1 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-gray-200 shadow-xl backdrop-blur p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold">
              <span className="text-[#3c468e]">Oh!</span>{" "}
              <span className="text-[#e34b5a]">Sansi!</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Bienvenido, ingrese a su cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-black">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl text-black border border-black bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#4854A1]"
                placeholder="nombre@correo.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-black">Contraseña</span>
              <div className="mt-1 flex items-center rounded-xl border border-black focus-within:ring-2 focus-within:ring-[#4854A1]">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-white text-black px-3 py-2 outline-none"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="px-4 py-3 rounded-xl text-sm text-white hover:text-white bg-[#4854A1] transition disabled:opacity-60"
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
              className="w-full rounded-xl bg-[#4854A1] text-white py-2.5 font-semibold hover:bg-[#3a468a] transition disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            
            <p className="text-center text-sm text-gray-600">
              ¿No tiene una cuenta?{" "}
              <Link href="/register" className="text-black font-semibold hover:underline">
                Regístrese
              </Link>
            </p>
          </form>
        </div>
      </main>

      <footer className="bg-[#4854A1] text-white py-4 mt-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
          <div className="text-center sm:text-left">
            <p className="font-semibold">Contáctanos: ohsansi@sansi.com</p>
            <p className="font-semibold">Whatsapp: (+591)71530671</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-semibold">Avenida Oquendo Nro. 2147</p>
            <p className="font-semibold">Cochabamba - Bolivia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
