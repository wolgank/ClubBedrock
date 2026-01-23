import ReportsNavSection from "../components/ReportsNavSection";
import { Outlet } from "react-router-dom";

export default function EmployeeReportsPage() {
  return (
    <>
      <ReportsNavSection />   {/* sub-menú una sola vez */}
      <Outlet />              {/* aquí se cargan los hijos */}
    </>
  );
}
