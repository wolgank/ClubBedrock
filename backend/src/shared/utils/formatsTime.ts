import { parseISO, format, subHours } from 'date-fns';

export function formatHourFromISO(isoString: string) {
  const date = subHours(parseISO(isoString), 1); // Resta 1 hora
  return format(date, 'HH:mm');
}


export function formatHourFromISOString(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}h`;
}



/**
 * Extrae solo el año, mes y día de un objeto Date.
 * Devuelve un nuevo objeto Date con hora 00:00:00 en zona horaria local.
 */
/**
 * Convierte un objeto Date a string con formato 'YYYY-MM-DD'.
 */
export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0"); // mes 0-11
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
