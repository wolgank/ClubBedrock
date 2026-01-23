import { FileSpreadsheet, CalendarDays } from 'lucide-react';
// Asegúrate de que la ruta a tu función de exportación sea correcta
import { exportTableToExcel, MyColumnDef } from "@/shared/utils/export"
import { useQuery } from '@tanstack/react-query';
import { reporteEspacioLeisure } from "@/lib/api/apiReservationInscription"
import { reporteEventos } from "@/lib/api/apiEvent"

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

// 1. Columnas DETALLADAS para el Reporte de Uso de Espacios
// Extraídas de las tablas: reservation, space, user, auth, bill 
const spacesColumns: MyColumnDef<any>[] = [
    { accessorKey: 'idReserva', headerText: 'ID Reserva' },
    { accessorKey: 'fecha', headerText: 'Fecha' },
    { accessorKey: 'horario', headerText: 'Horario' },
    { accessorKey: 'nombreEspacio', headerText: 'Nombre Espacio' },
    { accessorKey: 'nombreUsuario', headerText: 'Usuario (Reserva)' },
    { accessorKey: 'emailUsuario', headerText: 'Email' },
    { accessorKey: 'estadoReserva', headerText: 'Estado de la Reserva' },
    { accessorKey: 'costoBloque', headerText: 'Costo x Bloque (S/)' },
    { accessorKey: 'montoTotal', headerText: 'Monto Total (S/)' },
    { accessorKey: 'estadoPago', headerText: 'Estado del Pago' },
    { accessorKey: 'metodoPago', headerText: 'Método de Pago' }
];

// 2. Datos de EJEMPLO para el Reporte de Uso de Espacios
// REEMPLAZA ESTO con la llamada a tu API.
const spacesData = [
    { idReserva: 201, fecha: '2025-07-01', horario: '19:00 - 20:00', nombreEspacio: 'Cancha de Fútbol A', tipoEspacio: 'SPORTS', nombreUsuario: 'Ana Torres', emailUsuario: 'ana.t@mail.com', rolUsuario: 'MEMBER', costoHora: 120.00, montoTotal: 120.00, estadoPago: 'PAID' },
    { idReserva: 202, fecha: '2025-07-01', horario: '18:00 - 20:00', nombreEspacio: 'Salón de Eventos Principal', tipoEspacio: 'LEISURE', nombreUsuario: 'Empresa XYZ', emailUsuario: 'eventos@xyz.com', rolUsuario: 'EVENTS', costoHora: 250.00, montoTotal: 500.00, estadoPago: 'PAID' },
    { idReserva: 203, fecha: '2025-07-02', horario: '10:00 - 11:00', nombreEspacio: 'Pista de Tenis 1', tipoEspacio: 'SPORTS', nombreUsuario: 'Carlos Solano', emailUsuario: 'carlos.s@mail.com', rolUsuario: 'MEMBER', costoHora: 80.00, montoTotal: 80.00, estadoPago: 'PENDING' },
    { idReserva: 204, fecha: '2025-07-03', horario: '20:00 - 21:00', nombreEspacio: 'Cancha de Pádel B', tipoEspacio: 'SPORTS', nombreUsuario: 'Lucia Morales', emailUsuario: 'lucia.m@mail.com', rolUsuario: 'GUEST', costoHora: 100.00, montoTotal: 100.00, estadoPago: 'PAID' },
    { idReserva: 205, fecha: '2025-07-04', horario: '14:00 - 17:00', nombreEspacio: 'Zona de Parrillas', tipoEspacio: 'LEISURE', nombreUsuario: 'Familia Quispe', emailUsuario: 'familia.q@mail.com', rolUsuario: 'MEMBER', costoHora: 50.00, montoTotal: 150.00, estadoPago: 'PAID' },
    { idReserva: 206, fecha: '2025-07-05', horario: '09:00 - 10:00', nombreEspacio: 'Pista de Tenis 2', tipoEspacio: 'SPORTS', nombreUsuario: 'Ricardo Vega', emailUsuario: 'ricardo.v@mail.com', rolUsuario: 'MEMBER', costoHora: 80.00, montoTotal: 80.00, estadoPago: 'CANCELLED' }
];

