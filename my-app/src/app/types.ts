export type EstadoUi = "Inscripción" | "Desarrollo" | "Evaluación" | "Modificaciones" | "Finalización";
export type EstadoApi = "INSCRIPCION" | "DESARROLLO" | "EVALUACION" | "MODIFICACIONES" | "FINALIZACION";

export type NivelUi = "Principiante" | "Intermedio" | "Avanzado";
export type NivelApi = "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO";

export type AreaUi = "Matemática" | "Física" | "Robótica" | "Química" | "Programación";
export type AreaApi = "MATEMATICA" | "FISICA" | "ROBOTICA" | "QUIMICA" | "PROGRAMACION";

export const estadoUi2Api: Record<EstadoUi, EstadoApi> = {
  "Inscripción": "INSCRIPCION",
  "Desarrollo": "DESARROLLO",
  "Evaluación": "EVALUACION",
  "Modificaciones": "MODIFICACIONES",
  "Finalización": "FINALIZACION",
};
export const estadoApi2Ui: Record<EstadoApi, EstadoUi> = {
  INSCRIPCION: "Inscripción",
  DESARROLLO: "Desarrollo",
  EVALUACION: "Evaluación",
  MODIFICACIONES: "Modificaciones",
  FINALIZACION: "Finalización",
};

export const nivelUi2Api: Record<NivelUi, NivelApi> = {
  "Principiante": "PRINCIPIANTE",
  "Intermedio": "INTERMEDIO",
  "Avanzado": "AVANZADO",
};
export const nivelApi2Ui: Record<NivelApi, NivelUi> = {
  PRINCIPIANTE: "Principiante",
  INTERMEDIO: "Intermedio",
  AVANZADO: "Avanzado",
};

export const areaUi2Api: Record<AreaUi, AreaApi> = {
  "Matemática": "MATEMATICA",
  "Física": "FISICA",
  "Robótica": "ROBOTICA",
  "Química": "QUIMICA",
  "Programación": "PROGRAMACION",
};
export const areaApi2Ui: Record<AreaApi, AreaUi> = {
  MATEMATICA: "Matemática",
  FISICA: "Física",
  ROBOTICA: "Robótica",
  QUIMICA: "Química",
  PROGRAMACION: "Programación",
};
