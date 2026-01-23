import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* ──────────────  Tipos según la API real ─────────────────────────── */
interface ApiDetail {
  requestId: number;
  isForInclusion: boolean;
  requestingMemberId: number;
  requestingMemberSubCode: string;
  requestingMemberName: string;
  requestingMemberLastName: string;
  requestingMemberMembershipId: number;
  requestingMemberMembershipState: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  /* Datos del familiar (o miembro a excluir) */
  familiarDocumentType: "DNI" | "PASSPORT" | "CE";
  familiarDocumentId: string;
  familiarBirthDate: string;      // ISO
  familiarName: string;
  familiarLastName: string;
  memberTypeId: number;
  memberTypeName: string;         // HIJO, ESPOSO, ...
  reason: string;
  familiarEmail: string;
  familiarPhone: string;
  /* Metadatos */
  submissionDate: string;         // ISO
  requestState: "PENDING" | "APPROVED" | "REJECTED" | "REVIEWING";
}

interface DocFile {
  id: number;
  name: string;
  downloadUrl: string;
  /** Nombre del tipo de documento */
  docTypeName: string;
}

/* ──────────────  Utilidad ────────────────────────────────────────── */
const toDateOnly = (iso?: string) => (iso ? iso.split("T")[0] : "");

/* ──────────────  Componente  ─────────────────────────────────────── */
export default function FamilyInclusionDetail({ requestId }: { requestId: number }) {
  const [data, setData] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);

  /* ─────── Fetch detalle ─────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/member-requests/${requestId}/detail`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json: ApiDetail = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  /* ─────── Fetch documentos ─────── */
  useEffect(() => {
    (async () => {
      setLoadingDocs(true);
      setErrorDocs(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/member-requests/${requestId}/documents`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const raw = await res.json();
        const list = Array.isArray(raw) ? raw : raw.data;
        if (!Array.isArray(list)) throw new Error("Formato inesperado de documentos");
        setDocs(
          list.map((d: any) => ({
            id: d.id ?? d.documentId ?? d.uid,
            name: d.name ?? d.fileName ?? `Documento_${d.id}`,
            downloadUrl: d.fileUrl ?? d.downloadUrl ?? d.path ?? d.url ?? "#",
            docTypeName: d.format?.name ?? d.docTypeName ?? "Desconocido",
          })) as DocFile[],
        );
      } catch (err) {
        console.error(err);
        setErrorDocs((err as Error).message);
      } finally {
        setLoadingDocs(false);
      }
    })();
  }, [requestId]);

  /* ─────── Render ─────── */
  if (loading) return <div>Cargando detalle…</div>;
  if (error)   return <div className="text-red-600">Error: {error}</div>;
  if (!data)   return null;

  const fullMemberName = `${data.requestingMemberName} ${data.requestingMemberLastName}`;
  const fullFamiliarName = `${data.familiarName} ${data.familiarLastName}`;
  const membershipStateLabel =
    data.requestingMemberMembershipState === "ACTIVE"
      ? "Activa"
      : data.requestingMemberMembershipState === "SUSPENDED"
      ? "Suspendida"
      : "Inactiva";

  return (
    <div className="mb-2">
      <h2 className="text-2xl font-bold text-center text-[var(--brand-light)] mb-10">
        Detalle de Solicitud de {data.isForInclusion ? "Inclusión" : "Exclusión"} Familiar
      </h2>

      <div className="space-y-6">
        {/* 1) Socio solicitante */}
        <section>
          <h3 className="section-title mb-1">Información del Socio Solicitante</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nº Socio</Label>
              <Input readOnly value={data.requestingMemberSubCode} />
            </div>
            <div>
              <Label>Nombre del Socio</Label>
              <Input readOnly value={fullMemberName} />
            </div>
            <div>
              <Label>Estado de Membresía</Label>
              <Input readOnly value={membershipStateLabel} />
            </div>
          </div>
        </section>

        {/* 2) Datos del familiar */}
        <section>
          <h3 className="section-title mb-1">Datos del Familiar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Tipo de documento</Label>
              <Select disabled defaultValue={data.familiarDocumentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                  <SelectItem value="CE">Carné de extranjería</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de documento</Label>
              <Input readOnly value={data.familiarDocumentId} />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input readOnly type="date" value={toDateOnly(data.familiarBirthDate)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombres</Label>
              <Input readOnly value={data.familiarName} />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input readOnly value={data.familiarLastName} />
            </div>
          </div>
        </section>

        {/* 3) Vínculo y razón */}
        <section>
          <h3 className="section-title mb-1">Tipo de vínculo · Razón</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tipo de vínculo</Label>
              <Input readOnly value={data.memberTypeName} />
            </div>
            <div>
              <Label>Razón</Label>
              <Input readOnly value={data.reason} />
            </div>
          </div>
        </section>

        {/* 4) Contacto */}
        <section>
          <h3 className="section-title mb-1">Contacto del familiar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Correo</Label>
              <Input readOnly type="email" value={data.familiarEmail} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input readOnly value={data.familiarPhone} />
            </div>
          </div>
        </section>

        {/* 5) Documentos */}
        <section>
          <h3 className="section-title mb-1">Documentos adjuntos</h3>
          {loadingDocs && <p>Cargando documentos…</p>}
          {errorDocs   && <p className="text-red-600">Error: {errorDocs}</p>}
          {!loadingDocs && !errorDocs && (
            docs.length === 0 ? (
              <p>No hay documentos adjuntos.</p>
            ) : (
              <ul className="list-disc list-inside space-y-2">
                {docs.map(d => (
                  <li key={d.id}>
                    <span className="font-semibold">{d.docTypeName}:</span>{" "}
                    <a
                      href={d.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--brand-dark)] underline hover:opacity-80"
                    >
                      {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>

        {/* 6) Información de la solicitud */}
        <section>
          <h3 className="section-title mb-1">Información de la solicitud</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>ID de solicitud</Label>
              <Input readOnly value={String(data.requestId)} />
            </div>
            <div>
              <Label>Fecha de solicitud</Label>
              <Input readOnly type="date" value={toDateOnly(data.submissionDate)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input readOnly value={
                data.requestState === "PENDING"
                  ? "Pendiente"
                  : data.requestState === "APPROVED"
                  ? "Aprobada"
                  : data.requestState === "REJECTED"
                  ? "Rechazada"
                  : "En revisión"
              } />
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}

/* ─────── Clase util para títulos ─────── */
/* Añádela a tu Tailwind config o manténla aquí */
const titleClass = "text-lg font-semibold mb-4 text-[var(--brand-dark)]";
declare module "react" {
  interface Attributes { className?: string; }
}
/* eslint-disable-next-line react/display-name */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className={titleClass}>{children}</h3>
);
export { titleClass as "section-title" };
