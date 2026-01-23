import { useEffect } from "react";
import { useClubConfig } from "@/modules/admin/hooks/useClubConfig";

export default function TitleSetter() {
  const { config } = useClubConfig();

  useEffect(() => {
    if (config?.name) {
      document.title = config.name;
    }

    if (config?.logoUrl) {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (favicon) {
        // Agregar cache busting para forzar actualización
        favicon.href = config.logoUrl + "?v=" + new Date().getTime();
      } else {
        // Si no hay favicon, crea uno y lo añade al head
        const newFavicon = document.createElement("link");
        newFavicon.rel = "icon";
        newFavicon.href = config.logoUrl + "?v=" + new Date().getTime();
        document.head.appendChild(newFavicon);
      }
    }
  }, [config]);

  return null;
}
