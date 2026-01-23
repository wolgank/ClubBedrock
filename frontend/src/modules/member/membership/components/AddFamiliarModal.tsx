import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DocumentsSection } from "./DocumentsSection";
import { useForm, FormProvider } from "react-hook-form";
import { registrationPayloadSchema, formatZodErrors } from "../validation/RegistrationPayload";
import { ZodError } from "zod";

interface MemberType {
  id: number;
  name: string;
  inclusionCost: number;
}

interface DocumentFormat {
  id: number;
  name: string;
  description: string;
  isForInclusion: boolean;
  memberTypeForDocument: number;
}

interface AddFamiliarModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddFamiliarModal({
  open,
  onClose,
}: AddFamiliarModalProps) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [selectedMemberTypeId, setSelectedMemberTypeId] = useState<number | null>(null);
  const [documentFormats, setDocumentFormats] = useState<DocumentFormat[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    docType: "DNI",
    docNumber: "",
    birthDate: "",
    names: "",
    surnames: "",
    relationReason: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  const methods = useForm<{ dynamicFiles: Record<number, File> }>({
    defaultValues: {
      dynamicFiles: {}, // ✅ Importante: Inicializar como objeto vacío
    },
  });

  const { setValue, getValues } = methods;

  const selectedType = memberTypes.find((m) => m.id === selectedMemberTypeId);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/member-types`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const list: MemberType[] = await res.json();
        const filtered = list.filter((m) => !m.name.toUpperCase().includes("TITULAR"));
        setMemberTypes(filtered);
      } catch (err) {
        console.error("Error cargando member-types", err);
      }
    })();
  }, [backendUrl]);

  useEffect(() => {
    if (!selectedMemberTypeId) return;
    (async () => {
      try {
        const res = await fetch(
          `${backendUrl}/api/member-types/${selectedMemberTypeId}/document-formats`,
          { credentials: "include" }
        );
        if (res.ok) {
          const docs = await res.json();
          const filteredDocs = docs.filter((d: DocumentFormat) => d.isForInclusion === true);
          setDocumentFormats(filteredDocs);
        }
      } catch (err) {
        console.error("Error cargando formatos", err);
      }
    })();
  }, [backendUrl, selectedMemberTypeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleDynamicFile = async (archivos: { id: string; file: File }[]) => {
    try {
      const currentFiles = getValues("dynamicFiles") || {};
      const updatedFiles = { ...currentFiles };

      for (const { id, file } of archivos) {
        if (!(file instanceof File)) {
          throw new Error(`Archivo inválido para ID "${id}"`);
        }
        updatedFiles[Number(id)] = file;
      }

      setValue("dynamicFiles", updatedFiles);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleClickEnviar = async () => {
    const values = getValues();
    const archivos: { id: string; file: File }[] = [];
    const archivosFaltantes: string[] = [];

    // Recolectar documentos requeridos del titular
    for (const fmt of documentFormats) {
      const file = values.dynamicFiles?.[fmt.id];
      if (file instanceof File) {
        archivos.push({ id: fmt.id.toString(), file });
      } else if (fmt.isForInclusion) {
        archivosFaltantes.push(fmt.name);
      }
    }

    if (archivosFaltantes.length > 0) {
      toast.error(`Faltan documentos requeridos:\n- ${archivosFaltantes.join("\n- ")}`);
      return;
    }

    try {
      // Subir archivos al backend
      if (handleDynamicFile) await handleDynamicFile(archivos);

      // Enviar datos del formulario
      await handleSubmit();
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al enviar la solicitud.");
    }
  };

  
const handleSubmit = async () => {
  console.log("[handleSubmit] Iniciando envío de datos...");
  toast.info("Procesando datos del formulario...");

  if (!selectedMemberTypeId) {
    const errorMessage = "Tipo de familiar no seleccionado";
    console.error("[handleSubmit] Error:", errorMessage);
    toast.error(errorMessage);
    return;
  }

  const {
    docType,
    docNumber,
    birthDate,
    names,
    surnames,
    email,
    username,
    password,
    phone,
    relationReason,
  } = form;

  // Validación manual previa
  const camposFaltantes = [
    { campo: docType, nombre: "Tipo de documento" },
    { campo: docNumber, nombre: "Número de documento" },
    { campo: birthDate, nombre: "Fecha de nacimiento" },
    { campo: names, nombre: "Nombres" },
    { campo: surnames, nombre: "Apellidos" },
    { campo: email, nombre: "Correo" },
    { campo: username, nombre: "Usuario" },
    { campo: password, nombre: "Contraseña" },
    { campo: relationReason, nombre: "Razón" },
  ].filter(({ campo }) => !campo);

  if (camposFaltantes.length > 0) {
    toast.error(
      "Completa los campos obligatorios:\n- " +
      camposFaltantes.map(c => c.nombre).join("\n- ")
    );
    return;
  }

  const data = getValues();

  // Preparar payload
  const payload = {
    documentType: docType,
    documentId: docNumber,
    birthDate,
    names,
    lastnames: surnames,
    memberTypeId: selectedMemberTypeId,
    email,
    username,
    password,
    phone,
    reason: relationReason,
  };

  let datos;
  try {
    const parsed = registrationPayloadSchema.parse(payload);

    const res = await fetch(`${backendUrl}/api/member-requests/new-familiar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error("Error en inscripción: " + (err.error || res.statusText));
    }

    datos = await res.json();
  } catch (err) {
    if (err instanceof ZodError) {
      toast.error("Errores de validación", {
        description: formatZodErrors(err.issues),
      });
    } else {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    }
    return;
  }


  // Validación y subida de archivos
  const fileUploads: Promise<{ id: string; fileName: string | null }>[] = [];

  for (const [id, file] of Object.entries(data.dynamicFiles ?? {})) {
    if (file) {//cambio
      fileUploads.push(uploadSingleFile(id, file, backendUrl));
    }
  }

  if (fileUploads.length === 0) {
    toast.error("No se han subido archivos. Por favor, suba los documentos requeridos.");
    return;
  }

  // nuevo ...
  const uploadedFiles = await Promise.all(fileUploads);
  // console.log("archivos que se intentaron subir:", uploadedFiles);
  if(uploadedFiles.some(file => file.fileName === null)) {
    toast.error("Algunos archivos no se pudieron subir. Por favor, inténtelo de nuevo.");
    return;
  }
  // nuevo...

  // antiguo...
  // let uploadedFiles: { id: string; fileName: string | null }[];
  // try {
  //   uploadedFiles = await Promise.all(fileUploads);
  // } catch (uploadErr) {
  //   console.error("Error al subir archivos:", uploadErr);
  //   toast.error("Ocurrió un error al subir los archivos. Intenta nuevamente.");
  //   return;
  // }

  // if (uploadedFiles.some(f => !f.fileName)) {
  //   toast.error("Algunos archivos no se subieron correctamente.");
  //   return;
  // }

  // Enviar documentos
  try {
    const payloadDoc = {
      documents: uploadedFiles.map(doc => ({
        idDocumentFormat: Number(doc.id),
        fileName: doc.fileName,
      })),
    };

    const resDoc = await fetch(
      `${backendUrl}/api/member-requests/${datos.memberRequestId}/documents`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadDoc),
      }
    );

    if (!resDoc.ok) {
      const errorText = await resDoc.text();
      throw new Error(errorText || `Error ${resDoc.status}`);
    }

    toast.success("Familiar registrado correctamente");
    onClose(); // cierre de modal o redirección
  } catch (err) {
    console.error("Error al registrar documentos:", err);
    toast.error("El familiar fue registrado, pero hubo un error al guardar los documentos.");
  }
};

