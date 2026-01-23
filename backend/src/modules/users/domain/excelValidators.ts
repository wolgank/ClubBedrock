import { type Worksheet } from 'exceljs';

export function validateMembershipsSheet(ws: Worksheet) {
  const row = ws.getRow(1);
  // row siempre existe; row.values puede ser undefined, así que usamos fallback
  const values = (row.values ?? []) as any[];
  const headers = values
    .slice(1)
    .map(v => (v != null ? String(v).trim() : ''));

  const expectedMembershipCols = [
    'Código de la membresía',
    'Estado de la membresía',
    'Fecha fin de membresía (solo si aplica) (dd/mm/yyyy)',
  ];

  expectedMembershipCols.forEach((col, i) => {
    if (headers[i] !== col) {
      throw new Error(`Hoja “Membresías”: columna ${i + 1} debe ser “${col}”`);
    }
  });
}

export function validateMembersSheet(ws: Worksheet) {
  const row = ws.getRow(1);
  const values = (row.values ?? []) as any[];
  const headers = values
    .slice(1)
    .map(v => (v != null ? String(v).trim() : ''));

  const expectedMemberCols = [
    'Email*',
    'Nombres*',
    'Apellidos*',
    'Tipo de documento (DNI,CE o PASSPORT)',
    'Número de documento',
    'Número de teléfono',
    'Fecha de nacimiento',
    'Género (M, F u Otro)',
    'Dirección',
    'Tipo (TITULAR, CÓNYUGUE, HIJO, PRIMO, etc)', //  (Si no es titular, debe ir en la misma membresía donde ya haya un titular)
    'Código de la membresía',
    'Código de miembro (puede dejar vacío para autogenerar)',
  ];

  expectedMemberCols.forEach((col, i) => {
    if (headers[i] !== col) {
      throw new Error(`Hoja “Miembros”: columna ${i + 1} debe ser “${col}”`);
    }
  });
}
