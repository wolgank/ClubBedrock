import { FileSpreadsheet, BookMarked } from 'lucide-react';
// Asegúrate de que la ruta a tu función de exportación sea correcta
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"
import { useQuery } from '@tanstack/react-query';
import { reporteEspacioDeportivo } from "@/lib/api/apiReservationInscription"
import { reporteAcademias } from "@/lib/api/apiAcademy"

// --- Componente de Tarjeta de Reporte Reutilizable ---
const ReportCard = ({ icon: Icon, title, onClick }) => (
    <div
        onClick={onClick}
        className="flex-1 min-w-[300px] flex flex-col items-center justify-center p-8 dark:bg-white/10 bg-[#318161] border border-white/20 rounded-2xl cursor-pointer
                   hover:bg-[#3ea87e] shadow-[0_0_5px_0px_rgba(0,0,0,0)] shadow-gray-500 transition-colors duration-300 ease-in-out group"
    >
        <div className="mb-4 p-4 bg-white/10 rounded-full border border-white/20 group-hover:scale-110 transition-transform">
            <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-bold text-xl text-white mb-2 text-center">{title}</h3>
    </div>
);

// --- INICIO: Definición de datos y columnas para los reportes ---

const spacesColumns: MyColumnDef<any>[] = [
    { accessorKey: 'idReserva', headerText: 'ID Reserva' },
    { accessorKey: 'fechaReserva', headerText: 'Fecha' },
    { accessorKey: 'horario', headerText: 'Horario' },
    { accessorKey: 'nombreCancha', headerText: 'Espacio Deportivo' },
    { accessorKey: 'nombreCliente', headerText: 'Nombre Cliente' },
    { accessorKey: 'emailCliente', headerText: 'Email Cliente' },
    { accessorKey: 'estadoReserva', headerText: 'Estado de la Reserva' },
    { accessorKey: 'montoTotal', headerText: 'Precio Total (S/)' },
    { accessorKey: 'montoPagado', headerText: 'Monto Pagado (S/)' },
    { accessorKey: 'estadoPago', headerText: 'Estado del Pago' },
    { accessorKey: 'metodoPago', headerText: 'Método de Pago' },
];

// 2. Datos MASIVOS de EJEMPLO para el Reporte de Uso de Espacios
// REEMPLAZA ESTO con la llamada a tu API.
const spacesData = [
    { idReserva: 101, fechaReserva: '2024-07-01', horario: '19:00 - 20:00', nombreCancha: 'Cancha de Fútbol 1', tipoDeporte: 'Fútbol', nombreCliente: 'Carlos Ruiz', emailCliente: 'carlos.r@example.com', estadoReserva: 'Completada', montoTotal: 150.00, montoPagado: 150.00, estadoPago: 'Pagado', metodoPago: 'Yape' },
    { idReserva: 102, fechaReserva: '2024-07-01', horario: '20:00 - 21:00', nombreCancha: 'Pádel 2', tipoDeporte: 'Pádel', nombreCliente: 'Ana Gomez', emailCliente: 'ana.g@example.com', estadoReserva: 'Completada', montoTotal: 80.00, montoPagado: 80.00, estadoPago: 'Pagado', metodoPago: 'Tarjeta de Crédito' },
    { idReserva: 103, fechaReserva: '2024-07-02', horario: '10:00 - 11:00', nombreCancha: 'Cancha de Tenis', tipoDeporte: 'Tenis', nombreCliente: 'Luis Fernandez', emailCliente: 'luis.f@example.com', estadoReserva: 'Cancelada', montoTotal: 100.00, montoPagado: 0.00, estadoPago: 'Pendiente', metodoPago: null },
    { idReserva: 104, fechaReserva: '2024-07-03', horario: '21:00 - 22:00', nombreCancha: 'Cancha de Fútbol 2', tipoDeporte: 'Fútbol', nombreCliente: 'Sofia Torres', emailCliente: 'sofia.t@example.com', estadoReserva: 'Completada', montoTotal: 150.00, montoPagado: 150.00, estadoPago: 'Pagado', metodoPago: 'Plin' },
    { idReserva: 105, fechaReserva: '2024-07-04', horario: '17:00 - 18:00', nombreCancha: 'Pádel 1', tipoDeporte: 'Pádel', nombreCliente: 'Carlos Ruiz', emailCliente: 'carlos.r@example.com', estadoReserva: 'Completada', montoTotal: 80.00, montoPagado: 80.00, estadoPago: 'Pagado', metodoPago: 'Efectivo' },
    { idReserva: 106, fechaReserva: '2024-07-05', horario: '18:00 - 19:00', nombreCancha: 'Cancha de Fútbol 1', tipoDeporte: 'Fútbol', nombreCliente: 'Jorge Luna', emailCliente: 'jorge.l@example.com', estadoReserva: 'Confirmada', montoTotal: 150.00, montoPagado: 75.00, estadoPago: 'Parcial', metodoPago: 'Yape' },
    { idReserva: 107, fechaReserva: '2024-07-06', horario: '09:00 - 10:00', nombreCancha: 'Cancha de Tenis', tipoDeporte: 'Tenis', nombreCliente: 'Maria Rodriguez', emailCliente: 'maria.r@example.com', estadoReserva: 'Completada', montoTotal: 100.00, montoPagado: 100.00, estadoPago: 'Pagado', metodoPago: 'Tarjeta de Débito' },
    { idReserva: 108, fechaReserva: '2024-07-07', horario: '19:00 - 20:00', nombreCancha: 'Pádel 1', tipoDeporte: 'Pádel', nombreCliente: 'Ana Gomez', emailCliente: 'ana.g@example.com', estadoReserva: 'Completada', montoTotal: 80.00, montoPagado: 80.00, estadoPago: 'Pagado', metodoPago: 'Tarjeta de Crédito' },
    { idReserva: 109, fechaReserva: '2024-07-08', horario: '20:00 - 21:00', nombreCancha: 'Cancha de Fútbol 1', tipoDeporte: 'Fútbol', nombreCliente: 'David Costa', emailCliente: 'david.c@example.com', estadoReserva: 'Confirmada', montoTotal: 160.00, montoPagado: 0.00, estadoPago: 'Pendiente', metodoPago: null },
    { idReserva: 110, fechaReserva: '2024-07-08', horario: '20:00 - 21:00', nombreCancha: 'Pádel 2', tipoDeporte: 'Pádel', nombreCliente: 'Laura Paez', emailCliente: 'laura.p@example.com', estadoReserva: 'Completada', montoTotal: 80.00, montoPagado: 80.00, estadoPago: 'Pagado', metodoPago: 'Plin' },
    { idReserva: 111, fechaReserva: '2024-07-09', horario: '22:00 - 23:00', nombreCancha: 'Cancha de Fútbol 2', tipoDeporte: 'Fútbol', nombreCliente: 'Carlos Ruiz', emailCliente: 'carlos.r@example.com', estadoReserva: 'Completada', montoTotal: 120.00, montoPagado: 120.00, estadoPago: 'Pagado', metodoPago: 'Yape' },
    { idReserva: 112, fechaReserva: '2024-07-10', horario: '11:00 - 12:00', nombreCancha: 'Cancha de Tenis', tipoDeporte: 'Tenis', nombreCliente: 'Ricardo Flores', emailCliente: 'ricardo.f@example.com', estadoReserva: 'Completada', montoTotal: 100.00, montoPagado: 100.00, estadoPago: 'Pagado', metodoPago: 'Efectivo' },
    { idReserva: 113, fechaReserva: '2024-07-11', horario: '19:00 - 20:00', nombreCancha: 'Pádel 1', tipoDeporte: 'Pádel', nombreCliente: 'Ana Gomez', emailCliente: 'ana.g@example.com', estadoReserva: 'Cancelada', montoTotal: 80.00, montoPagado: 80.00, estadoPago: 'Reembolsado', metodoPago: 'Tarjeta de Crédito' },
    { idReserva: 114, fechaReserva: '2024-07-12', horario: '21:00 - 22:00', nombreCancha: 'Cancha de Fútbol 1', tipoDeporte: 'Fútbol', nombreCliente: 'Sofia Torres', emailCliente: 'sofia.t@example.com', estadoReserva: 'Confirmada', montoTotal: 160.00, montoPagado: 160.00, estadoPago: 'Pagado', metodoPago: 'Yape' },
    { idReserva: 115, fechaReserva: '2024-07-13', horario: '16:00 - 17:00', nombreCancha: 'Pádel 2', tipoDeporte: 'Pádel', nombreCliente: 'Bruno Diaz', emailCliente: 'bruno.d@example.com', estadoReserva: 'Completada', montoTotal: 80.00, montoPagado: 80.00, estadoPago: 'Pagado', metodoPago: 'Plin' },
];

// 3. Columnas DETALLADAS para el Reporte de Academias (sin cambios en la estructura)
const academiesColumns: MyColumnDef<any>[] = [
    { accessorKey: 'idAcademia', headerText: 'ID Academia' },
    { accessorKey: 'nombreAcademia', headerText: 'Nombre de la Academia' },
    { accessorKey: 'deporte', headerText: 'Deporte' },
    { accessorKey: 'capacidadMaxima', headerText: 'Capacidad Máxima' },
    { accessorKey: 'totalInscritos', headerText: 'Total Inscritos' },
    { accessorKey: 'tasaOcupacion', headerText: 'Tasa de Ocupación (%)' },
    { accessorKey: 'estado', headerText: 'Estado Actual' }
];

// 4. Datos MASIVOS de EJEMPLO para el Reporte de Academias
// REEMPLAZA ESTO con la llamada a tu API.
const academiesData = [
    { idAcademia: 'ACAD-FUT-V24', nombreAcademia: 'Fútbol Verano 2024', deporte: 'Fútbol', instructorPrincipal: 'Juan Perez', capacidadMaxima: 30, totalInscritos: 28, tasaOcupacion: 93.3, fechaInicio: '2024-01-15', fechaFin: '2024-03-15', costoInscripcion: 250.00, ingresosTotales: 7000.00, estado: 'Finalizada' },
    { idAcademia: 'ACAD-TEN-V24', nombreAcademia: 'Tenis Verano 2024', deporte: 'Tenis', instructorPrincipal: 'Maria Lopez', capacidadMaxima: 20, totalInscritos: 15, tasaOcupacion: 75.0, fechaInicio: '2024-01-20', fechaFin: '2024-03-20', costoInscripcion: 300.00, ingresosTotales: 4500.00, estado: 'Finalizada' },
    { idAcademia: 'ACAD-PAD-A24', nombreAcademia: 'Pádel Avanzado T1', deporte: 'Pádel', instructorPrincipal: 'Pedro Castillo', capacidadMaxima: 16, totalInscritos: 16, tasaOcupacion: 100.0, fechaInicio: '2024-04-01', fechaFin: '2024-06-01', costoInscripcion: 350.00, ingresosTotales: 5600.00, estado: 'Finalizada' },
    { idAcademia: 'ACAD-FUT-I24', nombreAcademia: 'Fútbol Invierno 2024', deporte: 'Fútbol', instructorPrincipal: 'Juan Perez', capacidadMaxima: 30, totalInscritos: 22, tasaOcupacion: 73.3, fechaInicio: '2024-06-10', fechaFin: '2024-08-10', costoInscripcion: 280.00, ingresosTotales: 6160.00, estado: 'Activa' },
    { idAcademia: 'ACAD-TEN-P24', nombreAcademia: 'Tenis Principiantes T2', deporte: 'Tenis', instructorPrincipal: 'Laura Soto', capacidadMaxima: 20, totalInscritos: 18, tasaOcupacion: 90.0, fechaInicio: '2024-07-01', fechaFin: '2024-09-01', costoInscripcion: 250.00, ingresosTotales: 4500.00, estado: 'Activa' },
    { idAcademia: 'ACAD-PAD-I24', nombreAcademia: 'Pádel Invierno 2024', deporte: 'Pádel', instructorPrincipal: 'Pedro Castillo', capacidadMaxima: 16, totalInscritos: 10, tasaOcupacion: 62.5, fechaInicio: '2024-07-15', fechaFin: '2024-09-15', costoInscripcion: 320.00, ingresosTotales: 3200.00, estado: 'Activa' },
    { idAcademia: 'ACAD-FUT-T24', nombreAcademia: 'Fútbol Tarde Joven', deporte: 'Fútbol', instructorPrincipal: 'Roberto Carlos', capacidadMaxima: 25, totalInscritos: 5, tasaOcupacion: 20.0, fechaInicio: '2024-09-01', fechaFin: '2024-11-01', costoInscripcion: 260.00, ingresosTotales: 1300.00, estado: 'Inscripciones Abiertas' },
    { idAcademia: 'ACAD-TEN-A24', nombreAcademia: 'Tenis Alta Competencia', deporte: 'Tenis', instructorPrincipal: 'Maria Lopez', capacidadMaxima: 12, totalInscritos: 0, tasaOcupacion: 0.0, fechaInicio: '2024-09-15', fechaFin: '2024-12-15', costoInscripcion: 400.00, ingresosTotales: 0.00, estado: 'Próximamente' },
    { idAcademia: 'ACAD-PAD-X24', nombreAcademia: 'Pádel Express', deporte: 'Pádel', instructorPrincipal: 'Pedro Castillo', capacidadMaxima: 10, totalInscritos: 12, tasaOcupacion: 120.0, fechaInicio: '2024-05-01', fechaFin: '2024-05-15', costoInscripcion: 150.00, ingresosTotales: 1800.00, estado: 'Cancelada' },
];

// --- FIN: Definición de datos y columnas ---


export default function ReportesSection() {

    const { isLoading: CargandoEspacio, data: dataEspacio } = useQuery({
        queryKey: ['get-espacio-reporte'],
        queryFn: () => reporteEspacioDeportivo(),
    });

    const { isLoading: CargandoAcademias, data: dataAcademias } = useQuery({
        queryKey: ['get-academy-reporte'],
        queryFn: () => reporteAcademias(),
    });
    const handleDownload = (reportType: 'spaces' | 'academies') => {
        if (reportType === 'spaces') {
            console.log("Exportando reporte de espacios...");
            exportTableToExcel(
                dataEspacio ?? [],          // Aquí irían tus datos reales
                spacesColumns,
                "Reporte_Uso_de_Espacios.xlsx"
            );
        } else if (reportType === 'academies') {
            console.log("Exportando reporte de academias...");
            exportTableToExcel(
                dataAcademias ?? [],         // Aquí irían tus datos reales
                academiesColumns,
                "Reporte_Academias_Deportivas.xlsx"
            );
        }
    };

    if (CargandoEspacio || CargandoAcademias) {
        return (
            <div className="animate-pulse p-4 rounded bg-muted text-muted-foreground">
                Cargando información...
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row flex-wrap gap-8 w-full justify-center">

            <ReportCard
                icon={FileSpreadsheet}
                title="Reporte de Uso de Espacios"
                onClick={() => handleDownload('spaces')}
            />

            <ReportCard
                icon={BookMarked}
                title="Reporte de Academias"
                onClick={() => handleDownload('academies')}
            />

        </div>
    );
}