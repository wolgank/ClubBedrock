import { useUser } from "@/shared/context/UserContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Info, CalendarIcon } from "lucide-react";
import React from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import FormularioCompra from "../components/FormularioCompraV2";
import CompletedModal from "../components/ConfirmacionCompra";
import InfoEspacioModal from "../components/InfoEspacioModal";
import CancelPreReservaationModal from "../components/CancelPreReservaationModal";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getTimeSlotById } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { useEffect } from "react";
import { getSpaceByType } from "../../../../lib/api/apiSpace"
import { getTimeSlotDaySpaceId } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getTimeSlotDaySpaceIdDouble } from "@/lib/api/apiSpaceDayTimeSlotForMember";
import { getCorreoByUserId } from "@/lib/api/apiReservation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export type SpecialType = {
    startHour: string;
    pricePerBlock: number;
    endHour: string;
}

export type SlotTime = {
    timeSlot: string;
}

export type Space = {
    id: number;
    name: string;
    description: string;
    reference: string;
    capacity: number;
    urlImage: string;
    costPerHour: string;
    canBeReserved: boolean;
    isAvailable: boolean;
    type: 'LEISURE' | 'SPORTS';
};

export type Reservation = {
    name: string;
    date: string;
    startHour: string;
    endHour: string;
    capacity: number;
    allowOutsiders: boolean;
    description: string;
    spaceId: number;
};

export type SpaceDayTimeSlotForMember = {
    id: number,
    day: string,
    startHour: string,
    endHour: string,
    spaceUsed: number,
    pricePerBlock: number,
    isUsed: boolean,
}

function getStartEndTime(date: Date, timeRange: string): { startHour: string, endHour: string } {
    const [startStr, endStr] = timeRange.split(" - ");
    const [startHour, startMinute] = startStr.split(":").map(Number);
    const [endHour, endMinute] = endStr.split(":").map(Number);
    const start = new Date(date);
    start.setUTCHours(startHour, startMinute, 0, 0);
    const end = new Date(date);
    end.setUTCHours(endHour, endMinute, 0, 0);
    return {
        startHour: start.toISOString(),
        endHour: end.toISOString(),
    };
}

function getHoursDifference(timeRange: string): number {
    const [startStr, endStr] = timeRange.split(" - ");
    const [startHour, startMinute] = startStr.split(":").map(Number);
    const [endHour, endMinute] = endStr.split(":").map(Number);

    // Convierte a minutos totales
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    const diffMinutes = endTotalMinutes - startTotalMinutes;
    const diffHours = +(diffMinutes / 60).toFixed(2);

    return diffHours;
}

