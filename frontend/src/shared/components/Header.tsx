import RoleNavbar from "./RoleNavbar";
import { Link } from "react-router-dom";
import { useClubConfig } from "@/modules/admin/hooks/useClubConfig";
import { Console } from "console";

export default function Header() {
  const { config } = useClubConfig();

  const clubName = config?.name
  //console.log("Nombre:", config?.name)
  const logoUrl = config?.logoUrl

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex bg-[var(--bg-light)] dark:bg-[var(--bg-dark)]">
      {/* Logo y nombre */}
      <div className="flex items-center gap-3 px-6 py-4">
        <img
          src={logoUrl}
          alt="Logo del club"
          className="h-10 w-10 object-contain bg-white rounded"
        />
        <Link to="/" className="text-lg font-bold text-emerald-700 dark:text-white whitespace-nowrap">
          {clubName}
        </Link>
      </div>

      {/* Espacio central */}
      <div className="flex-1 bg-transparent" />

      {/* Navbar */}
      <div className="bg-white dark:bg-[#0e2a32] shadow-sm px-6 py-4 rounded-bl-2xl min-h-[72px] flex items-center">
        <RoleNavbar />
      </div>
    </header>
  );
}