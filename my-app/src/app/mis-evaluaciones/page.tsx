"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { FaClipboardList, FaUsers, FaChartLine } from "react-icons/fa";

type Competencia = {
  id: string;
  nombre: string;
  nivel: string;
  area: string;
  modalidad: string;
  estado: boolean;
  fechaAsignacion: string;
  totalInscritos: number;
  etapas: { etapa: string; fechaInicio: string; fechaFin: string | null }[];
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function MisEvaluacionesPage() {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetencias = async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch(`${API}/api/evaluaciones/mis-competencias`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        setCompetencias(data.competencias || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar competencias");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetencias();
  }, []);

  const calcularEtapaActual = (etapas: any[]) => {
    const ahora = new Date();
    for (const etapa of etapas) {
      const inicio = new Date(etapa.fechaInicio);
      const fin = etapa.fechaFin ? new Date(etapa.fechaFin) : null;
      
      if (inicio <= ahora && (!fin || fin >= ahora)) {
        return etapa.etapa;
      }
    }
    return "FINALIZADA";
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
            <FaClipboardList className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
            <p className="text-gray-500">Competencias que estás evaluando</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : competencias.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <FaChartLine className="text-yellow-600 text-5xl mx-auto mb-4" />
            <p className="text-yellow-800 font-medium mb-2">No tienes competencias asignadas</p>
            <p className="text-yellow-700 text-sm mb-4">
              Ve a la sección de competencias y asígnate como evaluador para comenzar.
            </p>
            <Link 
              href="/home"
              className="inline-block px-4 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a]"
            >
              Ver Competencias
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competencias.map((comp) => (
              <Link
                key={comp.id}
                href={`/competencias/${comp.id}`}
                className="border rounded-2xl p-5 hover:shadow-lg transition-shadow bg-white"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{comp.nombre}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    comp.estado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {comp.estado ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Nivel:</span> {comp.nivel}</p>
                  <p><span className="font-medium">Área:</span> {comp.area}</p>
                  <p><span className="font-medium">Modalidad:</span> {comp.modalidad}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <FaUsers />
                  <span>{comp.totalInscritos} estudiante(s) inscrito(s)</span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="font-medium text-indigo-700">
                      {calcularEtapaActual(comp.etapas)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Asignado el {new Date(comp.fechaAsignacion).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-4">
                  <span className="inline-block w-full text-center px-4 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a] transition">
                    Ver Estudiantes
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}