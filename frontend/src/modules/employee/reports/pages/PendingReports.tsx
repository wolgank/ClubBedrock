import ApplicationNavSection from "@/modules/employee/shared/components/ApplicationNavSection";
import HelpAndSupportSection from "@/modules/employee/shared/components/HelpAndSupportSection";
import PendingFeesTable      from "../components/PendingFeesTable";
import ReportsNavSection     from "../components/ReportsNavSection";
import PageContainer from "@/shared/components/RegistrationPage/PageContainer";

export default function PendingReports() {
  return (
    <PageContainer className="!max-w-7xl">
      <ApplicationNavSection />
      <div className="-mt-8 -mb-5">
        {/* -mt-1 → quita un poco del espacio que añade internamente el ReportsNav */}
        <ReportsNavSection />
      </div>

      <PendingFeesTable />

    </PageContainer>
  );
}
