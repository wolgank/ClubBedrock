// src/modules/member/membership/components/FamilyCard.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DocumentsSection } from "./DocumentsSection";
import { useForm, FormProvider } from "react-hook-form";

interface DocumentFormat {
  id: number;
  name: string;
  description: string;
  isForInclusion: boolean; // true → inclusión | false → exclusión
  memberTypeForDocument: number;
}

export interface Familiar {
  id: string;
  name: string;
  relation: string;
  state: "APPROVED" | "PENDING" | "REJECTED" | null;
  submissionDate: string | null;
  isForInclusion: boolean;
  photoUrl?: string;
}

interface FamilyCardProps extends Familiar {
  /** Callback para que el padre refresque la lista cuando la exclusión fue exitosa */
  onExcluded?: (id: string) => void;
}

export function FamilyCard({
  id,
  photoUrl = "/images/default-avatar.png",
  name,
  relation,
  state,
  onExcluded,
}: FamilyCardProps) {
  const isPending = state === "PENDING";
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;

  /* ───────── formulario react‑hook‑form ───────── */
  const methods = useForm<{ dynamicFiles: Record<number, File> }>({
    defaultValues: { dynamicFiles: {} },
  });
  const { setValue, getValues } = methods;

  /* ───────── estado del diálogo ───────── */
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  /* ───────── member‑type y formatos ───────── */
  const [memberTypeId, setMemberTypeId] = useState<number | null>(null);
  const [documentFormats, setDocumentFormats] = useState<DocumentFormat[]>([]);

  /** Regresa los documentos marcados para exclusión */
  const exclusionFormats = documentFormats.filter((d) => !d.isForInclusion);

  /* ────────────────────────────────────────────── */
  /* Helpers                                       */
  /* ────────────────────────────────────────────── */

  /** Busca el ID del member‑type según el nombre aproximado */
  async function fetchMemberTypeId(nameLike: string): Promise<number | null> {
    try {
      const res = await fetch(
        `${backendUrl}/api/member-types/by-name-containing?nameLike=${encodeURIComponent(
          nameLike.trim()
        )}`,
        { credentials: "include" }
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { id?: number };
      return data?.id ?? null;
    } catch {
      return null;
    }
  }

  /** Sube un único archivo y devuelve fileName */
  async function uploadSingleFile(
    id: string,
    file: File
  ): Promise<{ id: string; fileName: string | null }> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${backendUrl}/files/uploadDoc`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { fileName } = await res.json();
      return { id, fileName };
    } catch (err) {
      console.error(err);
      return { id, fileName: null };
    }
  }

  /** Guarda archivos seleccionados en RHF */
  const handleDynamicFile = async (arr: { id: string; file: File }[]) => {
    const current = getValues("dynamicFiles") ?? {};
    const updated = { ...current };
    for (const { id, file } of arr) updated[Number(id)] = file;
    setValue("dynamicFiles", updated);
  };

  /* ────────────────────────────────────────────── */
  /* Effects                                       */
  /* ────────────────────────────────────────────── */

  /* Cada vez que se abre el modal buscamos el memberTypeId */
  useEffect(() => {
    if (open) {
      fetchMemberTypeId(relation).then(setMemberTypeId);
    } else {
      setMemberTypeId(null);
    }
  }, [open, relation]);

  /* Con el memberTypeId descargamos los formatos */
  useEffect(() => {
    if (!memberTypeId) {
      setDocumentFormats([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${backendUrl}/api/member-types/${memberTypeId}/document-formats`,
          { credentials: "include" }
        );
        if (res.ok) {
          setDocumentFormats(await res.json());
        }
      } catch (err) {
        console.error("Error cargando formatos:", err);
      }
    })();
  }, [backendUrl, memberTypeId]);

  /* ────────────────────────────────────────────── */
  /* Handler principal                             */
  /* ────────────────────────────────────────────── */

  async function handleExclude() {
    if (!reason.trim()) {
      toast.error("Debes ingresar un motivo.");
      return;
    }

    /* 1️⃣ Validar que estén todos los documentos requeridos */
    const values = getValues();
    const toUpload: { id: string; file: File }[] = [];
    const faltantes: string[] = [];

    for (const fmt of exclusionFormats) {
      const file = values.dynamicFiles?.[fmt.id];
      if (file instanceof File) toUpload.push({ id: fmt.id.toString(), file });
      else faltantes.push(fmt.name);
    }
    if (faltantes.length) {
      toast.error(`Faltan documentos:\n- ${faltantes.join("\n- ")}`);
      return;
    }

    /* 2️⃣ Crear la solicitud de exclusión */
    let memberRequestId: number | undefined;
    try {
      const res = await fetch(
        `${backendUrl}/api/member-requests/excludeFamiliar`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberToExclude: Number(id),
            reasonToExclude: reason.trim(),
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      memberRequestId = data.memberRequestId ?? data.id ?? data.requestId;
    } catch (err: any) {
      toast.error(err.message ?? "Error creando la solicitud");
      return;
    }

    /* 3️⃣ Subir los archivos */
    const uploaded = await Promise.all(
      toUpload.map(({ id, file }) => uploadSingleFile(id, file))
    );
    
    if (uploaded.some((u) => !u.fileName)) {
      toast.error("Algún archivo no se subió correctamente. Intenta nuevamente.");
      return;
    }

    /* 4️⃣ Asociar documentos a la solicitud */
    try {
      const res = await fetch(
        `${backendUrl}/api/member-requests/${memberRequestId}/documents`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documents: uploaded.map((u) => ({
              idDocumentFormat: Number(u.id),
              fileName: u.fileName,
            })),
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      toast.error("Solicitud creada, pero falló el registro de documentos.");
      return;
    }

    /* 5️⃣ Éxito */
    toast.success("Solicitud de exclusión creada correctamente.");
    setOpen(false);
    setReason("");
    onExcluded?.(id);
  }

  return (
    <>
      {/* Card */}
      <div
        className={`background-custom rounded-2xl p-6 flex flex-col items-center transition-opacity ${
          isPending ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <img
          src={photoUrl}
          alt={"Foto de "+ name}
          className="w-32 h-32 object-cover rounded-full mb-4"
        />

        <h3 className="text-xl font-semibold text-center">{name}</h3>
        <p className="text-center mb-1">{relation}</p>

        <p className="text-xs text-muted-foreground mb-4">
          {isPending ? "Solicitud pendiente" : "Solicitud aprobada"}
        </p>

        <Button
          variant="destructive"
          onClick={() => setOpen(true)}
          disabled={isPending}
        >
          Retirar
        </Button>
      </div>

      {/* Modal para ingresar el motivo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md background-custom">
          <DialogHeader className="text-[var(--brand)]">
            <DialogTitle>Motivo de la exclusión</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Describe brevemente el motivo (máx. 250 caracteres)"
            value={reason}
            maxLength={250}
            onChange={(e) => setReason(e.target.value)}
          />

          {/* Tipo de familiar + ID */}
          <p className="text-sm text-muted-foreground">
            Tipo de familiar:{" "}
            <span className="font-medium">{relation}</span>{" "}
            {memberTypeId !== null && (
              <span className="ml-1 text-xs text-muted-foreground">
                (ID: {memberTypeId})
              </span>
            )}
          </p>

            {/* Uploads */}
            <FormProvider {...methods}>
              <DocumentsSection
                titularFormats={exclusionFormats}   // ← sólo los de exclusión
                handleDynamicFile={handleDynamicFile}
              />
            </FormProvider>

          <DialogFooter className="gap-3 mt-6">
            <Button
              onClick={() => setOpen(false)}
              className="button4-custom text-[var(--text-light)]"
              type="button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExclude}
              className="button3-custom text-[var(--text-light)]"
              disabled={reason.trim().length === 0}
              type="button"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
