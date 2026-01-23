import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import React, { useRef, useState } from "react";
import { NumericFormat } from "react-number-format";
import MensajeDeAviso from "./CreateSpaceModal";
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod"
import { toast } from "sonner"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination"
import { Switch } from "@/components/ui/switch"

export type Space = {
    id: number;
    name: string;
};

const data: Space[] = [
    { id: 1, name: "SPORTS" },
    { id: 2, name: "LEISURE" },
]

const eventSchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    reference: z.string().nonempty({ message: "La referencia es obligatoria." }),
    capacity: z.coerce
        .number({ required_error: "La capacidad es obligatoria." })
        .min(1, { message: "La capacidad debe ser al menos 1." }),
    description: z.string().nonempty({ message: "La descripción es obligatoria." }),
    isReservable: z.boolean(),
    spaceType: z.string().nonempty({ message: "Selecciona un tipo de espacio." }),
})

type EventFormValues = z.infer<typeof eventSchema>

function getAllErrorMessages(errors: Record<string, any>): string[] {
    return Object.values(errors).flatMap((err: any) => {
        if (err.types) {
            // En modo 'all', `types` agrupa mensajes
            return Object.values(err.types) as string[]
        }
        if (err.message) {
            return [err.message]
        }
        // para estructuras anidadas (e.g. arrays, objetos)
        return getAllErrorMessages(err)
    })
}

function ErrorSummary({ messages }: { messages: string[] }) {
    if (messages.length === 0) return null
    return (
        <div className="border border-red-500 bg-red-100 p-4 rounded-md mt-2">
            <p className="font-semibold text-red-700 mb-2">Por favor corrige los siguientes errores:</p>
            <ul className="list-disc list-inside text-red-600 space-y-1">
                {messages.map((msg, idx) => <li key={idx}>{msg}</li>)}
            </ul>
        </div>
    )
}


