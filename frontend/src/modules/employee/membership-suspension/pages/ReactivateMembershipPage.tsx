import React, { useState } from "react";
import ApplicationNavSection from "@/modules/employee/shared/components/ApplicationNavSection";
import SuspensionTabs from "../components/SuspensionTabs";
import ReactivateMembershipTable from "../components/ReactivateMembershipTable";

/* ────────── Página ────────── */
export default function ReactivateMembershipPage() {
  /* ➤ modo actual: "suspend" o "annul"  (se mantiene para reusar las pestañas) */
  const [action, setAction] = useState<"suspend" | "annul">("suspend");

  return (
    <div className="flex flex-col items-center px-[34px] py-[57px]">
      <ApplicationNavSection />
      {/* Pestañas */}
      <SuspensionTabs action={action} onChange={setAction} />

      {/* Tabla con barra de acciones */}
      <ReactivateMembershipTable />
    </div>
  );
}
