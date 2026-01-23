import { Link, useLocation } from "react-router-dom";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "../context/UserContext";
import { useAdmissionFeeStatus } from "../hooks/UseAdmisionFeeStatus";
import { Spinner } from "@/components/ui/spinner";

const NAV_ITEMS_MEMBER = [
  { name: "Reservas", path: "/reservas" },
  { name: "Eventos", path: "/eventos" },
  { name: "Academias", path: "/academias" },
  { name: "Membresía", path: "/membresia" },
];


const PANEL_ROUTES: Record<string, string> = {
  ADMIN: "/admin",
  EVENTS: "/employee-event/espacios",
  SPORTS: "/employee-sport/espacios",
  MEMBERSHIP: "/employee-membership/dashboard"
};

const TEXTS = {
  accountLabel: "Cuenta",
  logout: "Logout",
  login: "Iniciar sesión",
  register: "Registrarse",
};

function getNavLinkClasses(isActive: boolean) {
  if (isActive) {
    return "bg-white text-[#0e2a32] dark:bg-[#f3f0ea] dark:text-[#0e2a32] px-3 py-1 rounded-md text-sm font-medium";
  }
  return "text-gray-600 dark:text-white hover:text-black dark:hover:text-[#b9e0d8] px-3 py-1 rounded-md text-sm font-medium";
}

export default function RoleNavbar() {
  const location = useLocation();
  const { account } = useUser();
  const userRole = account?.role || null;
  const isMember = userRole === "MEMBER";

  const {
    data: paid,
  } = useAdmissionFeeStatus(isMember);

  const avatarUrl = "https://github.com/shadcn.png";
  const showMemberNav = isMember && paid /*&& feeData?.status === "PAID"*/;

  return (
    <div className="flex items-center justify-between w-full gap-6">
      {/* BLOQUE DE NAVEGACIÓN */}
      <div className="flex items-center gap-6">
        {!userRole && (
          <>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium border border-[var(--brand)] text-[var(--brand)] rounded-md hover:bg-[var(--brand)] hover:text-white"
            >
              {TEXTS.login}
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium bg-[var(--brand)] text-white rounded-md hover:bg-[var(--brand)]"
            >
              {TEXTS.register}
            </Link>
          </>
        )}

        {userRole === "GUEST" && (
          <Link
            to="/register/form"
            className="px-4 py-2 text-sm font-medium bg-[var(--brand)] text-white rounded-md hover:bg-[var(--brand)]"
          >
            Solicitar Membresía
          </Link>
        )}

        {showMemberNav && (
          <ul className="flex gap-4 items-center">
            {NAV_ITEMS_MEMBER.map(({ name, path }) => (
              <li key={name}>
                <Link
                  to={path}
                  className={getNavLinkClasses(location.pathname === path)}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {userRole && userRole !== "MEMBER" && userRole !== "GUEST" && (
          <Link
            to={PANEL_ROUTES[userRole]}
            className="text-sm text-gray-800 dark:text-white font-medium hover:underline"
          >
            Panel de Herramientas
          </Link>
        )}
      </div>

      {/* BLOQUE DE CUENTA + TOGGLE */}
      <div className="flex items-center gap-4">
        {userRole && (
          <>
            <div className="flex flex-col items-end">
              <Link
                className="text-sm font-medium text-gray-900 dark:text-white hover:underline"
                to="/account"
              >
                {TEXTS.accountLabel}
              </Link>
              <Link
                to="/logout"
                className="text-xs text-gray-600 hover:underline dark:text-gray-300 dark:hover:text-white"
              >
                {TEXTS.logout}
              </Link>
            </div>
            <Avatar>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>US</AvatarFallback>
            </Avatar>
          </>
        )}
        <ModeToggle />
      </div>
    </div>
  );
}