// 3. Columnas DETALLADAS para el Reporte de Eventos
// Extraídas de las tablas: event, event_inscription 
const eventsColumns: MyColumnDef<any>[] = [
    { accessorKey: 'idEvento', headerText: 'ID Evento' },
    { accessorKey: 'nombreEvento', headerText: 'Nombre del Evento' },
    { accessorKey: 'fecha', headerText: 'Fecha' },
    { accessorKey: 'horario', headerText: 'Horario' },
    { accessorKey: 'lugar', headerText: 'Lugar' },
    { accessorKey: 'capacidad', headerText: 'Capacidad' },
    { accessorKey: 'inscritos', headerText: 'Inscritos' },
    { accessorKey: 'asistentes', headerText: 'Asistentes' },
    { accessorKey: 'tasaAsistencia', headerText: 'Tasa Asistencia (%)' },
    { accessorKey: 'precioSocio', headerText: 'Precio Socio (S/)' },
    { accessorKey: 'precioInvitado', headerText: 'Precio Invitado (S/)' },
    { accessorKey: 'ingresosEstimados', headerText: 'Ingresos (S/)' },
    { accessorKey: 'estado', headerText: 'Estado' }
];

// 4. Datos de EJEMPLO para el Reporte de Eventos
// REEMPLAZA ESTO con la llamada a tu API.
const eventsData = [
    { idEvento: 51, nombreEvento: 'Campeonato de Tenis "Copa Verano"', fecha: '2025-02-15', horario: '09:00 - 18:00', lugar: 'Pistas de Tenis 1 y 2', capacidad: 32, inscritos: 30, asistentes: 28, tasaAsistencia: 93.3, precioSocio: 50.00, precioInvitado: 75.00, ingresosEstimados: 1550.00, estado: 'Finalizado' },
    { idEvento: 52, nombreEvento: 'Noche de Gala Aniversario del Club', fecha: '2025-04-20', horario: '20:00 - 02:00', lugar: 'Salón de Eventos Principal', capacidad: 200, inscritos: 185, asistentes: 180, tasaAsistencia: 97.3, precioSocio: 150.00, precioInvitado: 200.00, ingresosEstimados: 28500.00, estado: 'Finalizado' },
    { idEvento: 53, nombreEvento: 'Taller de Parrilla para Padres e Hijos', fecha: '2025-07-12', horario: '12:00 - 15:00', lugar: 'Zona de Parrillas', capacidad: 40, inscritos: 40, asistentes: 35, tasaAsistencia: 87.5, precioSocio: 60.00, precioInvitado: 80.00, ingresosEstimados: 2400.00, estado: 'Activo' },
    { idEvento: 54, nombreEvento: 'Campeonato Relámpago de Fútbol 7', fecha: '2025-08-10', horario: '10:00 - 16:00', lugar: 'Canchas de Fútbol A y B', capacidad: 16, inscritos: 12, asistentes: 0, tasaAsistencia: 0.0, precioSocio: 350.00, precioInvitado: 500.00, ingresosEstimados: 4200.00, estado: 'Inscripciones Abiertas' },
    { idEvento: 55, nombreEvento: 'Concierto Acústico al Aire Libre', fecha: '2025-09-05', horario: '19:00 - 21:00', lugar: 'Jardín Central', capacidad: 300, inscritos: 0, asistentes: 0, tasaAsistencia: 0.0, precioSocio: 40.00, precioInvitado: 60.00, ingresosEstimados: 0.00, estado: 'Próximamente' },
    { idEvento: 56, nombreEvento: 'Clase Maestra de Pádel con Profesional', fecha: '2025-06-30', horario: '16:00 - 18:00', lugar: 'Cancha de Pádel A', capacidad: 10, inscritos: 10, asistentes: 5, tasaAsistencia: 50.0, precioSocio: 100.00, precioInvitado: 150.00, ingresosEstimados: 1000.00, estado: 'Cancelado' }
];

// --- FIN: Definición de datos y columnas ---


export default function ReportesSection() {

    const { isLoading: CargandoEspacio, data: dataEspacio } = useQuery({
        queryKey: ['get-espacio-leisure-reporte'],
        queryFn: () => reporteEspacioLeisure(),
    });
    const { isLoading: CargandoEvento, data: dataEvento } = useQuery({
        queryKey: ['get-evento-reporte'],
        queryFn: () => reporteEventos(),
    });

    const handleDownload = (reportType: 'spaces' | 'events') => {
        if (reportType === 'spaces') {
            console.log("Exportando reporte de espacios...");
            exportTableToExcel(
                dataEspacio ?? [],
                spacesColumns,
                "Reporte_Uso_de_Espacios.xlsx"
            );
        } else if (reportType === 'events') {
            console.log("Exportando reporte de eventos...");
            exportTableToExcel(
                dataEvento ?? [],
                eventsColumns,
                "Reporte_de_Eventos.xlsx"
            );
        }
    };

    if (CargandoEspacio || CargandoEvento) {
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
                icon={CalendarDays} /* Ícono más apropiado para eventos */
                title="Reporte de Eventos"
                onClick={() => handleDownload('events')}
            />

        </div>
    );
}