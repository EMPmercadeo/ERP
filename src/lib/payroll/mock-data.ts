/**
 * Datos de Muestra (Mock Data) - Colaboradores ERP Panamá Planilla & RRHH
 * Abarca diferentes tramos de ingresos para probar en tiempo real deducciones e ISR en la app principal.
 */

export interface ColaboradorMock {
  id: string;
  nombre: string;
  cedula: string;
  cargo: string;
  departamento: string;
  salarioBaseMensual: number;
  tipoContrato: string;
  fechaIngreso: string;
  frecuenciaPago: "mensual" | "quincenal" | "bisemanal";
  tasaRiesgo: number;
  estado: "Activo" | "Inactivo";
}

export const COLABORADORES_MOCK: ColaboradorMock[] = [
  {
    id: "EMP-001",
    nombre: "Ana María Rodríguez",
    cedula: "8-745-1209",
    cargo: "Asistente Contable y Administrativa",
    departamento: "Administración",
    salarioBaseMensual: 850.00,
    tipoContrato: "Indefinido",
    fechaIngreso: "2024-03-15",
    frecuenciaPago: "quincenal",
    tasaRiesgo: 0.0105,
    estado: "Activo"
  },
  {
    id: "EMP-002",
    nombre: "Carlos Eduardo Méndez",
    cedula: "E-8-154872",
    cargo: "Analista Financiero Senior",
    departamento: "Finanzas",
    salarioBaseMensual: 1800.00, // Tramo 15% de ISR
    tipoContrato: "Indefinido",
    fechaIngreso: "2022-08-01",
    frecuenciaPago: "quincenal",
    tasaRiesgo: 0.0105,
    estado: "Activo"
  },
  {
    id: "EMP-003",
    nombre: "Roberto Chen de la Guardia",
    cedula: "3-102-4581",
    cargo: "Gerente General de Operaciones",
    departamento: "Dirección",
    salarioBaseMensual: 5500.00, // Tramo 25% de ISR (> $50,000 anuales)
    tipoContrato: "Indefinido",
    fechaIngreso: "2020-01-10",
    frecuenciaPago: "mensual",
    tasaRiesgo: 0.0105,
    estado: "Activo"
  },
  {
    id: "EMP-004",
    nombre: "Mariela Santos Morales",
    cedula: "4-712-990",
    cargo: "Especialista en Soporte Técnico",
    departamento: "Tecnología",
    salarioBaseMensual: 1200.00, // Caso exacto Test 1
    tipoContrato: "Indefinido",
    fechaIngreso: "2023-05-20",
    frecuenciaPago: "bisemanal",
    tasaRiesgo: 0.0105,
    estado: "Activo"
  },
  {
    id: "EMP-005",
    nombre: "Jorge Luis Batista",
    cedula: "2-701-334",
    cargo: "Supervisor de Logística y Almacén",
    departamento: "Operaciones",
    salarioBaseMensual: 1450.00,
    tipoContrato: "Indefinido",
    fechaIngreso: "2021-11-02",
    frecuenciaPago: "quincenal",
    tasaRiesgo: 0.0210, // 2.10% Riesgo moderado
    estado: "Activo"
  }
];
