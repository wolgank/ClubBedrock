  // src/modules/employee/membership/pages/dashboard.tsx
import ApplicationNavSection from "../../shared/components/ApplicationNavSection";
import HelpAndSupportSection from "@/modules/employee/shared/components/HelpAndSupportSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardActions from "../components/DashboardActions";


export default function MembershipDashboardPage() {
  return (
    <div className="flex flex-col items-center px-[34px] py-[57px]">
      {/* Nav principal */}
      <ApplicationNavSection />

      {/* Título */}
      <h1 className="w-full max-w-[1339px] text-5xl font-bold my-8">
        Pagina Principal
      </h1>

      {/* Tarjeta de bienvenida */}
      <div className="w-full max-w-[1339px] mb-10">
        <Card className="bg-transparent">
          <CardHeader>
            <CardTitle>Bienvenido, Responsable de Membresías</CardTitle>
          </CardHeader>
          <CardContent>Aquí podrás gestionar las membresías.</CardContent>
        </Card>
      </div>

      <DashboardActions />

    </div>
  );
}
