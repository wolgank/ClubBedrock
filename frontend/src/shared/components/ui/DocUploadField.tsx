import { FC } from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormDocUploadProps {
  name: string; // Ej: "titularDocuments.5"
  label: string; // Nombre del documento
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
}

// => Se ha modificado, pues solo se usa en un lado.

export const DocUploadField: FC<FormDocUploadProps> = ({ 
  name, 
  label, 
  disabled,
  multiple = false,
  maxFiles = 10,
}) => {
  const { control, setValue, watch } = useFormContext();
  const files = watch(name) as File[] | File | null;

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    if (multiple) {
      const currentFiles = (files as File[]) || [];
      const newFiles = [...currentFiles, ...acceptedFiles].slice(0, maxFiles);
      setValue(name, newFiles, { shouldValidate: true });
    } else {
      setValue(name, acceptedFiles[0], { shouldValidate: true });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    disabled,
    maxFiles: multiple ? maxFiles : 1,
    accept  : {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif','webp','.bmp'],
      'application/pdf': ['.pdf'],
    }
  });
  const removeFile = (index: number) => {
    if (multiple && Array.isArray(files)) {
      const newFiles = [...files];
      newFiles.splice(index, 1);
      setValue(name, newFiles, { shouldValidate: true });
    } else {
      setValue(name, null, { shouldValidate: true });
    }
  };

  const displayedFiles = multiple && Array.isArray(files) ? files : files ? [files] : [];

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <Label>{label}</Label>
          <div
            {...getRootProps()}
            className={cn(
              "border-1 border-dashed border-black dark:border-white p-4 rounded-md text-center cursor-pointer transition-colors !bg-[var(--light-alt)] dark:bg-gray-800",
              isDragActive ? "bg-muted" : "bg-background",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <p>
              {multiple
                ? "Arrastra archivos o haz clic para seleccionar"
                : "Arrastra un archivo o haz clic para seleccionar uno"}
            </p>

            {displayedFiles.length > 0 && (
              <div className="mt-2 text-left">
                <p className="text-sm font-medium">Archivo(s) seleccionado(s):</p>
                <ul className="list-disc list-inside">
                  {displayedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span>{file instanceof File ? file.name : ""}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
