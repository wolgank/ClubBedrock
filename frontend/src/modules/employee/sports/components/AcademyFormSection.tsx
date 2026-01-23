import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import React, { useRef, useState, useMemo } from "react";
import MensajeDeAviso from "./CreateAcademyModal";
import { useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"


import { useQuery } from "@tanstack/react-query";
import { getSpace } from "@/lib/api/apiSpace";

export type SpaceData = {
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

import { z } from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationLink,
    PaginationNext,
} from "@/components/ui/pagination";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";



export const AcademySchema = z.object({
    name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
    deporte: z.string().min(2, { message: "El deporte debe tener al menos 2 caracteres." }),
    description: z.string().nonempty({ message: "La descripción es obligatoria." }),
    urlImage: z.string().optional(),
})




export type AcademyFormValues = z.infer<typeof AcademySchema>



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

    const { isLoading, data } = useQuery({
        queryKey: ['get-all-space'],
        queryFn: () => getSpace(),
    });

    // Form field data
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const navigate = useNavigate();

    const form = useForm<AcademyFormValues>({
        resolver: zodResolver(AcademySchema),
        criteriaMode: 'all',
        mode: 'onSubmit',
        defaultValues: {
            name: "",
            deporte: "",
            description: "",
        },
    })

    const { formState, control, handleSubmit } = form;
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    // 4. Funciones de carga de imagen
    const triggerFileSelect = () => fileInputRef.current?.click();
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


    // 6. Efecto para limpiar errores de cursos si ya hay cursos cargados

    const allErrors = getAllErrorMessages(formState.errors)
    const { formState: { errors } } = form;

    // 5. Handlers del modal “Éxito” de creación de academia
    const openSuccessModal = () => setShowSuccessModal(true);
    const closeSuccessModal = () => {
        setShowSuccessModal(false);
        navigate("/employee-sport/academias");
    };
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmitAcademy = async (values: AcademyFormValues) => {
        setIsSubmitting(true);
        //console.log("Datos de Academia:", values);
        const updatedValues = {
            ...values,
            sport: values.deporte,
            urlImage: uploadedUrl, // aquí pones el valor que quieres asignar
            isActive: true,
        };
        //console.log(uploadedUrl);
        try {
            //console.log("Enviando datos de la academia al backend:", updatedValues);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academy/createAcademySolo`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    academy: updatedValues
                })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null); // <- muy importante
                throw new Error(errorData?.message || "Error desconocido");
            }
            toast.success(
                <>
                    <strong>Academia creada correctamente.</strong>
                </>
            );
            openSuccessModal();
        }
        catch (error) {
            console.error("Error al guardar el curso:", error);
            toast.error(
                <>
                    <strong>Error al crear academia.</strong>
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
        <div className=" flex flex-col lg:flex-row gap-8 w-full">
            {/* Image upload section */}
            <CardContent className="flex flex-col items-center justify-center gap-2.5 md:w-1/2">
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
            <CardContent className="flex flex-wrap md:w-1/2 w-full justify-center ">
                <Form {...form} >
                    <form onSubmit={form.handleSubmit(onSubmitAcademy)} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 md:gap-x-20 gap-y-3 md:gap-y-5 w-full">
                            {/* Nombre */}
                            <FormField
                                control={form.control}
                                name="name"

                                render={({ field, fieldState }) => {
                                    const hasError = Boolean(fieldState.error);
                                    return (
                                        <FormItem className="-space-y-1 w-full ">
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
                            <FormField
                                control={form.control}
                                name="deporte"

                                render={({ field, fieldState }) => {
                                    const hasError = Boolean(fieldState.error);
                                    return (
                                        <FormItem className="-space-y-1 w-full">
                                            <FormLabel
                                                htmlFor="deporte"
                                                // Solo la etiqueta se tiñe de rojo cuando hay error
                                                className={`font-normal text-base ${hasError ? "text-red-500" : ""}`}
                                            >
                                                Deporte
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="deporte"
                                                    placeholder="Deporte"
                                                    // borde normal incluso si hay error
                                                    className="h-10 bg-white rounded-lg border-[#cccccc]"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>


                        <div className="flex flex-col gap-y-3 md:gap-y-4 w-full">
                            {/* Descripción Academia*/}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="-space-y-1 w-full mt-6">
                                        <FormLabel htmlFor="description" className="font-normal text-base">
                                            Descripción
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea id="description" {...field} maxLength={200} className="w-full h-25 bg-white rounded-lg border-[#cccccc] break-all" />
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
                                <Button type="submit" disabled={isSubmitting} className="h-[43px] bg-[var(--brand)] text-white font-bold rounded-lg border-0 button3-custom" >
                                    {isSubmitting ? "Creando..." : "Crear Nueva Academia"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>

            {/* Modal para crear curso */}
            {showSuccessModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={closeSuccessModal}
                >
                    <MensajeDeAviso onClose={closeSuccessModal} />
                </div>
            )}
        </div>
    );
}