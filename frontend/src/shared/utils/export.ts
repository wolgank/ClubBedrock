import { ColumnDef } from "@tanstack/react-table";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export type MyColumnDef<T> = ColumnDef<T> & {
  headerText?: string;
};

export async function exportTableToExcel<T>(
  data: T[],
  columns: MyColumnDef<T>[],
  filename = "export.xlsx"
) {
  if (!data.length) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Datos");

  const exportableColumns = columns.filter(
    (col) => "accessorKey" in col && col.accessorKey
  );

  const headers = exportableColumns.map((col) => {
    if (typeof col.headerText === "string") return col.headerText;
    if (typeof col.header === "function") {
      const headerRendered = col.header({ column: { id: col.id || "" } } as never);
      if (typeof headerRendered === "string") return headerRendered;
      return col.id || "";
    }
    return col.id || "";
  });

  worksheet.addRow(headers);

  for (const row of data) {
    const rowValues = exportableColumns.map((col) => {
      let value: unknown = "";
      if ("accessorKey" in col && col.accessorKey) {
        value = (row as any)[col.accessorKey];
      }
      if (typeof value === "boolean") {
        return value ? "Sí" : "No";
      }
      return value ?? "";
    });
    worksheet.addRow(rowValues);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, filename);
}
