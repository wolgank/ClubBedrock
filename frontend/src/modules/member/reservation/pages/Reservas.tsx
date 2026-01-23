import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import CancelReservationModal from '../components/CancelReservationModal'
import InfoEspacioReservModal from '../components/InfoEspacioReservModal'
import { useQuery } from "@tanstack/react-query";
import { getReservationInscription } from "../../../../lib/api/apiReservationInscription"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export type ReservationInscription = {
    reservationInscriptionId: number,
    isCancelled: boolean,
    reservationId: number,
    reservationTitle: string,
    reservationDate: string,
    reservationLocation: string,
    spaceId: number,
    spaceName: string,
    spaceType: string,
    capacity: number,
    costPerHour: string,
    startHour: string,
    endHour: string,
    description: string,
    urlImage: string,
}

export type ReservaInformacionBasica = {
    id: number,
    title: string,
    date: string,
    location: string,
    capacity: number,
    constPerHour: string,
    description: string,
    urlImage: string,
    spaceType: string,
}
function toLocalISOString(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // enero = 0
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

const now = new Date();
//console.log("Local ISO:", toLocalISOString(now));

// Esto es por mientras, esta feo pero ya que
const images = [
    `${import.meta.env.VITE_BACKEND_URL_MEDIA}/ESPACIO1.png`,
    `${import.meta.env.VITE_BACKEND_URL_MEDIA}/ESPACIO2.png`,
    `${import.meta.env.VITE_BACKEND_URL_MEDIA}/ESPACIO3.png`,
    `${import.meta.env.VITE_BACKEND_URL_MEDIA}/ESPACIO4.png`,
    `${import.meta.env.VITE_BACKEND_URL_MEDIA}/ESPACIO5.png`,
];
const formatoLocal = (fecha: Date) =>
    fecha.toLocaleString("es-PE", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
export default function Desktop() {

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [userID, setUserID] = useState('')
    const [reservasActuales, setReservasActuales] = useState<ReservaInformacionBasica[]>([]);
    const [reservasPasadas, setReservasPasadas] = useState<ReservaInformacionBasica[]>([]);
    const [selectedSpaceType, setSelectedSpaceType] = useState<string>('all');
    // Cantidad de ítems por página (puedes ajustar)
    const ACTIVE_ITEMS_PER_PAGE = 6;
    // Página actual de reservas activas
    const [activePage, setActivePage] = useState(1);
    // Cálculo de páginas totales
    const totalActivePages = Math.ceil(reservasActuales.length / ACTIVE_ITEMS_PER_PAGE);
    // Índices de slice para la página actual
    const activeStartIdx = (activePage - 1) * ACTIVE_ITEMS_PER_PAGE;
    const activeEndIdx = activeStartIdx + ACTIVE_ITEMS_PER_PAGE;
    // Reservas activas dentro de la página
    const pagedActiveReservations = reservasActuales.slice(activeStartIdx, activeEndIdx);



    const ITEMS_PER_PAGE = 6; // 6 tarjetas por página
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(reservasPasadas.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pagedReservations = reservasPasadas.slice(startIdx, endIdx); // Obtienes sólo las reservas de la página actual


    const [fullName, setFullName] = useState<string | null>("")
    const [selectedReservation, setSelectedReservation] = useState<ReservaInformacionBasica | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false) // Estado para el modal
    const [toCancelId, setToCancelId] = useState<number | null>(null) // (opcional) para saber qué reserva vamos a cancelar
    const [infoOpen, setInfoOpen] = useState(false);

    const [canReserve, setCanReserve] = useState(false);

    const handleFilterChange = (value: string | null) => {
        // Usamos el operador '??' para asegurar que si el valor es null o undefined,
        // se establezca un string vacío ''. Esto previene estados inválidos.
        console.log("Valor recibido por Select:", value);
        setSelectedSpaceType(value ?? '');
    };

    useEffect(() => {
        async function fetchUser() {
            setLoading(false);
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
                    method: "GET",
                    credentials: "include", // importante para enviar cookies de sesión
                });
                if (!res.ok) {
                    setError("No se encontró el usuario");
                    return;
                }
                const parsedUser = await res.json();
                //console.log("Parsed user:", parsedUser);
                setUserID(String(parsedUser.user.id));
                setFullName(String(parsedUser.user.name) + ' ' + String(parsedUser.user.lastname));
                setCanReserve(Boolean(parsedUser.membership?.active));
            } catch (e) {
                console.error("Error al obtener el usuario:", e);
                setError("Error al obtener el usuario");
            }
        }
        fetchUser();
    }, []);

    const { data } = useQuery({
        queryKey: ['get-reservation-inscription', userID],
        queryFn: () => getReservationInscription(userID),
        enabled: !!userID
    });

    const spaceTypes = useMemo(() => {
        if (!data) return []; // Si no hay datos, devuelve un array vacío
        // new Set() crea una colección de valores únicos
        // [... ] lo convierte de nuevo en un array
        return [...new Set(data.map(item => item.spaceType))];
    }, [data]);

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const meses = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ];
        start.setHours(start.getHours() + 5);
        end.setHours(end.getHours() + 5);
        const diaStart = start.getDate();
        const mesStart = meses[start.getMonth()];
        const anoStart = start.getFullYear();
        const horaStart = start.getHours().toString().padStart(2, '0');
        const minutoStart = start.getMinutes().toString().padStart(2, '0');
        const horaEnd = end.getHours().toString().padStart(2, '0');
        const minutoEnd = end.getMinutes().toString().padStart(2, '0');
        return `${diaStart} ${mesStart} de ${anoStart}, ${horaStart}:${minutoStart} - ${horaEnd}:${minutoEnd}`;
    };

    useEffect(() => {
        if (!data) return
        let actuales: ReservaInformacionBasica[] = [];
        let pasadas: ReservaInformacionBasica[] = [];
        data.forEach((reserva) => {
            const reservaInfo: ReservaInformacionBasica = {
                id: reserva.reservationInscriptionId,
                title: reserva.spaceName,
                date: formatDateRange(reserva.startHour, reserva.endHour),
                location: reserva.reservationLocation,
                capacity: reserva.capacity,
                constPerHour: reserva.costPerHour,
                description: reserva.description,
                urlImage: reserva.urlImage,
                spaceType: reserva.spaceType,
            };
            //console.log("Fecha actual: ", toLocalISOString(new Date()))
            //2025-06-22T01:13:22.105Z
            const fechaActual = toLocalISOString(new Date()); // Comparar fecha (cuando tengas la real)
            const esPasada = (fechaActual > reserva.reservationDate); // lógicamente reemplaza esto
            if (esPasada) {
                pasadas.push(reservaInfo);
            } else {
                actuales.push(reservaInfo);
            }
        });

        // Aplica el filtro si se ha seleccionado un spaceType
        if (selectedSpaceType && selectedSpaceType !== 'all') {
            actuales = actuales.filter(r => r.spaceType === selectedSpaceType);
            pasadas = pasadas.filter(r => r.spaceType === selectedSpaceType);
        }
        setReservasActuales(actuales);
        setReservasPasadas(pasadas);
    }, [data, selectedSpaceType])

    const handleConfirmCancel = (id: number) => {
        setReservasActuales((prev) => prev.filter(reserva => reserva.id !== id));
        setModalOpen(false)
        setToCancelId(null)
        window.location.reload();
    }

    const handleKeep = () => {
        setModalOpen(false)
        setToCancelId(null)
    }

    const openInfo = (reservation: ReservaInformacionBasica) => {
        setSelectedReservation(reservation);
        setInfoOpen(true);
    };

    const closeInfo = () => {
        setInfoOpen(false);
    };

    useEffect(() => {
        if (fullName) {
            //console.log("Nombre actualizado:", fullName);
        }
    }, [fullName]);

    useEffect(() => {
        if (toCancelId) {
            //console.log("Cancelado:", toCancelId);
        }
    }, [toCancelId]);


    if (loading) return <p className="p-4">Cargando reservas...</p>
    if (error) return <p className="p-4 text-red-500">Error: {error}</p>

    return (
        <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-12 py-8">
            <div className="relative w-full max-w-[1343px] ">
                <Button
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base ">Regresar</span>
                </Button>
            </div>

            <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)]">
                <h1 className="font-bold text-5xl  leading-[48px] ">
                    Reservas
                </h1>
            </div>

            <div className="flex flex-wrap w-full max-w-[1339px] gap-10 p-[30px] rounded-2xl overflow-hidden background-custom" >
                {/* Image Section */}
                <div className="w-full max-w-[1339px] flex justify-end">
                    <Select
                        value={selectedSpaceType}
                        onValueChange={handleFilterChange} // La forma correcta de manejar el cambio en este componente
                    >
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Filtrar por tipo de espacio..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Tipos de Espacio</SelectLabel>
                                {/* Opción para limpiar el filtro */}
                                <SelectItem value="all">Todos los tipos</SelectItem>

                                {/* Opciones dinámicas desde tus datos */}
                                {spaceTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full lg:w-[400px] h-[200px] overflow-hidden relative rounded-lg ">
                    <Carousel
                        opts={{ loop: true, align: "start" }}
                        plugins={[
                            Autoplay({
                                delay: 3000,
                                stopOnInteraction: false,
                            }),
                        ]}
                        className="w-full h-full "
                    >
                        <CarouselContent>
                            {images.map((src, index) => (
                                <CarouselItem key={index} className="w-full h-[200px] flex items-center justify-center ">
                                    <img
                                        src={src}
                                        alt={`Espacio ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg "
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 " />
                        <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10" />
                    </Carousel>
                </div>
                <div className="flex flex-col w-full gap-2 sm:gap-4 lg:flex-1">
                    {/* Active Reservations */}
                    <div className="flex flex-wrap justify-center  gap-2 sm:gap-4 w-full px-4 sm:px-6">
                        {pagedActiveReservations.map((reservation) => (
                            <Card
                                key={reservation.id}
                                className=" w-[246px]  h-[159px]  bg-[var(--brand)] rounded-2xl overflow-hidden card-custom border-0 "
                            >
                                <CardContent className="flex flex-col items-center justify-center gap-2.5 p-2.5 h-full ">
                                    <p className=" font-medium  text-white text-sm text-center">
                                        {reservation.title}
                                    </p>
                                    <p className=" font-medium text-white text-sm text-center">
                                        {reservation.date}
                                    </p>
                                    <p className=" font-medium text-white text-sm text-center">
                                        {reservation.location}
                                    </p>
                                    <div className="flex items-start gap-2.5">
                                        <Button className="h-[37px]  rounded-lg  button-custom " onClick={() => openInfo(reservation)}>
                                            <span className=" font-medium text-white text-base  " >
                                                Ver
                                            </span>
                                        </Button>
                                        <Button
                                            className="h-[37px] button-custom rounded-lg text-white  flex items-center gap-2 "
                                            onClick={() => {
                                                setSelectedReservation(reservation)
                                                setToCancelId(reservation.id)
                                                setModalOpen(true)
                                            }}
                                        >
                                            <span className=" font-medium text-white text-base dark:text-[var(--primary)] " >
                                                Cancelar
                                            </span>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {totalActivePages > 1 && (
                        <div className="flex justify-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={e => { e.preventDefault(); setActivePage(p => Math.max(p - 1, 1)); }}
                                            className={activePage === 1 ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: totalActivePages }, (_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink
                                                href="#"
                                                isActive={activePage === i + 1}
                                                onClick={e => { e.preventDefault(); setActivePage(i + 1); }}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={e => { e.preventDefault(); setActivePage(p => Math.min(p + 1, totalActivePages)); }}
                                            className={activePage === totalActivePages ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                    {/* Reservation History */}
                    <Collapsible
                        open={isHistoryOpen}
                        onOpenChange={setIsHistoryOpen}
                        className="w-full  rounded-lg overflow-hidden collapsible-custom"
                    >
                        <CollapsibleTrigger asChild>
                            <Button className="w-full h-[37px]  rounded-lg flex items-center justify-center gap-2  dark:text-[var(--primary)] button2-custom">
                                <span className=" font-medium text-white text-base ">
                                    Mostrar Historial de Reservas
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-2 bg-[#d6e2dd]  dark:bg-[var(--color-gray-800)]">
                            <div className="flex flex-wrap justify-center  gap-2 sm:gap-4 w-full px-4 sm:px-6">
                                {pagedReservations.map((reservation) => (
                                    <Card
                                        key={reservation.id}
                                        className=" w-[246px] h-[159px] rounded-lg bg-[#F3F0EA] overflow-hidden border-0 card-custom"
                                    >
                                        <CardContent className="flex flex-col items-center justify-center gap-2.5 p-2.5 h-full">
                                            <p className=" font-medium text-black text-sm text-center dark:text-white">
                                                {reservation.title}
                                            </p>
                                            <p className="font-medium text-[#1e1e1e] text-sm text-center dark:text-white">
                                                {reservation.date}
                                            </p>
                                            <p className=" font-medium text-[#1e1e1e] text-sm text-center dark:text-white">
                                                {reservation.location}
                                            </p>
                                            <Button className="w-[77px] h-[37px] bg-[#142e38] rounded-lg  button-custom " onClick={() => openInfo(reservation)} >
                                                <span className=" font-medium text-white text-base ">
                                                    Ver
                                                </span>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-4">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();                     // ①
                                                        setCurrentPage(p => Math.max(p - 1, 1));
                                                    }}
                                                    className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                                                />
                                            </PaginationItem>

                                            {/* Generamos un PaginationLink por cada página */}
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <PaginationItem key={i + 1}>
                                                    <PaginationLink
                                                        href="#"
                                                        isActive={currentPage === i + 1}
                                                        onClick={(e) => {
                                                            e.preventDefault();                   // ①
                                                            setCurrentPage(i + 1);
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();                     // ①
                                                        setCurrentPage(p => Math.min(p + 1, totalPages));
                                                    }}
                                                    className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>


                    {/* New Reservation Button  Button variant="ghost" className="w-[349px] h-[46px] bg-[#142e38] text-white font-bold text-xl rounded-lg"*/}
                    { canReserve && 
                    <div className=" flex w-full justify-center ">
                        <Button className="w-[349px] h-[57px] text-center text-white text-xl font-bold rounded-full button3-custom"
                            onClick={() => navigate("/reservas/nueva")}
                        >
                            REALIZAR NUEVA RESERVA
                        </Button>
                    </div> 
                      } 
                </div>


                {/* --- Modal --- */}
                {modalOpen && selectedReservation && (
                    <div
                        // Backdrop: clic fuera cierra modal
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={handleKeep}
                    >
                        {/* Evitamos que el click en el modal “burbujee” al backdrop */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();            // Detener propagación
                            }}
                        >
                            <CancelReservationModal
                                reserva={selectedReservation}
                                onAccept={() => handleConfirmCancel(selectedReservation.id)}
                                onCancel={handleKeep}
                            />
                        </div>
                    </div>
                )}
                {infoOpen && selectedReservation && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={closeInfo}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <InfoEspacioReservModal
                                reserva={selectedReservation}
                                onClose={closeInfo}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}