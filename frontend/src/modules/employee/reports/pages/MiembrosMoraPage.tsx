import { useEffect, useMemo, useState } from "react";
import ReportsNavSection       from "../components/ReportsNavSection";
import MoraSummaryGrid         from "../components/MoraSummaryGrid";
import MembersMoraTable, { MoraRow } from "../components/MembersMoraTable";
import ApplicationNavSection   from "../../shared/components/ApplicationNavSection";
import PageContainer           from "@/shared/components/RegistrationPage/PageContainer";

export default function MiembrosMoraPage() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [rows,   setRows]   = useState<MoraRow[]>([]);
  const [search, setSearch] = useState("");

  /* ───── carga inicial ───── */
  useEffect(() => {
    (async () => {
      const res  = await fetch(`${backendUrl}/api/members/moras`, {
        credentials: "include",
      });

      //console.log("a", res);
      if (!res.ok) {
        console.error("HTTP " + res.status);
        return;
      }
      const data = await res.json();

      /* ➜ añadimos un id calculado (necesario para la key y los checkboxes) */
      setRows(
        data.map((d: Omit<MoraRow, "id">) => ({
          ...d,
          id: `${d.membershipCode}-${d.billDueDate}`, // único por factura + sub
        }))
      );
    })();
  }, []);

  /* ───── filtrado ───── */
  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.lastname.toLowerCase().includes(q) ||
        r.membershipCode.toLowerCase().includes(q) ||
        r.subCode.toLowerCase().includes(q)
    );
  }, [rows, search]);

  /* ───── KPIs ───── */
  const stats = useMemo(
    () => ({
      totalMembers: rows.length,
      totalDebt   : rows.reduce((s, r) => s + r.totalAmount, 0),   // usa totalAmount
      avgMonths   : rows.length
        ? rows.reduce((s, r) => s + r.daysDelayed / 30, 0) / rows.length
        : 0,
    }),
    [rows]
  );

  return (
    <PageContainer className="!max-w-7xl">
      <ApplicationNavSection />

      {/* espacio reservado al sub-menú de reportes */}
      <div className="-mt-8 -mb-5">
        <ReportsNavSection />
      </div>

      {/* input nativo: no necesitas ningún componente extra */}
      <input
        type="text"
        placeholder="Buscar socio o código…"
        className="mb-6 w-80 rounded-lg border px-4 py-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <h1 className="text-3xl font-bold mb-6">Socios en Mora</h1>

      {/* <MoraSummaryGrid stats={stats} /> */}

      <MembersMoraTable data={filtered} selectable />
    </PageContainer>
  );
}