function getPricePerBlockByWeekdayAndTimeRange(
    importantData: {
        startHour: string;
        endHour: string;
        pricePerBlock: number;
    }[] | undefined,  // aceptar undefined también
    baseDateISO: string,
    timeRange: string
): number | undefined {

    if (!importantData || importantData.length === 0) return undefined; // protección

    const baseDate = new Date(baseDateISO);
    const baseWeekday = baseDate.getUTCDay();

    const [startStr, endStr] = timeRange.split(" - ");

    return importantData.find((item) => {
        const itemStart = new Date(item.startHour);
        const itemEnd = new Date(item.endHour);

        const itemWeekday = itemStart.getUTCDay();

        const matchWeekday = itemWeekday === baseWeekday;

        const formatHour = (d: Date) =>
            `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;

        const matchTimeRange =
            formatHour(itemStart) === startStr && formatHour(itemEnd) === endStr;

        return matchWeekday && matchTimeRange;
    })?.pricePerBlock;
}


export default function Desktop() {

    const { user } = useUser();
    const [userID, setUserID] = useState(user?.id);
    const [selectedCategory, setSelectedCategory] = useState<'LEISURE' | 'SPORTS'>('LEISURE');
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [allTimeSlot, setAllTimeSlot] = useState<SpaceDayTimeSlotForMember[]>([])
    const [selectedSpace, setSelectedSpace] = useState<Space | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [selectedReservation, setSelectedReservation] = useState<Reservation | undefined>(undefined);
    const [fullName, setFullName] = useState<string | null>("")
    const nombreEspacio = selectedSpace?.name;
    const capacidad = selectedSpace?.capacity;
    const descripcion = selectedSpace?.description
    const categories = [{ id: 1, name: "SPORTS" }, { id: 2, name: "LEISURE" }];
    // let timeSlots = [
    //     { id: 1, time: "10:00 - 12:00", selected: false }, // POR MIENTRAS, VA CAMBIAR
    //     { id: 2, time: "12:00 - 14:00", selected: false },
    //     { id: 3, time: "16:00 - 18:00", selected: true },
    //     { id: 4, time: "20:00 - 22:00", selected: false },
    // ];
    const [date, setDate] = React.useState<Date | undefined>(new Date(),);
    const isoDate = React.useMemo(() => { return date ? date.toISOString().split("T")[0] + "T00:00:00.000Z" : undefined; }, [date]);
    const navigate = useNavigate();
    const [showFormModal, setShowFormModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const openForm = () => setShowFormModal(true);
    const openPreCancel = () => setShowCancelModal(true);
    const [infoOpen, setInfoOpen] = useState(false);
    const selectedDate = new Date(isoDate!).toISOString().split("T")[0];
    const [availableSlots, setAvailableSlots] = useState<{ id: number; time: string; selected: boolean; }[]>([]);

    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
                    method: "GET",
                    credentials: "include", // importante para enviar cookies de sesión
                });
                const parsedUser = await res.json();
                //console.log("Parsed user:", parsedUser);
                setUserID((parsedUser.user.id));
                setFullName(String(parsedUser.user.name) + ' ' + String(parsedUser.user.lastname));
                //console.log("nombre Completo: ", parsedUser.user.name)
            } catch (e) {
                console.error("Error al obtener el usuario:", e);
            }
        }
        fetchUser();
    }, []);

    const { error, data } = useQuery({
        queryKey: ['get-space-type', selectedCategory],
        queryFn: () => getSpaceByType(selectedCategory),
        enabled: !!selectedCategory,
    });

    const { isLoading, data: timeSlotsM } = useQuery({
        queryKey: ['get-time-space', selectedSpace?.id, date?.toISOString()],
        queryFn: () => getTimeSlotDaySpaceId(selectedSpace?.id.toString(), date.toISOString()),
        enabled: !!selectedSpace?.id && !!date,
    });


    const { error: errorCorreo, data: dataCorreo } = useQuery({
        queryKey: ['get-correo-by-user-id', userID],
        queryFn: () => getCorreoByUserId(userID.toString()),
        enabled: !!userID,
    });


    useEffect(() => {
        if (timeSlotsM && Array.isArray(timeSlotsM)) {
            const transformed = timeSlotsM.map((time: string, index: number) => ({
                id: index + 1,
                time,
                selected: false,
            }));
            setAvailableSlots(transformed);
        }
    }, [timeSlotsM]);


    const { error: errorTimeSlot, data: dataTimeSlot } = useQuery({
        queryKey: ['get-time-slot', selectedSpace?.id],
        queryFn: () => getTimeSlotById(selectedSpace!.id.toString()),
        enabled: !!selectedSpace?.id,
    });

    if (error) return 'error server' + error.message
    if (errorTimeSlot) return 'error server' + errorTimeSlot.message



    const { isLoading: cargando, data: importantData } = useQuery({
        queryKey: ['get-all-cost', selectedSpace?.id],
        queryFn: () => getTimeSlotDaySpaceIdDouble(selectedSpace!.id.toString()),
        enabled: !!selectedSpace?.id,
    });

    //console.log("importantData:", importantData);
    useEffect(() => {
        if (data && data.length > 0) {
            setSpaces(data);
            setSelectedSpace(data[0]);
        } else {
            setSpaces([]);
            setSelectedSpace(undefined);
        }
    }, [data]);

    const handleSpaceChange = (name: string) => {
        const space = spaces.find((s) => s.name === name);
        setSelectedSpace(space);
    };

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
    const horas = selectedTime ? getHoursDifference(selectedTime) : 0;
    const costo = importantData
        ? getPricePerBlockByWeekdayAndTimeRange(importantData, date.toISOString(), selectedTime)
        : undefined;

    const resumen = '📍 ' + nombreEspacio + '\n📅 ' +
        (date && selectedTime ? formatDateRange(getStartEndTime(date, selectedTime).startHour, getStartEndTime(date, selectedTime).endHour) : '...') +
        '\n💰 S/.' + (costo ? costo : 0) +
        "\n👤 A nombre de " + fullName;


    useEffect(() => {
        if (date && selectedTime && selectedSpace) {
            const { startHour, endHour } = getStartEndTime(date, selectedTime);
            const reservation: Reservation = {
                name: selectedSpace.name,
                date: isoDate!,
                startHour: startHour,
                endHour: endHour,
                capacity: selectedSpace.capacity,
                allowOutsiders: true,
                description: selectedSpace.description,
                spaceId: selectedSpace.id,
            };
            //console.log(getPricePerBlockByWeekdayAndTimeRange(importantData, date.toISOString(), selectedTime));
            setSelectedReservation(reservation);
        } else {
            setSelectedReservation(undefined);
        }
        //console.log("Correo inicial", dataCorreo)
    }, [date, selectedTime, selectedSpace]);

    useEffect(() => {
        if (dataTimeSlot && dataTimeSlot.length > 0) {
            setAllTimeSlot(dataTimeSlot);
        } else {
            setAllTimeSlot([]);
        }
    }, [dataTimeSlot]);

    const buildSlotIsoRange = (time: string, dateStr: string) => {
        const [start, end] = time.split(" - ");
        const startIso = `${dateStr}T${start}:00.000Z`;
        const endIso = `${dateStr}T${end}:00.000Z`;
        return { startIso, endIso };
    };

    // Verifica si el slot está reservado comparando los ISO directamente
    const isSlotReserved = (timeSlotTime: string, reservedSlots: SpaceDayTimeSlotForMember[], dateStr: string) => {
        const { startIso, endIso } = buildSlotIsoRange(timeSlotTime, dateStr);
        return reservedSlots.some(res => {
            return !(endIso <= res.startHour || res.endHour <= startIso);
        });
    };

    const availableTimeSlots = availableSlots.filter(slot => !isSlotReserved(slot.time, allTimeSlot, selectedDate));
    useEffect(() => {
        if (
            availableTimeSlots.length > 0 &&
            (!selectedTime || !availableTimeSlots.some(slot => slot.time === selectedTime))
        ) {
            setSelectedTime(availableTimeSlots[0].time);
        }
    }, [availableTimeSlots]);

    const closeForm = () => {
        setShowFormModal(false);
    };

    const handlePurchase = () => {
        closeForm();
        setShowSuccessModal(true);
    };

    const handleCancelForm = () => {
        closeForm();
    };

    const closeSuccess = () => {
        setShowSuccessModal(false);
        navigate("/reservas");
    };

    const openInfo = () => {
        setInfoOpen(true);
    };

    const closeInfo = () => {
        setInfoOpen(false);
    };

    const cancelPreCancel = () => {
        setShowCancelModal(false);
    };

    const acceptPreCancel = () => {
        setShowCancelModal(false);
        navigate(-1);
    };

    return (
        <div className="flex flex-col items-center justify-center gap-[35px] px-[34px] py-[57px]">

            <div className="relative w-full max-w-[1343px]">
                <Button

                    onClick={openPreCancel}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base">Regresar</span>
                </Button>
            </div>

            <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)]">
                <h1 className="font-bold text-5xl leading-[48px]">
                    Nueva Reserva
                </h1>
            </div>

            <div className="flex flex-col w-full max-w-[1339px] items-center justify-center gap-10 p-[30px]  rounded-2xl background-custom">
                {/* Space Selection Card */}
                <Card className="w-full bg-white rounded-2xl overflow-hidden card-custom border-0 dark:text-[var(--primary)]">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-2xl font-bold text-[#222222] dark:text-[var(--primary)]">
                            Selección de Espacio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-[166px] ">
                            <div className="flex flex-col w-full md:w-[508px] gap-[19px]">
                                <div>
                                    <label className="font-semibold text-[#222222] text-base mb-2 block dark:text-[var(--primary)] ">
                                        Categoría
                                    </label>
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={(value) => setSelectedCategory(value as 'LEISURE' | 'SPORTS')}
                                    >
                                        <SelectTrigger className="w-full md:w-[453px] bg-white border-[#cccccc] rounded-lg dark:bg-[var(--color-gray-900)]">
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.name}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-semibold text-[#222222] text-base mb-2 block dark:text-[var(--primary)]">
                                        Espacio
                                    </label>
                                    <Select value={selectedSpace?.name} onValueChange={handleSpaceChange}>
                                        <SelectTrigger className="w-full md:w-[453px] bg-white border-[#cccccc] rounded-lg dark:bg-[var(--color-gray-900)]">
                                            <SelectValue placeholder="Seleccionar espacio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {spaces.map((space) => (
                                                <SelectItem key={space.id} value={space.name}>
                                                    {space.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div className="flex justify-center mt-4">
                                    <Button className="h-auto w-[280px] gap-2 p-3  text-white rounded-2xl button3-custom" onClick={() => openInfo()}>
                                        <Info className="w-4 h-4" />
                                        <span className="font-bold text-xl">
                                            Ver más información
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 md:mt-0">
                                <img
                                    src={selectedSpace?.urlImage ?? `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`}
                                    alt="Imagen referencial"
                                    className="w-full md:w-[507px] h-[225px] object-cover rounded-lg image-custom"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Date and Time Card */}
                <Card className="w-full max-w-[654px] bg-white rounded-2xl overflow-hidden card-custom border-0">
                    <CardContent className="flex flex-col md:flex-row items-center justify-center gap-10 p-6">
                        {/* Fecha */}
                        <div className="flex flex-col ">
                            <h3 className="font-bold text-[#222222] text-2xl mb-2 dark:text-[var(--primary)]">Fecha</h3>
                            <div className="w-[260px]">
                                <Popover>
                                    <PopoverTrigger asChild  >
                                        <div className="border-[#cccccc] dark:border-1 rounded-lg">
                                            <Button
                                                variant="outline"
                                                className="w-full h-[36px] flex items-center justify-between px-4 border-[#cccccc]  rounded-lg dark:bg-[var(--color-gray-900)] "
                                            >
                                                <span className="font-m3-body-large text-[#1d1b20] dark:text-[var(--primary)]">
                                                    {date ? date.toLocaleDateString() : "Selecciona una fecha"}
                                                </span>
                                                <CalendarIcon className="h-6 w-6 opacity-50 " />
                                            </Button>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(selectedDate) => {
                                                if (!selectedDate) return;
                                                setDate(selectedDate);
                                            }}
                                            locale={es}
                                            disabled={(d) => d < new Date()}
                                            className="rounded-md border-0"
                                        />

                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Horario */}
                        <div className="flex flex-col">
                            <h3 className="font-bold text-[#222222] text-2xl mb-2 dark:text-[var(--primary)] ">Horario</h3>
                            <div className="w-[260px]">
                                <Select
                                    value={selectedTime}
                                    onValueChange={setSelectedTime}
                                    disabled={availableTimeSlots.length === 0 || isLoading}
                                >
                                    <SelectTrigger className="w-full h-[36px] flex items-center justify-between px-4 border-[#cccccc] rounded-lg dark:bg-[var(--color-gray-900)]">
                                        <SelectValue
                                            placeholder={
                                                availableTimeSlots.length === 0
                                                    ? "No hay horarios disponibles"
                                                    : "Seleccionar horario"
                                            }
                                        >
                                            {availableTimeSlots.length === 0 ? "No hay horarios disponibles" : selectedTime}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableTimeSlots.length > 0 ? (
                                            availableTimeSlots.map((slot) => (
                                                <SelectItem key={slot.id} value={slot.time}>
                                                    {slot.time}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-disponible" disabled>
                                                No hay horarios disponibles
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </CardContent>
                </Card>
                {/* Space Information Card */}
                <Card className="w-full bg-[var(--brand)] rounded-2xl overflow-hidden text-white card-custom border-0">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-2xl font-bold text-white">
                            Información de Espacio Elegido
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-10">
                            <div className="flex flex-col w-full md:w-[586px] gap-[19px]">
                                <div>
                                    <label className="font-semibold text-white text-base mb-2 block ">
                                        Capacidad
                                    </label>
                                    <Input
                                        className="w-full md:w-[544px] h-[35px] bg-[#efefef] text-black border-[#cccccc] rounded-lg dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                        value={capacidad}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="font-semibold text-white text-base mb-2 block">
                                        Costo
                                    </label>
                                    <Input
                                        className="w-full md:w-[544px] h-[35px] bg-[#efefef] text-black border-[#cccccc] rounded-lg dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                        value={costo}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col w-full md:w-[434px] gap-[19px]">
                                <div>
                                    <label className="font-semibold text-white text-base mb-2 block dark:text-[var(--primary)]">
                                        Descripción
                                    </label>
                                    <div className="p-4">
                                        <Textarea
                                            value={descripcion}
                                            readOnly
                                            className="w-full h-[123px] bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>



                {/* Reservation Summary Card */}
                <Card className="w-full bg-[var(--brand)] rounded-2xl overflow-hidden text-white card-custom border-0">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-2xl font-bold text-white">
                            Resumen de la Reserva
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <label className="font-semibold text-white text-base mb-2 block">
                                Descripción
                            </label>
                            <div className="p-4">
                                <Textarea
                                    value={availableTimeSlots.length === 0 ? "No hay horarios disponibles" : resumen}
                                    readOnly
                                    className="w-full h-[123px] bg-[#efefef] rounded-lg p-2 text-[12.8px]  text-black leading-[15px] border border-[#cccccc] resize-none overflow-auto dark:text-[var(--primary)] dark:bg-[var(--color-gray-700)]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="w-full flex justify-center mt-4 gap-30">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="w-[349px] h-[46px] text-white font-bold text-xl rounded-lg button3-custom"
                                disabled={availableTimeSlots.length === 0 || !selectedTime}
                            >
                                RESERVAR Y PAGAR
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="background-custom">
                            <AlertDialogHeader>
                                <AlertDialogTitle>¡ADVERTENCIA!</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Las reservas NO SON EDITABLES. ¿Deseas continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="text-white hover:text-white rounded-lg border-0 font-bold  button4-custom">Cancelar</AlertDialogCancel>
                                <AlertDialogAction className="bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom" onClick={openForm}>
                                    Continuar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </div>

                {/* --- Modal --- */}
                {showFormModal && selectedReservation && selectedSpace && (
                    <div
                        className="fixed inset-0 bg-black/40 z-50 overflow-y-auto flex justify-center items-start py-10"
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <FormularioCompra
                                userID={userID!}
                                spaceValue={selectedSpace}
                                reservationValue={selectedReservation}
                                costo={costo}
                                nombreCompleto={fullName}
                                correo={dataCorreo}
                                onPurchase={handlePurchase}
                                onCancel={handleCancelForm}
                            />
                        </div>
                    </div>
                )}
                {showSuccessModal && selectedReservation && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={closeSuccess}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <CompletedModal
                                reservationValue={selectedReservation}
                                onClose={closeSuccess} />
                        </div>
                    </div>
                )}
                {infoOpen && selectedSpace && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={closeInfo}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <InfoEspacioModal
                                spaceValue={selectedSpace}
                                onClose={closeInfo}
                            />
                        </div>
                    </div>
                )}
                {showCancelModal && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={cancelPreCancel}
                    >
                        <div onClick={e => e.stopPropagation()}>
                            <CancelPreReservaationModal
                                onCancel={acceptPreCancel}
                                onAccept={cancelPreCancel}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}