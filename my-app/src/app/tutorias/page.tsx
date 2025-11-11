"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import useAuthUser from "@/hooks/useAuthUser";
import { 
  FaUserGraduate, 
  FaUserPlus, 
  FaUsers, 
  FaMapMarkerAlt, 
  FaIdCard, 
  FaTrophy,
  FaChalkboardTeacher
} from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Tutor = {
  id: string;
  nombre: string;
  email: string;
  ciudad: string;
  _count: {
    estudiantesTutorados: number;
  };
};

type MiTutor = {
  id: string;
  nombre: string;
  email: string;
  ciudad: string;
} | null;

type Asignacion = {
  estudiante: {
    id: string;
    nombre: string;
    email: string;
    ciudad: string;
    ci: string;
  };
  tutor: {
    id: string;
    nombre: string;
    email: string;
  } | null;
  competencias: Array<{
    id: string;
    nombre: string;
    area: string;
  }>;
  sinTutor: boolean;
};

type EstudianteTutor = {
  id: string;
  nombre: string;
  email: string;
  ciudad: string;
  ci: string;
  fechaRegistro: string;
  competencias: Array<{
    id: string;
    nombre: string;
    area: string;
    nivel: string;
  }>;
};

export default function TutoriasPage() {
  const { user, loading: userLoading } = useAuthUser();
  
  // Estados para estudiantes
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [miTutor, setMiTutor] = useState<MiTutor>(null);
  
  // Estados para tutores
  const [misEstudiantes, setMisEstudiantes] = useState<EstudianteTutor[]>([]);
  
  // Estados para administración/lectura
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<string | null>(null);

  // Determinar tipo de vista basado en rol
  const tipoVista = user?.role === "ESTUDIANTE" ? "estudiante" : 
                   user?.role === "TUTOR" ? "tutor" : 
                   user?.role === "ADMIN" ? "admin" : "lectura";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem("ohsansi_token");
        
        switch (tipoVista) {
          case "estudiante":
            // Cargar datos para estudiante
            const [tutoresRes, tutorRes] = await Promise.all([
              fetch(`${API}/api/tutores`, { headers: { Authorization: `Bearer ${token}` } }),
              fetch(`${API}/api/tutores/mi-tutor`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            const tutoresData = await tutoresRes.json();
            const tutorData = await tutorRes.json();
            
            if (tutoresData.ok) setTutores(tutoresData.tutores);
            if (tutorData.ok) setMiTutor(tutorData.tutor);
            break;

          case "tutor":
            // Cargar estudiantes del tutor
            const estudiantesRes = await fetch(`${API}/api/tutores/mis-estudiantes`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (estudiantesRes.ok) {
              const data = await estudiantesRes.json();
              setMisEstudiantes(data.estudiantes || []);
            }
            break;

          case "admin":
          case "lectura":
            // Cargar asignaciones completas
            const asignacionesRes = await fetch(`${API}/api/tutores/asignaciones-lectura`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (asignacionesRes.ok) {
              const data = await asignacionesRes.json();
              setAsignaciones(data.asignaciones || []);
            }
            break;
        }
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, tipoVista]);

  // Handlers para estudiantes
  const handleAsignarTutor = async (tutorId: string) => {
    setAsignando(tutorId);
    try {
      const token = localStorage.getItem("ohsansi_token");
      const res = await fetch(`${API}/api/tutores/${tutorId}/asignar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.ok) window.location.reload();
    } catch (err: any) {
      console.error("Error asignando tutor:", err.message);
    } finally {
      setAsignando(null);
    }
  };

  const handleDesasignarTutor = async () => {
    try {
      const token = localStorage.getItem("ohsansi_token");
      const res = await fetch(`${API}/api/tutores/desasignar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) window.location.reload();
    } catch (err) {
      console.error("Error desasignando tutor");
    }
  };

  // Renderizar contenido según el tipo de vista
  const renderContenido = () => {
    if (loading) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#4854A1] flex items-center justify-center">
              <FaUserGraduate className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tutorías</h1>
              <p className="text-gray-500">Cargando información...</p>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    switch (tipoVista) {
      case "estudiante":
        return renderVistaEstudiante();
      case "tutor":
        return renderVistaTutor();
      case "admin":
      case "lectura":
        return renderVistaLectura();
      default:
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Acceso no autorizado</h2>
              <p className="text-gray-600">No tienes permisos para ver las tutorías.</p>
            </div>
          </div>
        );
    }
  };

  // Vista para Estudiantes
  const renderVistaEstudiante = () => (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#4854A1] flex items-center justify-center">
          <FaUserGraduate className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-black">Mis Tutorías</h1>
          <p className="text-black">Gestiona tu asignación de tutor</p>
        </div>
      </div>

      {/* Información del tutor actual */}
      {miTutor && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FaUserPlus className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Tutor asignado</h3>
                <p className="text-green-700">
                  <strong>{miTutor.nombre}</strong> - {miTutor.email}
                </p>
                <p className="text-green-600 text-sm flex items-center gap-1 mt-1">
                  <FaMapMarkerAlt /> {miTutor.ciudad}
                </p>
              </div>
            </div>
            <button
              onClick={handleDesasignarTutor}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Desasignar Tutor
            </button>
          </div>
        </div>
      )}

      {/* Lista de tutores disponibles */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Tutores Disponibles</h2>
        
        {tutores.length === 0 ? (
          <div className="text-center py-8">
            <FaUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No hay tutores disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutores.map((tutor) => (
              <div key={tutor.id} className="border rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4 text-black">
                  <div className="w-12 h-12 rounded-full bg-[#4854A1] opacity-90 flex items-center justify-center">
                    <FaUserPlus className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{tutor.nombre}</h3>
                    <p className="text-black text-sm">Tutor</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-black">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {tutor.email}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaMapMarkerAlt />
                    <span>{tutor.ciudad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUsers />
                    <span>{tutor._count.estudiantesTutorados} estudiante(s)</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAsignarTutor(tutor.id)}
                  disabled={miTutor?.id === tutor.id || asignando === tutor.id}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    miTutor?.id === tutor.id
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : asignando === tutor.id
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-[#4854A1] text-white hover:bg-[#3a468a]"
                  }`}
                >
                  {asignando === tutor.id ? "Asignando..." : miTutor?.id === tutor.id ? "Asignado" : "Asignar Tutor"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Vista para Tutores
  const renderVistaTutor = () => (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#4854A1] flex items-center justify-center">
          <FaChalkboardTeacher className="text-white text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-black">Mis Estudiantes</h1>
          <p className="text-black">Estudiantes asignados a tu tutoría</p>
        </div>
      </div>

      {misEstudiantes.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <FaUsers className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No tienes estudiantes asignados</h3>
          <p className="text-yellow-600">Los estudiantes se asignarán automáticamente cuando te seleccionen como tutor.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Información de Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Competencias Inscritas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {misEstudiantes.map((estudiante) => (
                  <tr key={estudiante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estudiante.nombre}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <FaIdCard />
                          {estudiante.ci || 'Sin CI'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{estudiante.email}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <FaMapMarkerAlt />
                        {estudiante.ciudad}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {estudiante.competencias.length > 0 ? (
                          <div className="space-y-1">
                            {estudiante.competencias.map(comp => (
                              <span 
                                key={comp.id}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                              >
                                <FaTrophy className="text-xs" />
                                {comp.nombre} ({comp.area})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-black text-sm">Sin competencias inscritas</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // Vista para Administración y Lectura
  const renderVistaLectura = () => {
    const estudiantesConTutor = asignaciones.filter(a => !a.sinTutor);
    const estudiantesSinTutor = asignaciones.filter(a => a.sinTutor);

    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#4854A1] flex items-center justify-center">
            <FaUsers className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Gestión de Tutorías</h1>
            <p className="text-black">Listado de estudiantes y tutores asignados</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FaUserGraduate className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{asignaciones.length}</p>
                <p className="text-sm text-gray-600">Total Estudiantes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FaChalkboardTeacher className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{estudiantesConTutor.length}</p>
                <p className="text-sm text-gray-600">Con Tutor</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <FaUserGraduate className="text-yellow-600 text-xl" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{estudiantesSinTutor.length}</p>
                <p className="text-sm text-gray-600">Sin Tutor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de asignaciones */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Tutor Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Competencias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asignaciones.map((asignacion) => (
                  <tr key={asignacion.estudiante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {asignacion.estudiante.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asignacion.estudiante.email}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <FaIdCard />
                          {asignacion.estudiante.ci || 'Sin CI'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asignacion.tutor ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {asignacion.tutor.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asignacion.tutor.email}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {asignacion.competencias.length > 0 ? (
                          <div className="space-y-1">
                            {asignacion.competencias.slice(0, 2).map(comp => (
                              <span 
                                key={comp.id}
                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                <FaTrophy className="text-xs" />
                                {comp.nombre}
                              </span>
                            ))}
                            {asignacion.competencias.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{asignacion.competencias.length - 2} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin competencias</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asignacion.sinTutor ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Sin tutor
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Con tutor
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {asignaciones.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay estudiantes</h3>
              <p className="mt-1 text-sm text-gray-500">No se encontraron estudiantes registrados.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        {renderContenido()}
      </main>
      <Footer />
    </div>
  );
}