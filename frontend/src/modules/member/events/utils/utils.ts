

// Verificar que dos fecha 'yyyy-mm-dd' (formato ISO) sean coherentes (1ra anterior o igual a la 2da)
export function isDateRangeValid(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return start.getTime() <= end.getTime();
}




