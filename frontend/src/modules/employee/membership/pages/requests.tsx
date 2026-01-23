// src/modules/employee/membership/pages/requests.tsx
import ApplicationNavSection from "../../shared/components/ApplicationNavSection";
import Tabs from "../components/Tabs";
import RequestTable from "../components/RequestTable";
import HelpAndSupportSection from "@/modules/employee/shared/components/HelpAndSupportSection";

export default function RequestsPage() {
  return (
    <div className="flex flex-col items-center px-[34px] py-[57px]">
      <ApplicationNavSection />

      {/* Pestañas internas */}
      <div className="w-full max-w-[1339px] mt-3">
        <Tabs />
      </div>

      <h1 className="w-full max-w-[1339px] text-4xl font-bold my-8">
        Solicitudes de Membresía
      </h1>
      <section className="w-full max-w-[1339px] p-6 rounded-2xl background-custom">
        <RequestTable />
      </section>


    </div>
  );
}