export default function AcademyFormSection() {
    // Form field data
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showModal, setShowModal] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);


    const navigate = useNavigate();


    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewURL = URL.createObjectURL(file);
        setImageSrc(previewURL);

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsSubmitting(true)
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/files/upload`, {
                method: "POST",
                body: formData,
                credentials: 'include',
            });

            if (!response.ok) throw new Error("Error al subir el archivo");

            const result = await response.json();
            //console.log("Archivo subido correctamente:", result);
            setUploadedUrl(result.fileName);
            //console.log("Archivo subido correctamente, numeritos:", result.fileName);

        } catch (error) {
            console.error("Fallo en la subida:", error);
        }
        finally{
            setIsSubmitting(false)
        }
    };



    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        criteriaMode: 'all',
        mode: 'onSubmit',
        defaultValues: {
            name: "",
            reference: "",
            capacity: undefined,
            description: "",
            isReservable: true,
            spaceType: "LEISURE",
        },

    })

    const { control, formState, } = form


    const allErrors = getAllErrorMessages(formState.errors)
    const { formState: { errors } } = form;

    const openModal = () => {
        setShowModal(true);
    };

    const closeSuccess = () => {
        setShowModal(false);
        navigate("/employee-event/espacios");
    };
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (values: EventFormValues) => {
        setIsSubmitting(true);
        try {

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/space/create`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: values.name,
                    type: values.spaceType,
                    capacity: values.capacity,
                    urlImage: uploadedUrl,
                    costPerHour: "0",
                    isAvailable: true,
                    description: values.description,
                    reference: values.reference,
                    canBeReserved: values.isReservable,
                })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocido");
            }
            openModal();
            toast.success(
                <>
                    <strong>Espacio creado correctamente.</strong>
                </>
            );
        }
        catch (error) {
            console.error("Error al guardar el curso:", error);
            toast.error(
                <>
                    <strong>Error al crear el espacio.</strong>
                    <div>{error?.message || "Error desconocido"}</div>
                </>
            );
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        // flex flex-col items-center gap-2.5 flex-1
        <div className=" flex flex-col lg:flex-row gap-8 w-full items-center">
            {/* Image upload section */}
            <CardContent className="flex flex-col items-center justify-center gap-2.5 gap-y-5 md:w-1/2">
                {/* Preview */}
                <AspectRatio ratio={16 / 9} className="w-full bg-muted rounded-lg overflow-hidden">
                    <img
                        src={imageSrc ?? `${import.meta.env.VITE_BACKEND_URL_MEDIA}/preview.jpg`}
                        alt="Event preview"
                        className="h-full w-full object-cover"
                    />
                </AspectRatio>

                {/* Botón que abre el file picker */}
                <Button
                    variant="outline"
                    className="w-[242px] h-[43px]  text-white font-bold border-0 rounded-lg   button4-custom"
                    onClick={triggerFileSelect}
                >
                    Adjuntar Imagen
                </Button>

                {/* Input oculto */}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </CardContent>
            {/* Form fields section */}
            <CardContent className="flex flex-wrap  md:w-1/2 ">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">
                            {/* Nombre */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field, fieldState }) => {
                                    const hasError = Boolean(fieldState.error);
                                    return (
                                        <FormItem className="-space-y-1 ">
                                            <FormLabel
                                                htmlFor="name"
                                                // Solo la etiqueta se tiñe de rojo cuando hay error
                                                className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                            >
                                                Nombre
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="name"
                                                    placeholder="Nombre"
                                                    // borde normal incluso si hay error
                                                    className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Referencia */}
                            <FormField
                                control={form.control}
                                name="reference"
                                render={({ field, fieldState }) => {
                                    const hasError = Boolean(fieldState.error);
                                    return (
                                        <FormItem className="-space-y-1 ">
                                            <FormLabel
                                                htmlFor="reference"
                                                className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                            >
                                                Referencia
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="reference"
                                                    placeholder="Referencia"
                                                    className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Espacio */}
                            <FormField
                                control={form.control}
                                name="spaceType"
                                render={({ field, fieldState }) => {
                                    const hasError = !!fieldState.error
                                    return (
                                        <FormItem className="-space-y-1">
                                            <FormLabel
                                                htmlFor="spaceType"
                                                className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                            >
                                                Tipo de espacio
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger
                                                        id="spaceType"
                                                        value="SPORTS"
                                                        disabled
                                                        className={`h-10 w-full bg-white rounded-lg border px-2  ${hasError ? "border-red-500" : "border-[#cccccc]"}`}
                                                    >
                                                        <SelectValue placeholder="Seleccionar espacio" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {data.map((space) => (
                                                            <SelectItem key={space.id} value={space.name}>
                                                                {space.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FormItem>
                                    )
                                }}
                            />


                            {/* Capacidad */}
                            <FormField
                                control={form.control}
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1">
                                        <FormLabel htmlFor="capacity" className="font-normal text-base">
                                            Capacidad
                                        </FormLabel>
                                        <FormControl>
                                            <Input id="capacity" type="number" placeholder="Capacidad" {...field} className="h-10 bg-white rounded-lg border-[#cccccc]" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="isReservable"            // nuevo campo booleano en tu schema
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 mb-0">
                                        <FormLabel className="font-normal text-base m-0">
                                            ¿Reservable?
                                        </FormLabel>
                                        <FormControl>
                                            <Switch
                                                id="isReservable"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="h-6 w-14 data-[state=checked]:bg-[#318161] [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-8"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>


                        <div className="flex flex-col gap-y-3 md:gap-y-4">
                            {/* Descripción */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1 w-full mt-6">
                                        <FormLabel htmlFor="description" className="font-normal text-base">
                                            Descripción
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea id="description" {...field} maxLength={200} className="h-25 bg-white rounded-lg border-[#cccccc] break-all" />
                                        </FormControl>
                                        <p className="text-sm text-muted-foreground text-right">
                                            {field.value.length}/200
                                        </p>
                                    </FormItem>
                                )}
                            />
                            <ErrorSummary messages={allErrors} />
                            {/* Botón Acción */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center w-full">
                                <Button
                                    disabled={isSubmitting}
                                    type="submit" className="h-[43px] bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom" >
                                    {isSubmitting ? "Creando..." : "Crear nuevo espacio"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeSuccess}>
                    <MensajeDeAviso onClose={closeSuccess} />
                </div>
            )}
        </div>
    );
}