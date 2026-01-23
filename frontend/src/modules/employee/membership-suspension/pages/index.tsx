// src/modules/employee/membership/pages/index.tsx
import React, { useState } from "react";
import ApplicationNavSection from "@/modules/employee/shared/components/ApplicationNavSection";
import SuspensionTabs from "../components/SuspensionTabs";
import SearchPanel from "../components/SearchPanel";
import SuspensionTable from "../components/SuspensionTable";


export default function SuspensionPage() {
  // ➤ modo actual: "suspend" o "annul"
  const [action, setAction] = useState<"suspend" | "annul">("suspend");

  return (
    <div className="flex flex-col items-center px-[34px] py-[57px]">
      <ApplicationNavSection />

      {/* ➤ pestañas para alternar acción */}
      <SuspensionTabs action={action} onChange={setAction} />

      {/* ➤ título dinámico */}
      <h1 className="w-full max-w-[1339px] text-4xl font-bold mt-6">
        {action === "annul" ? "Anulación de Membresía" : "Suspender Membresía"}
      </h1>

      {/* ➤ buscador */}
      <section className="w-full max-w-[1339px] p-[30px] rounded-2xl mt-6 background-custom">
        <SearchPanel action={action} />
      </section>

      {/* ➤ tabla de solicitudes */}
      <section className="w-full max-w-[1339px] mt-6">
        <SuspensionTable action={action} />
      </section>

    </div>
  );
}


