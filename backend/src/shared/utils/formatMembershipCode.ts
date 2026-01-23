/** 
 * Genera un código de membresía de 8 caracteres:
 * - YYMMDD (fecha de hoy, 6 dígitos)
 * - XX   (dos dígitos en base36 derivado de `id`)
 */
export function formatMembershipCode(id: number): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  // convertir id mod 1296 (36^2) a base36 de 2 dígitos
  const seq = (id % 1296).toString(36).toUpperCase().padStart(2, '0');
  return `${yy}${mm}${dd}${seq}`;  // e.g. "230621A3"
}

/**
 * Genera un subcódigo de 10 caracteres:
 * - 8 dígitos de membershipCode (YYMMDD+XX)
 * - 2 dígitos en base36 derivado de index
 */
export function formatMemberSubCode(
  membershipCode: string,
  index: number
): string {
  // convertimos el index (1,2,3…) mod 1296 a base36 de 2 dígitos
  const idx36 = (index % 1296).toString(36).toUpperCase().padStart(2, '0');
  return `${membershipCode}${idx36}`;   // e.g. "230621A301"
}