const uploadSingleFile = async (
  id: string,
  file: File,
  backendUrl: string
): Promise<{ id: string; fileName: string | null }> => {
  console.log(`[uploadSingleFile] Subiendo archivo ${id}:`, file.name);
  toast.info(`Subiendo archivo: ${file.name}`);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${backendUrl}/files/uploadDoc`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    console.log(`[uploadSingleFile] Respuesta para ${id}, status:`, res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[uploadSingleFile] Error subiendo ${id}:`, errorText);
      throw new Error(errorText || `Error HTTP ${res.status}`);
    }

    const result = await res.json();
    console.log(`[uploadSingleFile] Archivo ${id} subido:`, result);
    return { id, fileName: result.fileName };
    
  } catch (err) {
    console.error(`[uploadSingleFile] Falló la subida (${id}):`, err);
    toast.error(`Error al subir archivo ${file.name}`);
    return { id, fileName: null };
  }
};


  /* ---------- reemplaza TODO tu return() por este ---------- */
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="z-50 mt-10 w-[90vw] max-w-5xl rounded-xl p-8 background-custom"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[var(--brand)] mb-4">
          Solicitud de Inclusión de Familiares
        </h2>

        <p className="text-sm text-muted-foreground mb-6">
          Se cobrará S/.{" "}
          {selectedType?.inclusionCost
            ? selectedType.inclusionCost.toFixed(2)
            : "X.XX"}
        </p>

        {/* Campos personales */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="flex items-center">
              Tipo de documento<span className="text-red-500">*</span>
              {errors.docType && <span className="ml-2 text-xs text-red-500">{errors.docType}</span>}
            </label>
            <Select
              value={form.docType}
              onValueChange={(v) => setForm((f) => ({ ...f, docType: v }))}
            >
              <SelectTrigger className={errors.docType ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent className="z-[70]">
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                <SelectItem value="CE">Carnet de Extranjería</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="flex items-center">
              Número de documento<span className="text-red-500">*</span>
              {errors.docNumber && <span className="ml-2 text-xs text-red-500">{errors.docNumber}</span>}
            </label>
            <Input
              name="docNumber"
              value={form.docNumber}
              onChange={handleChange}
              className={errors.docNumber ? "border-red-500" : ""}
            />
          </div>

          <div>
            <label className="flex items-center">
              Fecha de nacimiento<span className="text-red-500">*</span>
              {errors.birthDate && <span className="ml-2 text-xs text-red-500">{errors.birthDate}</span>}
            </label>
            <Input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className={errors.birthDate ? "border-red-500" : ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label>Nombres*</label>
            <Input name="names" value={form.names} onChange={handleChange} className="shadow-sm" />
          </div>
          <div>
            <label className="flex items-center">
              Apellidos<span className="text-red-500">*</span>
              {errors.surnames && <span className="ml-2 text-xs text-red-500">{errors.surnames}</span>}
            </label>
            <Input
              name="surnames"
              value={form.surnames}
              onChange={handleChange}
              className={errors.surnames ? "border-red-500" : ""}
            />
          </div>
        </div>

        {/* Tipo de familiar */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label className="flex items-center">
              Tipo de vínculo<span className="text-red-500">*</span>
              {errors.memberType && <span className="ml-2 text-xs text-red-500">{errors.memberType}</span>}
            </label>
            <Select
              value={selectedMemberTypeId?.toString() ?? ""}
              onValueChange={(v) => setSelectedMemberTypeId(Number(v))}
            >
              <SelectTrigger className={errors.memberType ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent className="z-[60]">
                {memberTypes.map((mt) => (
                  <SelectItem key={mt.id} value={mt.id.toString()}>
                    {mt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label>Correo del nuevo familiar*</label>
            <Input name="email" value={form.email} onChange={handleChange} className="shadow-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="flex items-center">
              RAZÓN de la solicitud<span className="text-red-500">*</span>
              {errors.relationReason && <span className="ml-2 text-xs text-red-500">{errors.relationReason}</span>}
            </label>
            <Input
              name="relationReason"
              value={form.relationReason}
              onChange={handleChange}
              className={errors.relationReason ? "border-red-500" : ""}
            />
          </div>
          <div>
            <label>Teléfono de contacto*</label>
            <Input name="phone" value={form.phone} onChange={handleChange} className="shadow-sm" />
          </div>
        </div>

        {/* Documentos */}
        <div className="mt-6">
          <FormProvider {...methods}>
            <DocumentsSection
              titularFormats={documentFormats.filter((d) => d.isForInclusion)}
              handleDynamicFile={handleDynamicFile}
            />
          </FormProvider>
          {errors.documents && (
            <p className="mt-2 text-sm text-red-500">{errors.documents}</p>
          )}
        </div>

        {/* Credenciales */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label>Usuario del nuevo familiar*</label>
            <Input name="username" value={form.username} onChange={handleChange} className="shadow-sm" />
          </div>
          <div>
            <label className="flex items-center">
              Contraseña del nuevo familiar<span className="text-red-500">*</span>
              {errors.password && <span className="ml-2 text-xs text-red-500">{errors.password}</span>}
            </label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "border-red-500" : ""}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-4">
          <Button onClick={onClose} className="button4-custom text-[var(--text-light)]">
            Cancelar
          </Button>
          <Button onClick={handleClickEnviar} className="button3-custom text-[var(--text-light)]">
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}