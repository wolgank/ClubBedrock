import React from "react";
import { useClubConfig } from "@/modules/admin/hooks/useClubConfig";

export default function Footer() {
  const { config } = useClubConfig();

  if (!config) return null; // O un spinner/loading si quieres

  return (
    <footer className="footer py-4 px-6 bg-gray-100 text-center text-sm text-gray-600">
      <p className="font-semibold">© 2025 {config.name}. Todos los derechos reservados.</p>
      <p>{config.address ?? "Dirección no disponible"}</p>
      <p>
        {config.email ?? "Correo no disponible"} {config.phone ? `• ${config.phone}` : ""}
      </p>
      {config.openHours && <p>Horario de atención: {config.openHours}</p>}
    </footer>
  );
}