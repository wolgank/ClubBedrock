import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type DocumentFormat = {
  id: number;
  name: string;
  isForInclusion: boolean;
  description?: string;
};

type DocumentsSectionProps = {
  titularFormats: DocumentFormat[];
  spouseFormats?: DocumentFormat[];
  isSpouseFilled?: boolean;
  handleDynamicFile?: (archivos: { id: string; file: File }[]) => Promise<void> | void;
};

export const DocumentsSection: FC<DocumentsSectionProps> = ({
  titularFormats,
  spouseFormats = [],
  isSpouseFilled = false,
  handleDynamicFile,
}) => {
  const { setValue, getValues } = useFormContext();

  const onFileChange = (id: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setValue(`dynamicFiles.${id}`, file, { shouldValidate: true });
    if (handleDynamicFile) handleDynamicFile([{ id: id.toString(), file }]);
  };

  const handleSubirTodos = async () => {
    const values = getValues();
    const archivos: { id: string; file: File }[] = [];
    const archivosFaltantes: string[] = [];

    const recolectar = (
      grupo: Record<number, File>,
      formatos: DocumentFormat[],
      nombreGrupo: string
    ) => {
      for (const fmt of formatos) {
        const file = grupo?.[fmt.id];
        if (file instanceof File) {
          archivos.push({ id: fmt.id.toString(), file });
        } else if (fmt.isForInclusion) {
          archivosFaltantes.push(`${nombreGrupo}: ${fmt.name}`);
        }
      }
    };

    recolectar(values.dynamicFiles, titularFormats, "Titular");
    if (isSpouseFilled && spouseFormats.length > 0) {
      recolectar(values.spouseDocuments ?? {}, spouseFormats, "Cónyuge");
    }

    if (archivosFaltantes.length > 0) {
      toast.error(`Faltan documentos requeridos:\n- ${archivosFaltantes.join("\n- ")}`);
      return;
    }

    if (handleDynamicFile) await handleDynamicFile(archivos);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {titularFormats.map((df) => (
        <div key={df.id}>
          <Label>
            {df.name}
            {df.isForInclusion && <span className="text-red-500">*</span>}
          </Label>
          <Input type="file" onChange={onFileChange(df.id)} className="shadow-sm"/>
          {df.description && (
            <p className="text-xs text-muted-foreground mt-1">{df.description}</p>
          )}
        </div>
      ))}

      {/* Botón opcional si quieres forzar validación y subida conjunta */}
      {/* <Button onClick={handleSubirTodos}>Validar y subir todos</Button> */}
    </div>
  );
};
