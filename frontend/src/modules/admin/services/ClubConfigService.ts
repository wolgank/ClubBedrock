// services/clubConfigService.ts
import { configSchema, ClubConfig } from "../schema/ConfigSchema";

export async function fetchClubConfig(): Promise<ClubConfig> {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/config/club` , {
    credentials: "include",
  });
  const data = await res.json();
  return configSchema.parse(data); // valida y transforma
}

export async function updateClubConfig(config: ClubConfig): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/config/club`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    credentials: "include",
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al guardar configuración: ${res.status} ${errorText}`);
  }
}
