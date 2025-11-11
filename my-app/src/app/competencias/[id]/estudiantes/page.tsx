"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import { FaUserGraduate, FaCheckCircle, FaTimesCircle, FaChalkboardTeacher } from "react-icons/fa";

type Estudiante = {
  id: string;
  nombre: string;
  email: string;
  documentoIdentidad: string | null;
  ciudad: string;
  tutor: { id: string; name: string; email: string } | null;
  fechaInscripcion: string;
  evaluacion: {
    calificacion: number;
    detalles: string | null;
    fechaEvaluacion: string;
  } | null;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function EstudiantesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstudiantes = async () => {
      try {
        const token = localStorage.getItem("ohsansi_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${API}/api/evaluaciones/estudiantes/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 403) {
            setError("No tienes permiso para ver estos estudiantes");
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setEstudiantes(data.estudiantes || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al cargar estudiantes");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEstudiantes();
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
              <FaUserGraduate className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Estudiantes Inscritos</h1>
              <p className="text-gray-500">Lista de estudiantes para evaluar</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Volver
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#4854A1] text-white rounded-lg hover:bg-[#3a468a]"
            >
              Volver
            </button>
          </div>
        ) : estudiantes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <FaUserGraduate className="text-yellow-600 text-5xl mx-auto mb-4" />
            <p className="text-yellow-800 font-medium">No hay estudiantes inscritos en esta competencia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {estudiantes.map((est) => (
              <div
                key={est.id}
                className="border rounded-2xl p-5 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <FaUserGraduate className="text-indigo-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{est.nombre}</h3>
                        <p className="text-sm text-gray-600">{est.email}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">CI:</span>{" "}
                        <span className="font-medium">{est.documentoIdentidad || "No registrado"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ciudad:</span>{" "}
                        <span className="font-medium">{est.ciudad}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fecha inscripción:</span>{" "}
                        <span className="font-medium">
                          {new Date(est.fechaInscripcion).toLocaleDateString()}
                        </span>
                      </div>
                      {est.tutor && (
                        <div className="flex items-center gap-2">
                          <FaChalkboardTeacher className="text-green-600" />
                          <span className="text-gray-600">Tutor:</span>{" "}
                          <span className="font-medium">{est.tutor.name}</span>
                        </div>
                      )}
                    </div>

                    {est.evaluacion && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FaCheckCircle className="text-green-600" />
                          <span className="font-semibold text-green-800">Evaluado</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <p>
                            <span className="font-medium">Calificación:</span>{" "}
                            {est.evaluacion.calificacion}/100
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(est.evaluacion.fechaEvaluacion).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {!est.evaluacion && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FaTimesCircle className="text-yellow-600" />
                          <span className="font-semibold text-yellow-800">Pendiente de evaluación</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/competencias/${id}/estudiantes/${est.id}/evaluar`)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      est.evaluacion
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-[#4854A1] text-white hover:bg-[#3a468a]"
                    }`}
                  >
                    {est.evaluacion ? "Editar Evaluación" : "Evaluar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}