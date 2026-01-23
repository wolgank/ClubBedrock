declare global {
  interface Window {
    __forceSessionExpired?: () => void;
  }
}
import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider';
//Para acceder a rol unificadamente
import { UserProvider } from './shared/context/UserContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

//Para acceder a la configuración del Club
import TitleSetter from './shared/components/TittleSetter';


import Header from './shared/components/Header';
import Footer from './shared/components/Footer';

import Home from './shared/pages/Home';
import Reservas from './modules/member/reservation/pages/Reservas';
import NuevaReserva from "./modules/member/reservation/pages/NuevaReserva";
//import Academias from './modules/member/academy/pages/Academias';
import Events from './modules/member/events/pages/event-list/Events';
import Login from './shared/pages/Login';
import Logout from './shared/pages/Logout'
import ResetPasswordPage from "./shared/pages/RestorePassword";
import NuevoEvent from './modules/employee/event/pages/nuevoEvento';
import EventosEvent from './modules/employee/event/pages/eventos';
import RequestsPage from './modules/employee/membership/pages/requests';
import FamiliesPage from './modules/employee/membership/pages/families';
import RequestDetailPage from './modules/employee/membership/pages/requestDetail';
import SuspensionFormPage from './modules/employee/membership-suspension/pages/form';
import SuspensionPage from './modules/employee/membership-suspension/pages/index';
import DetalleEvent from './modules/employee/event/pages/detalleEvent';
import MembershipDashboardPage from './modules/employee/membership/pages/dashboard';
import SuspensionIndex from './modules/employee/membership-suspension/pages/index';
import HomeAdmin from './modules/admin/pages/homeAdmin';
import ConfigAdmin from './modules/admin/pages/configAdmin';
import RegistrationPage from './shared/pages/RegistrationPage';
import MembershipLayout from './modules/member/membership/components/MembershipLayout';
import ConsultaPage from "./modules/member/membership/pages/ConsultaCuotasPage";
import PagoPage from "./modules/member/membership/pages/PagoCuotasPage";
import FamiliaresPage from "./modules/member/membership/pages/GestionFamiliaresPage";
import AssignScheduleSpaceEvent from './modules/employee/event/pages/AssignScheduleSpace';
import LeisureSpaces from './modules/employee/event/pages/LeisureSpaces';
import DetailSpaceEvent from './modules/employee/event/pages/DetailSpace';
import NuevoEspacioLeisure from './modules/employee/event/pages/NewLeisureSpace';


import Academies from './modules/member/academy/pages/academy-list/Academies';
import AcademyCourses from './modules/member/academy/pages/academy-courses/AcademyCourses';
import AcademyInscription from './modules/member/academy/pages/academy-inscription/AcademyInscription';
import FirstPayment from './shared/pages/FirstPayment';

import NuevoEspacioSport from './modules/employee/sports/pages/NewSportsSpace';
import EspaciosSport from './modules/employee/sports/pages/SportsSpaces';
import NuevoAcademiaSport from './modules/employee/sports/pages/NewSportsAcademy';
import AcademiasSport from './modules/employee/sports/pages/SportsAcademies';
import DetailSpace from './modules/employee/sports/pages/DetailSpace';
import DetailAcademy from './modules/employee/sports/pages/DetailAcademy';
import AssignScheduleSpace from './modules/employee/sports/pages/AssignScheduleSpace';
import { Toaster } from 'sonner';
import NewRegister from './shared/pages/NewRegister';
import Terms from './shared/pages/Terms';
import AdminLayout from './modules/admin/components/AdminLayout';
import AccountsAdmin from "./modules/admin/pages/accountsAdmin";
import AccountPageAdmin from "./modules/admin/pages/accountPageAdmin";
import EventInscription from "./modules/member/events/pages/event-inscription/EventInscription";
import ForgotPasswordPage from "./shared/pages/ForgotPassword";
import PendingReports from "./modules/employee/reports/pages/PendingReports";
import UserEvents from "./modules/member/events/pages/user-events/UserEvents";
import UserCourses from "./modules/member/academy/pages/user-courses/UserCourses";
import AccountPage from "./shared/pages/Account";
import AssignAcademyCourse from './modules/employee/sports/pages/AssignAcademyCourse';
import SessionExpiredModal from './shared/modals/SessionExpiredModal';
import MiembrosMoraPage from "./modules/employee/reports/pages/MiembrosMoraPage";
import ReportesSport from "./modules/employee/sports/pages/Reportes";
import ReporteEvent from "./modules/employee/event/pages/Reportes";
import ReactivateMembershipPage from "./modules/employee/membership-suspension/pages/ReactivateMembershipPage";
import { MembershipProvider } from "./shared/context/MembershipContext";

