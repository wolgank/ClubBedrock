import { toast } from "sonner";
import { EmailNotification } from "../types/Notifications";
import { type MemberType } from "../types/Person";


/* Para evaluar permisos */
const allowedMembers : MemberType[] = ['TITULAR', 'CÓNYUGUE']

// esto es temporal OJO
export function isAllowedMember(memberType: MemberType) {
  return allowedMembers.includes(memberType);
}

/* FECHAS */
// => Para evitar comparar con un día antes
export function getDateFromISO(dateISO: string): Date | null {
  const parts = dateISO.split('-').map((value, idx) => {
    const stringToTransform = (idx === 2) ? value.slice(0, 2): value;
    return Number(stringToTransform);
  });

  if (parts.length !== 3 || parts.some(isNaN)) {
    toast.error(`Se recibió una fecha inválida: ${dateISO}`);
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, month -1, day);
}

export function getISOfromDate(date: Date): string {
  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* Para evaluar la disponibilidad de la actividad */

export function isBeforeActivityDate(dateISO: string): boolean {
  const activityDate = getDateFromISO(dateISO);
  if(!activityDate) return false;
  return new Date().getTime() < activityDate.getTime();
}

/* Formateo de fecha a formato dd M. aaaa */

const activityFormatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});

export function transformDate(dateISO: string): string {
  const activityDate = getDateFromISO(dateISO);
  if(!activityDate) return "???";
  return activityFormatter.format(activityDate);
}

export function transformHour(dateISO: string): string {
  return dateISO.slice(11, 16);
}

/* Para inscripción */

// Función genérica para enviar notificaciones por correo
export async function sendEmailNotification(emailReq: EmailNotification) {
  const emailRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(emailReq)
    });

    if(!emailRes.ok) {
        const data = await emailRes.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Error ${emailRes.status}: No se pudo enviar el correo de tipo ${emailReq.tipo ?? "desconocido"}`);
    }
}