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

/* ──────────────  Tipos  ─────────────────────────────────────────────── */
interface Recommendation {
  subCodeInserted: string;
  namesAndLastNamesInserted: string;
}

interface Partner {
  documentType: string;
  documentId: string;
  fullName: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
}

interface ApiDetail {
  applicationId: number;
  requestDate: string;
  applicant: {
    documentType: string;
    documentId: string;
    fullName: string;
    birthDate: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  jobInfo: string;
  recommendations: Recommendation[];
  partner?: Partner;
}

/** Documentos asociados a la solicitud */
interface DocFile {
  id: number;
  /** Nombre legible */
  name: string;
  /** URL absoluta para descargar / ver */
  downloadUrl: string;
  /** Nombre del tipo de documento */
  docTypeName: string;
}

/* ──────────────  Componente  ───────────────────────────────────────── */
export default function RequestDetailForm({
  requestId,
  onLoaded = () => {},
}: {
  requestId: number;
  onLoaded: (correo: string) => void;
}) {
  const [data, setData] = useState<ApiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);

  /** Devuelve solo la parte AAAA-MM-DD de un ISO date  */
  const toDateOnly = (iso?: string) => (iso ? iso.split("T")[0] : "");

  /** Adapta la forma de partner (info/contact) al esquema plano */
  const adaptPartner = (rawPartner: any): Partner | undefined => {
    if (!rawPartner) return undefined;
    return {
      documentType: rawPartner.info?.documentType ?? "",
      documentId: rawPartner.info?.documentId ?? "",
      fullName: rawPartner.info?.fullName ?? "",
      birthDate: rawPartner.info?.birthDate ?? "",
      email: rawPartner.contact?.email ?? "",
      phone: rawPartner.contact?.phone ?? "",
      address: rawPartner.contact?.address ?? "",
    };
  };

  /* ──────────────  Fetch detalle de solicitud  ─────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/membership-applications/${requestId}/detail`,
          { method: "GET", credentials: "include" },
        );

        const text = await res.text();
        if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
          throw new Error("La respuesta no es JSON puro");
        }

        /** Parseo bruto y adaptación de partner */
        const raw: any = JSON.parse(text);
        const json: ApiDetail = {
          ...raw,
          partner: adaptPartner(raw.partner),
        };

        setData(json);
        onLoaded(json.contact.email);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Ocurrió un error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  /* ──────────────  Fetch documentos asociados ──────────────────────── */
  useEffect(() => {
    (async () => {
      setLoadingDocs(true);
      setErrorDocs(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/member-requests/${requestId}/documents`,
          { method: "GET", credentials: "include" },
        );

        const rawJson = await res.json();
        //console.log("[DOCS] json:", rawJson);
        // # Backend se espera devuelva id, name y url o ruta -> adaptamos
        // La API puede devolver { message: "...", data: [...] } o directamente [...]
        const list = Array.isArray(rawJson) ? rawJson : rawJson.data;

        if (!Array.isArray(list)) {
          throw new Error("La API no devolvió un array de documentos");
        }

        const mapped: DocFile[] = list.map((d: any) => ({
          id: d.id ?? d.documentId ?? d.uid,
          name: d.name ?? d.fileName ?? `Documento_${d.id}`,
          downloadUrl: d.fileUrl ?? d.downloadUrl ?? d.path ?? "#",
          docTypeName: d.format?.name ?? d.docTypeName ?? "Desconocido",
        }));
        setDocs(mapped);
      } catch (err) {
        console.error(err);
        setErrorDocs(
          err instanceof Error ? err.message : "Ocurrió un error desconocido al cargar documentos",
        );
      } finally {
        setLoadingDocs(false);
      }
    })();
  }, [requestId]);

  /* ──────────────  Render  ─────────────────────────────────────────── */
  if (loading) return <div>Cargando detalle…</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* 1) Solicitante */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">
          Información del Solicitante
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label>Tipo de documento</Label>
            <Select disabled defaultValue={data.applicant.documentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                <SelectItem value="CE">Carné de extranjería</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Número de documento</Label>
            <Input readOnly value={data.applicant.documentId} />
          </div>
          <div>
            <Label>Fecha de nacimiento</Label>
            <Input readOnly type="date" value={toDateOnly(data.applicant.birthDate)} />
          </div>
        </div>

        <div>
          <Label>Nombre completo</Label>
          <Input readOnly value={data.applicant.fullName} />
        </div>
      </section>

      {/* 2) Contacto */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">
          Información de contacto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Correo</Label>
            <Input readOnly type="email" value={data.contact.email} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input readOnly value={data.contact.phone} />
          </div>
        </div>

        <Label>Dirección</Label>
        <Input readOnly value={data.contact.address} />
      </section>

      {/* 3) Trabajo */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">Información laboral</h3>
        <Input readOnly value={data.jobInfo} />
      </section>

      {/* 4) Referencias */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">Referencias</h3>
        <div className="space-y-3">
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Sub-code #{idx + 1}</Label>
                <Input readOnly value={rec.subCodeInserted} />
              </div>
              <div>
                <Label>Nombres y apellidos #{idx + 1}</Label>
                <Input readOnly value={rec.namesAndLastNamesInserted} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5) Cónyuge */}
      {data.partner && (
        <section>
          <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">
            Información de cónyuge
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Tipo documento</Label>
              <Select disabled defaultValue={data.partner.documentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                  <SelectItem value="CE">Carné de extranjería</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de documento</Label>
              <Input readOnly value={data.partner.documentId} />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input readOnly type="date" value={toDateOnly(data.partner.birthDate)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Nombre completo</Label>
              <Input readOnly value={data.partner.fullName} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input readOnly value={data.partner.phone} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Correo</Label>
              <Input readOnly type="email" value={data.partner.email} />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input readOnly value={data.partner.address} />
            </div>
          </div>
        </section>
      )}

      {/* 6) Metadatos */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">
          Información de la solicitud
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>ID de solicitud</Label>
            <Input readOnly value={String(data.applicationId)} />
          </div>
          <div>
            <Label>Fecha de solicitud</Label>
            <Input readOnly type="date" value={toDateOnly(data.requestDate)} />
          </div>
        </div>
      </section>

      {/* 7) Documentos adjuntos */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-[var(--brand-light)]">Documentos</h3>

        {loadingDocs && <div>Cargando documentos…</div>}
        {errorDocs && <div className="text-red-600">Error: {errorDocs}</div>}

        {!loadingDocs && !errorDocs && (
          docs.length === 0 ? (
            <p>No hay documentos cargados para esta solicitud.</p>
          ) : (
            <ul className="list-disc list-inside space-y-2">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <span className="font-semibold">{doc.docTypeName}:</span>{" "}
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--brand-dark)] underline hover:opacity-80"
                  >
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          )
        )}
      </section>
    </div>
  );
}