const queryClient = new QueryClient()

export default function App() {
  //esto no debería estar exactamente aqui pero por ahora que este, es para actualizar
  //el mini logo y el nombre de la página.
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    window.__forceSessionExpired = () => setSessionExpired(true);
  }, []);
  // TODO: (para todos los de frontend)
  // - Al final, agregar state navigation o local/session storage para tener flujos
  //   de usuario más seguros (esto hará que no se tenga que hacer tantas validaciones)
  // => Temporalmente: solo datos en el path de la URL
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <UserProvider> {/* <<< Aquí envolvemos para dar contexto de rol */}
          {/* 1) contenedor flex-col ocupa toda la pantalla */}
          <div className="flex flex-col min-h-screen">
            {/* 2) Header arriba, ya no NavBar, esta dentro de Header */}
            <SessionExpiredModal open={sessionExpired} />
            <Router>
              <TitleSetter />
              <Header />
              {/* 3) Main que crece */}
              <main className="flex-1 dark:bg-[var(--color-gray-900)] pt-20">
                <Routes>
                  {/* Rutas públicas */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/register" element={<NewRegister />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/terms" element={<Terms />} />
                  {/* Rutas protegidas para cualquier rol */}
                  <Route element={<ProtectedRoute allowedRoles={['GUEST', 'MEMBER', 'ADMIN', 'SPORTS', 'EVENTS', 'MEMBERSHIP']} />}>
                    <Route path="/account" element={<AccountPage />} />
                  </Route>
                  {/* Rutas protegidas para rol GUEST */}
                  <Route element={<ProtectedRoute allowedRoles={['GUEST']} />}>
                    <Route path="/register/form" element={<RegistrationPage />} />
                  </Route>
                  {/* Rutas protegidas para rol MEMBER */}
                  <Route element={<ProtectedRoute allowedRoles={['MEMBER']} />}>
                    <Route path="/reservas" element={<Reservas />} />
                    <Route path="/reservas/nueva" element={<NuevaReserva />} />
                    <Route path="/eventos" element={<Events />} />
                    <Route path="/eventos/historial" element={<UserEvents />} />
                    <Route path="/eventos/inscripcion" element={<EventInscription />} />
                    <Route path="/academias" element={<Academies />} />
                    <Route path="/academias/historial" element={<UserCourses />} />
                    <Route path="/academias/cursos" element={<AcademyCourses />} />
                    <Route path="/academias/inscripcion" element={<AcademyInscription />} />
                    <Route path="/membresia" element={
                            <MembershipProvider>
                              <MembershipLayout />   {/* aquí va el <Outlet> con las páginas */}
                            </MembershipProvider>
                      }>
                      <Route
                        index
                        element={<Navigate to="consulta-cuotas" replace />}
                      />
                      <Route path="/membresia/consulta-cuotas" element={<ConsultaPage />} />
                      <Route path="/membresia/pago-cuotas" element={<PagoPage />} />
                      <Route path="/membresia/gestion-familiares" element={<FamiliaresPage />} />
                    </Route>
                    <Route path="/membresia/first-payment" element={<FirstPayment />} />
                    {/* más rutas MEMBER aquí */}
                  </Route>

                  {/* Rutas para rol EVENTS */}
                  <Route element={<ProtectedRoute allowedRoles={['EVENTS']} />}>
                    <Route path="/employee-event/nuevo-evento" element={<NuevoEvent />} />
                    <Route path="/employee-event/eventos" element={<EventosEvent />} />
                    <Route path="/employee-event/eventos/:id" element={<DetalleEvent />} />
                    <Route path="/employee-event/nuevo-espacio" element={<NuevoEspacioLeisure />} />
                    <Route path="/employee-event/agregar-horario" element={<AssignScheduleSpaceEvent />} />
                    <Route path="/employee-event/espacios" element={<LeisureSpaces />} />
                    <Route path="/employee-event/espacios/:id" element={<DetailSpaceEvent />} />
                    <Route path="/employee-event/reportes" element={<ReporteEvent />} />
                  </Route>

                  {/* Rutas para rol MEMBERSHIP */}
                  <Route element={<ProtectedRoute allowedRoles={['MEMBERSHIP']} />}>
                    <Route path="/employee-membership/solicitud" element={<RequestsPage />} />
                    <Route path="/employee-membership/familiares" element={<FamiliesPage />} />
                    <Route path="/employee-membership/detalles" element={<RequestDetailPage />} />
                    <Route path="/employee-membership/dashboard" element={<MembershipDashboardPage />} />
                    <Route path="/employee-membership/form" element={<SuspensionFormPage />} />
                    <Route path="/employee-membership/indice" element={<SuspensionIndex />} />
                    <Route path="/employee-membership/operaciones" element={<SuspensionPage />} />
                    <Route path="/employee-membership/reportes" element={<PendingReports />} />

                    <Route path="/employee-membership/reportes/moras" element={<MiembrosMoraPage />} />
                    <Route path="/employee-membership/reactivar" element={<ReactivateMembershipPage />} />
                  </Route>

                  {/* Rutas protegidas para rol ADMIN */}
                  <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<HomeAdmin />} />
                      <Route path="/admin/config" element={<ConfigAdmin />} />
                      <Route path="/admin/accounts/:accountId" element={<AccountPageAdmin />} />
                      <Route path="/admin/accounts/:accountId/edit" element={<AccountPageAdmin />} />
                      <Route path="/admin/accounts" element={<AccountsAdmin />} />
                    </Route>
                  </Route>


                  {/* Otras rutas */}
                  <Route element={<ProtectedRoute allowedRoles={['SPORTS']} />}>
                    <Route path="/employee-sport/nuevo-espacio" element={<NuevoEspacioSport />} />
                    <Route path="/employee-sport/espacios" element={<EspaciosSport />} />
                    <Route path="/employee-sport/espacios/:id" element={<DetailSpace />} />
                    <Route path="/employee-sport/nueva-academia" element={<NuevoAcademiaSport />} />
                    <Route path="/employee-sport/academias" element={<AcademiasSport />} />
                    <Route path="/employee-sport/academias/:id" element={<DetailAcademy />} />
                    <Route path="/employee-sport/agregar-horario" element={<AssignScheduleSpace />} />
                    <Route path="/employee-sport/agregar-cursos" element={<AssignAcademyCourse />} />
                    <Route path="/employee-sport/reportes" element={<ReportesSport />} />
                  </Route>

                  {/* Ruta para no autorizado */}
                  <Route path="/unauthorized" element={<p>Acceso denegado. No tienes permisos para ver esta página.</p>} />

                </Routes>
              </main>

              {/* 4) Footer SIEMPRE al fondo */}
              <Footer />
            </Router>
          </div>
        </UserProvider>
        <Toaster richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
/*
<form action="${import.meta.env.VITE_BACKEND_URL}/files/upload" method="POST" encType="multipart/form-data">
          <label htmlFor="file">Selecciona un archivo:</label>
          <Input type="file" name="file" id="file" required/>
          <button type="submit">Subir archivo</button>
        </form>
*/