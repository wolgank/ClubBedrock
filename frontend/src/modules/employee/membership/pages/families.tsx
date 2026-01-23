// src/modules/employee/membership/pages/families.tsx
import ApplicationNavSection from "../../shared/components/ApplicationNavSection"
import Tabs from "../components/Tabs"
import FamiliesTable from "../components/FamiliesTable"
import HelpAndSupportSection from "@/modules/employee/shared/components/HelpAndSupportSection"

export default function FamiliesPage() {
  return (
    <div className="flex flex-col items-center px-[34px] py-[57px]">
      {/* 1. Navegación principal */}
      <ApplicationNavSection />

      {/* 2. Pestañas internas */}
      <div className="w-full max-w-[1339px] mt-3">
        <Tabs />
      </div>

      {/* 3. Título y tabla */}
      <h1 className="w-full max-w-[1339px] text-4xl font-bold my-8">
        Gestión de Familiares
      </h1>
      <section className="w-full max-w-[1339px] p-6 rounded-2xl background-custom">
        <FamiliesTable />
      </section>

    </div>
  )
}
