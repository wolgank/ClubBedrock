import React, { useState } from "react";
import { useForm, Controller, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { es } from "date-fns/locale";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reservation, Space, SpaceDayTimeSlotForMember } from "../pages/NuevaReserva";
import { toast } from "sonner";
interface Props {
    userID: number;
    spaceValue: Space;
    reservationValue: Reservation;
    costo: number; // Costo total de la reserva
    nombreCompleto: string,
    correo: string;
    onPurchase: () => void;
    onCancel: () => void;
}

function getAllErrorMessages(errors: Record<string, any>): string[] {
    return Object.values(errors).flatMap((err: any) => {
        if (err.types) {
            return Object.values(err.types) as string[];
        }
        if (err.message) {
            return [err.message];
        }
        return getAllErrorMessages(err);
    });
}

function ErrorSummary({ messages }: { messages: string[] }) {
    if (messages.length === 0) return null;
    return (
        <div className="border border-red-500 bg-red-100 p-4 rounded-md mt-2">
            <p className="font-semibold text-red-700 mb-2">Por favor corrige los siguientes errores:</p>
            <ul className="list-disc list-inside text-red-600 space-y-1">
                {messages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}

// ---------- 1) Schema de validación con Zod ----------
// paymentMethod solo "card"; superRefine obliga a tarjeta si paymentMethod="card"
const purchaseSchema = z
    .object({
        documentType: z.enum(["dni", "passport", "other"], {
            required_error: "Debes seleccionar un tipo de documento.",
        }),
        documentNumber: z
            .string()
            .nonempty({ message: "El número de documento es obligatorio." })
            .min(3, { message: "El número de documento debe tener al menos 3 caracteres." }),
        date: z.date({ required_error: "Debes seleccionar una fecha." }),
        firstName: z.string().nonempty({ message: "Los nombres son obligatorios." }),
        lastName: z.string().nonempty({ message: "Los apellidos son obligatorios." }),
        contactEmail: z
            .string()
            .nonempty({ message: "El correo es obligatorio." })
            .email({ message: "Debes ingresar un correo válido." }),
        contactPhone: z.string().nonempty({ message: "El teléfono es obligatorio." }),
        paymentMethod: z.enum(["card"], {
            required_error: "Debes elegir un método de pago.",
        }),
        // Estos refinamientos son “suaves” porque superRefine los convertirá en obligatorios:
        cardNumber: z
            .string()
            .optional()
            .refine((val) => {
                if (!val) return true;
                return /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(val);
            }, {
                message: "Número de tarjeta inválido. Debe tener 16 dígitos numéricos.",
            }),
        cardCvv: z
            .string()
            .optional()
            .refine((val) => {
                if (!val) return true;
                return /^\d{3,4}$/.test(val);
            }, {
                message: "CVV inválido. Debe tener 3 o 4 dígitos.",
            }),
        cardExpiry: z
            .string()
            .optional()
            .refine((val) => {
                if (!val) return true;
                return /^(0[1-9]|1[0-2])\/\d{4}$/.test(val);
            }, {
                message: "Formato inválido. Usa MM/YYYY.",
            }),
        cardHolderName: z
            .string()
            .optional()
            .refine((val) => {
                if (!val) return true;
                return val.trim().length > 0;
            }, {
                message: "El nombre en la tarjeta no puede estar vacío.",
            }),
        saveCard: z.boolean().optional(),
        termsAccepted: z
            .boolean()
            .refine((val) => val === true, {
                message: "Debes aceptar los términos y condiciones.",
            }),
    })
    .superRefine((data, ctx) => {
        // Si el método es "card", todos los campos de tarjeta pasan a ser obligatorios
        if (data.paymentMethod === "card") {
            if (!data.cardNumber) {
                ctx.addIssue({
                    code: "custom",
                    path: ["cardNumber"],
                    message: "Número de tarjeta es obligatorio cuando eliges pago con tarjeta.",
                });
            }
            if (!data.cardCvv) {
                ctx.addIssue({
                    code: "custom",
                    path: ["cardCvv"],
                    message: "CVV es obligatorio cuando eliges pago con tarjeta.",
                });
            }
            if (!data.cardExpiry) {
                ctx.addIssue({
                    code: "custom",
                    path: ["cardExpiry"],
                    message: "Fecha de vencimiento es obligatoria cuando eliges pago con tarjeta.",
                });
            }
            if (!data.cardHolderName) {
                ctx.addIssue({
                    code: "custom",
                    path: ["cardHolderName"],
                    message: "Nombre en la tarjeta es obligatorio cuando eliges pago con tarjeta.",
                });
            }
        }
    });

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

// ---------- 2) Función auxiliar para fecha ISO ----------
function obtenerFechaLocalISO(): string {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    const segundos = String(ahora.getSeconds()).padStart(2, "0");
    return `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}`;
}

// ---------- 3) Componente principal DialogBody ----------
export default function DialogBody({
    userID,
    spaceValue,
    reservationValue,
    costo,
    nombreCompleto,
    correo,
    onPurchase,
    onCancel,
}: Props) {
    const spaceDayTimeSlotForMemberValue: SpaceDayTimeSlotForMember = {
        id: 0, // O asigna un valor adecuado si corresponde
        day: reservationValue.date,
        startHour: reservationValue.startHour,
        endHour: reservationValue.endHour,
        spaceUsed: spaceValue.id,
        pricePerBlock: 0, // Ajusta según tu modelo
        isUsed: false, // O el valor adecuado según tu lógica
    };

    // Inicializamos el form completo con Zod
    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema),
        defaultValues: {
            documentType: "dni",
            documentNumber: "",
            date: undefined,
            firstName: "",
            lastName: "",
            contactEmail: "",
            contactPhone: "",
            paymentMethod: "card", // siempre "card"
            cardNumber: "",
            cardCvv: "",
            cardExpiry: "",
            cardHolderName: "",
            saveCard: false,
            termsAccepted: false,
        },
        mode: "onSubmit",
    });

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        trigger,        // Lo necesitamos para disparar validaciones parciales
        setError,       // Lo usamos para asignar errores manualmente
        clearErrors,    // Para limpiar errores manuales
        formState: { errors, isSubmitting },
        getValues,
    } = form;

    // Estado para mostrar/ocultar panel de tarjeta
    const [showCardPanel, setShowCardPanel] = useState(false);
    // Estado para indicar si la tarjeta ya se “guardó” correctamente
    const [cardSaved, setCardSaved] = useState(false);
    // Últimos 4 dígitos de la tarjeta guardada
    const [last4, setLast4] = useState<string | null>(null);

    // Abrir el panel si paymentMethod=== "card" (solo ocurre al montar porque default es "card")
    const paymentMethodValue = watch("paymentMethod");
    React.useEffect(() => {
        if (paymentMethodValue === "card") {
            setShowCardPanel(true);
        }
    }, [paymentMethodValue]);

    // Si hay error en tarjeta o método de pago, abrir el panel
    const onError = (formErrors: Record<string, any>) => {
        if (
            formErrors.paymentMethod ||
            formErrors.cardNumber ||
            formErrors.cardCvv ||
            formErrors.cardExpiry ||
            formErrors.cardHolderName
        ) {
            setShowCardPanel(true);
        }
    };

    // Validación manual de campos de tarjeta al hacer clic en “Guardar Tarjeta”
    const handleSaveCard = () => {
        const values = form.getValues();
        let anyError = false;

        // 1) Número de tarjeta: no vacío + 16 dígitos
        if (!values.cardNumber || !/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(values.cardNumber)) {
            setError("cardNumber", {
                type: "manual",
                message: "Número de tarjeta inválido. Debe tener 16 dígitos numéricos.",
            });
            anyError = true;
        } else {
            clearErrors("cardNumber");
        }

        // 2) CVV: no vacío + 3 o 4 dígitos
        if (!values.cardCvv || !/^\d{3,4}$/.test(values.cardCvv)) {
            setError("cardCvv", {
                type: "manual",
                message: "CVV inválido. Debe tener 3 o 4 dígitos.",
            });
            anyError = true;
        } else {
            clearErrors("cardCvv");
        }

        // 3) Expiry: no vacío + formato MM/YYYY
        if (!values.cardExpiry || !/^(0[1-9]|1[0-2])\/\d{4}$/.test(values.cardExpiry)) {
            setError("cardExpiry", {
                type: "manual",
                message: "Formato inválido. Usa MM/YYYY.",
            });
            anyError = true;
        } else {
            clearErrors("cardExpiry");
        }

        // 4) Nombre en la tarjeta: no vacío
        if (!values.cardHolderName || values.cardHolderName.trim().length === 0) {
            setError("cardHolderName", {
                type: "manual",
                message: "El nombre en la tarjeta no puede estar vacío.",
            });
            anyError = true;
        } else {
            clearErrors("cardHolderName");
        }

        // Si pasó todas las validaciones manuales, guardamos la tarjeta
        if (!anyError) {
            // Extraemos últimos 4 dígitos (sin espacios)
            const rawNumber = (values.cardNumber ?? "").replace(/\s+/g, "");
            setLast4(rawNumber.slice(-4));
            setCardSaved(true);
            setShowCardPanel(false); // cerramos el panel
        }
    };

    // Handler al enviar el formulario completo (solo si pasa Zod)
    const onSubmit = async (values: PurchaseFormValues) => {
        const start = new Date(reservationValue.startHour);
        const end = new Date(reservationValue.endHour);
        const diffMs = end.getTime() - start.getTime(); // diferencia en milisegundos
        const diffHours = +(diffMs / (1000 * 60 * 60)).toFixed(2);    // diferencia en horas (
        const billAmount = costo;
        try {
            //console.log("correo", correo)
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/reservationSpaceInscription`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre: nombreCompleto,
                        correo: correo, 
                        espacio: spaceValue.name,
                        bill: {
                            finalAmount: billAmount,
                            status: "PAID",
                            description: reservationValue.description,
                            createdAt: obtenerFechaLocalISO(),
                            dueDate: obtenerFechaLocalISO(),
                            userId: Number(userID),
                        },
                        billDetail: {
                            price: billAmount,
                            discount: 0.0,
                            finalPrice: billAmount,
                            description: spaceValue.description,
                        },
                        inscription: {
                            isCancelled: false,
                            userId: Number(userID),
                        },
                        reservationInscription: {
                            isCancelled: false,
                        },
                        reservation: {
                            name: reservationValue.name,
                            date: reservationValue.date,
                            startHour: reservationValue.startHour,
                            endHour: reservationValue.endHour,
                            capacity: reservationValue.capacity,
                            allowOutsiders: reservationValue.allowOutsiders,
                            description: reservationValue.description,
                            spaceId: reservationValue.spaceId,
                        },
                    }),
                }
            );
            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocidow");
            }

            toast.success(
                <>
                    <strong>Reserva creada correctamente.</strong>
                </>
            );

            onPurchase();
        } catch (err) {
            console.error(err);
            toast.error(
                <>
                    <strong>Error al reservar espacio.</strong>
                    <div>{err?.message || "Error desconocido"}</div>
                </>
            );

        }
    };

    const {
        cardNumber: _cnErr,
        cardCvv: _cvvErr,
        cardExpiry: _expErr,
        cardHolderName: _chErr,
        ...otherErrors
    } = errors;
    const allErrors = getAllErrorMessages(otherErrors);

    return (
        <Card
            className="flex rounded-xl border-none background-custom max-w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Botón de cerrar */}
            <button onClick={onCancel} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                ✕
            </button>

            <div className="flex flex-col w-full items-center relative">
                <h1 className="relative w-fit mt-[-1px] font-bold text-[var(--brand)] text-2xl dark:text-[var(--primary)]">
                    Información Personal
                </h1>
            </div>

            {/* Detalle del beneficiario */}
            <div className="flex w-full items-start gap-2.5 pl-1.5 pr-2.5 py-0 relative">
                <h2 className="font-semibold text-[#6c886e] text-xl dark:text-[var(--primary)]">
                    Detalle del beneficiario
                </h2>
            </div>

            {/* Formulario: pasamos todo el objeto 'form' */}
            <Form<PurchaseFormValues> {...form}>
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
                    {/* Fila 1: Tipo, Número, Fecha */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-3 md:gap-y-5">
                        {/* Tipo de documento */}
                        <FormField
                            control={control}
                            name="documentType"
                            render={({ field, fieldState }) => {
                                const hasError = !!fieldState.error;
                                return (
                                    <FormItem className="-space-y-1">
                                        <FormLabel className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}>
                                            Tipo de documento
                                        </FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger
                                                    className={`h-10 bg-white rounded-lg border px-2 w-full ${hasError ? "border-red-500" : "border-[#cccccc]"
                                                        }`}
                                                >
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dni">DNI</SelectItem>
                                                    <SelectItem value="passport">Pasaporte</SelectItem>
                                                    <SelectItem value="other">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />

                        {/* Número de documento */}
                        <FormField
                            control={control}
                            name="documentNumber"
                            render={({ field, fieldState }) => {
                                const hasError = Boolean(fieldState.error);
                                return (
                                    <FormItem className="-space-y-1">
                                        <FormLabel className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}>
                                            Número de documento
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-10 w-full bg-white rounded-lg border-[#cccccc]"
                                                placeholder="Número de documento"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />

                        {/* Fecha */}
                        <FormField
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="-space-y-1">
                                    <FormLabel className="font-normal text-base">Fecha</FormLabel>
                                    <FormControl>
                                        <Controller
                                            control={control}
                                            name="date"
                                            render={({ field: ctrlField }) => (
                                                <DateTimePicker
                                                    displayFormat={{ hour24: "dd/MM/yyyy" }}
                                                    value={ctrlField.value}
                                                    onChange={ctrlField.onChange}
                                                    locale={es}
                                                    granularity="day"
                                                    className={cn(
                                                        `h-10 w-full bg-white rounded-lg border pr-10 text-left font-normal ${errors.date
                                                            ? "border-red-500 dark:border-red-500"
                                                            : "border-[#cccccc] dark:border-[#cccccc]"
                                                        }`,
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                />
                                            )}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Fila 2: Nombres, Apellidos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 md:gap-y-5">
                        {/* Nombres */}
                        <FormField
                            control={control}
                            name="firstName"
                            render={({ field, fieldState }) => {
                                const hasError = Boolean(fieldState.error);
                                return (
                                    <FormItem className="-space-y-1 w-full">
                                        <FormLabel className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}>
                                            Nombres
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                placeholder="Nombres"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />

                        {/* Apellidos */}
                        <FormField
                            control={control}
                            name="lastName"
                            render={({ field, fieldState }) => {
                                const hasError = Boolean(fieldState.error);
                                return (
                                    <FormItem className="-space-y-1 w-full">
                                        <FormLabel className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}>
                                            Apellidos
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                placeholder="Apellidos"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />
                    </div>

                    <Separator className="w-[689px] h-px bg-[#bbbbbb]" />

                    {/* Información de Contacto */}
                    <div className="h-[22px] pl-1.5 pr-2.5 py-0 flex w-full items-start gap-2.5 relative">
                        <h2 className="font-semibold text-[#6c886e] text-xl dark:text-[var(--primary)]">
                            Información de Contacto
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 md:gap-y-5">
                        {/* Correo */}
                        <FormField
                            control={control}
                            name="contactEmail"
                            render={({ field, fieldState }) => {
                                const hasError = Boolean(fieldState.error);
                                return (
                                    <FormItem className="-space-y-1">
                                        <FormLabel className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}>
                                            Correo de contacto
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-10 w-full bg-white rounded-lg border-[#cccccc]"
                                                placeholder="Correo electrónico"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />

                        {/* Teléfono */}
                        <FormField
                            control={control}
                            name="contactPhone"
                            render={({ field, fieldState }) => {
                                const hasError = Boolean(fieldState.error);
                                return (
                                    <FormItem className="-space-y-1">
                                        <FormLabel className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}>
                                            Teléfono de contacto
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="h-10 w-full bg-white rounded-lg border-[#cccccc]"
                                                placeholder="Número de teléfono"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                );
                            }}
                        />
                    </div>

                    <Separator className="w-[689px] h-px bg-[#bbbbbb]" />

                    {/* Método de Pago */}
                    <div className="h-[22px] pl-1.5 pr-2.5 py-0 flex w-full items-start gap-2.5 relative">
                        <h2 className="font-semibold text-[#6c886e] text-xl dark:text-[var(--primary)]">Método de Pago</h2>
                    </div>

                    <div className="flex w-[690px] gap-2.5">
                        {/* ← Panel IZQUIERDO */}
                        <div className="w-1/2">
                            <Card className="rounded-lg border border-[#cccccc] dark:bg-[var(--color-gray-900)]">
                                <CardContent className="p-0 dark:bg-[var(--color-gray-900)]">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center justify-between p-4 w-full"
                                        onClick={() => setShowCardPanel((prev) => !prev)}
                                    >
                                        <div className="inline-flex items-center gap-3">
                                            <CreditCard className="w-8 h-8" />
                                            <span className="font-semibold text-[#142e38] dark:text-[var(--primary)]">
                                                {cardSaved ? `Tarjeta •••• ${last4}` : "Tarjeta de Débito / Crédito"}
                                            </span>
                                        </div>
                                        {showCardPanel ? (
                                            <ChevronLeft className="w-6 h-6" />
                                        ) : (
                                            <ChevronRight className="w-6 h-6" />
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* → Panel DERECHO: solo si showCardPanel es true */}
                        {showCardPanel && (
                            <div className="w-1/2">
                                <Card className="w-[328px] border-[#c5c6cc] dark:bg-[var(--color-gray-900)]">
                                    <CardContent className="p-4 flex flex-col gap-4">
                                        {/* Número de Tarjeta */}
                                        <FormField
                                            control={control}
                                            name="cardNumber"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2 w-full">
                                                    <FormLabel className="font-semibold text-[#142e38] dark:text-[var(--primary)]">
                                                        Número de Tarjeta
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className="h-12 px-4 rounded-[10px] border-neutral-300"
                                                            placeholder="xxxx xxxx xxxx xxxx"
                                                            maxLength={19}
                                                            {...field}
                                                            onChange={(e) => {
                                                                const nuevo = e.target.value;
                                                                field.onChange(e);
                                                                // Si cumple 16 dígitos o está vacío (para dejar que superRefine marque después), borramos mensaje:
                                                                if (/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(nuevo)) {
                                                                    clearErrors("cardNumber");
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    {errors.cardNumber && (
                                                        <p className="text-red-600 text-sm mt-1">{errors.cardNumber.message}</p>
                                                    )}
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex gap-4 w-full">
                                            {/* CVV */}

                                            <FormField
                                                control={control}
                                                name="cardCvv"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col gap-2 flex-1">
                                                        <FormLabel className="font-semibold text-[#142e38] dark:text-[var(--primary)]">
                                                            No. CVV/CVC
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                className="h-12 px-4 rounded-[10px] border-neutral-300"
                                                                placeholder="000"
                                                                maxLength={4}
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const nuevo = e.target.value;
                                                                    field.onChange(e);
                                                                    if (/^\d{3,4}$/.test(nuevo)) {
                                                                        clearErrors("cardCvv");
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        {errors.cardCvv && (
                                                            <p className="text-red-600 text-sm mt-1">{errors.cardCvv.message}</p>
                                                        )}
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Expiry */}
                                            <FormField
                                                control={control}
                                                name="cardExpiry"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col gap-2 flex-1">
                                                        <FormLabel className="font-semibold text-[#142e38] dark:text-[var(--primary)]">
                                                            Válido hasta
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                className="h-12 px-4 rounded-[10px] border-neutral-300"
                                                                placeholder="MM/YYYY"
                                                                maxLength={7}
                                                                {...field}
                                                                onChange={(e) => {
                                                                    const nuevo = e.target.value;
                                                                    field.onChange(e);
                                                                    if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(nuevo)) {
                                                                        clearErrors("cardExpiry");
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        {errors.cardExpiry && (
                                                            <p className="text-red-600 text-sm mt-1">{errors.cardExpiry.message}</p>
                                                        )}
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {/* Nombre en la tarjeta */}
                                        <FormField
                                            control={control}
                                            name="cardHolderName"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col gap-2 w-full">
                                                    <FormLabel className="font-semibold text-[#142e38] dark:text-[var(--primary)]">
                                                        Nombre
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className="h-12 px-4 rounded-[10px] border-neutral-300"
                                                            placeholder="Nombre en tarjeta"
                                                            {...field}
                                                            onChange={(e) => {
                                                                const nuevo = e.target.value;
                                                                field.onChange(e);
                                                                if (nuevo.trim().length > 0) {
                                                                    clearErrors("cardHolderName");
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    {errors.cardHolderName && (
                                                        <p className="text-red-600 text-sm mt-1">{errors.cardHolderName.message}</p>
                                                    )}
                                                </FormItem>
                                            )}
                                        />


                                        {/* Guardar Tarjeta */}
                                        <Button
                                            type="button"
                                            className="h-12 w-full bg-[var(--brand)] text-white font-bold rounded-lg"
                                            onClick={handleSaveCard}
                                        >
                                            Guardar Tarjeta
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    <Separator className="w-[689px] h-px bg-[#bbbbbb]" />

                    {/* Términos y condiciones */}
                    <div className="px-1.5 py-2.5 flex w-[719px] items-start gap-2.5 relative">
                        <FormField
                            control={control}
                            name="termsAccepted"
                            render={({ field }) => (
                                <FormItem className="inline-flex flex-col items-start gap-2.5 p-2.5 relative">
                                    <div className="flex w-[510px] items-start gap-2 relative">
                                        <FormControl>
                                            <Checkbox
                                                id="termsAccepted"
                                                className="w-6 h-6 border-1 dark:border-white rounded-sm"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <label
                                            htmlFor="termsAccepted"
                                            className="relative w-fit mt-[-1px] font-normal text-base leading-[22.4px]"
                                        >
                                            <span className="text-[#aaaaaa]">Para continuar debes aceptar{" "}</span>
                                            <span className="text-[var(--brand)] underline cursor-pointer">
                                                términos y condiciones
                                            </span>
                                        </label>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Ahora se muestra SOLO “otherErrors” (sin cardNumber, cardCvv, cardExpiry, cardHolderName) */}
                    <ErrorSummary messages={allErrors} />

                    {/* Botones de acción */}
                    <div className="flex w-[719px] items-center justify-center gap-[86px] px-1.5 py-2.5 relative">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !cardSaved}
                            className="w-[242px] rounded-lg text-white font-bold text-[13px] h-auto button3-custom"
                        >
                            {isSubmitting ? "Procesando..." : "Realizar compra"}
                        </Button>
                        <Button
                            type="button"
                            className="w-[242px] rounded-lg text-white font-bold text-[13px] h-auto button4-custom"
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Form>
        </Card>
    );
}
