// src/modules/employee/membership-suspension/components/SocioSearchModal.tsx
import { useEffect, useState } from "react";
import {
  Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell,
} from "@/components/ui/table";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Member {
  membershipId: number;    // <-- aquí guardamos el ID numérico
  subCode:     string;
  fullName:    string;
  documentType: string;
  documentId:  string;
  email:       string;
}

interface SearchForm {
  apellido1: string;
  nombres:   string;
  codigo:    string;
  correo:    string;
  docTipo:   string;
  docNum:    string;
}

export default function SocioSearchModal({
  params,
  onClose,
  onSelect,
}: {
  params:   SearchForm;
  onClose:  () => void;
  onSelect: (m: Member) => void;
}) {
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        
        const q = new URLSearchParams();
        if (params.apellido1) q.set("lastname",      params.apellido1);
        if (params.nombres)    q.set("name",          params.nombres);
        if (params.codigo)     q.set("subCode",       params.codigo);
        if (params.correo)     q.set("email",         params.correo);
        if (params.docTipo)    q.set("documentType",  params.docTipo);
        if (params.docNum)     q.set("documentId",    params.docNum);
        
        const res = await fetch(`${backendUrl}/api/members/search/titular?${q.toString()}`, {
          method: "GET",
          credentials: "include", // ← muy importante para enviar la cookie
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // la API responde algo así:
        // [{
        //   "membershipId":"4",
        //   "subCode":"CLUB-20250510-000123-X7F4-M001",
        //   "fullName":"Ana García",
        //   …  
        // }]
        const json = await res.json();
        type MemberApiResponse = {
          membershipId: string | number;
          subCode: string;
          fullName: string;
          documentType: string;
          documentId: string;
          email: string;
        };
        const members: Member[] = (json as MemberApiResponse[]).map((m) => ({
          membershipId: Number(m.membershipId),  // <-- parseamos
          subCode:      m.subCode,
          fullName:     m.fullName,
          documentType: m.documentType,
          documentId:   m.documentId,
          email:        m.email,
        }));
        setResults(members);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="background-custom rounded-2xl w-full max-w-4xl overflow-hidden">
        <header className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Resultados de búsqueda de socios</h2>
        </header>
        <div className="p-6">
          {loading && <p>Cargando resultados…</p>}
          {error && <p className="text-red-600">Error: {error}</p>}

          {!loading && !error && (
            /*           ↓↓↓ NUEVO contenedor scrollable ↓↓↓            */
            <div className="max-h-[70vh] overflow-y-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{m.fullName}</TableCell>
                      <TableCell>{m.subCode}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => onSelect(m)}
                          className="p-1 hover:text-green-600"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t text-right">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </footer>
      </div>
    </div>
  );
}
