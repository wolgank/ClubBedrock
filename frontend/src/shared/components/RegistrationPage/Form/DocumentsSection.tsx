import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DocUploadField } from '../../ui/DocUploadField';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
export const DocumentsSection = ({ form, titularFormats, spouseFormats, handleDynamicFile, isSpouseFilled}) => {
  
    const { getValues } = form;

const handleSubirTodos = () => {
  try {
    const values = getValues();
    const archivos: { id: string; file: File }[] = [];
    const archivosFaltantes: string[] = [];

    const recolectar = (
      grupo: any,
      formatos: { id: number; name: string; isForInclusion?: boolean }[],
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

    recolectar(values.titularDocuments, titularFormats, "Titular");

    if (isSpouseFilled && spouseFormats.length > 0) {
      recolectar(values.spouseDocuments, spouseFormats, "Cónyuge");
    }

    if (archivosFaltantes.length > 0) {
      const message = `No se han subido archivos. Por favor, suba los documentos requeridos:\n\n- ${archivosFaltantes.join("\n- ")}`;
      toast.error(message);
      return; // ← Este `return` detiene la ejecución si hay errores
    }

    if (handleDynamicFile) {
      handleDynamicFile(archivos);
    } else {
      console.warn("No se definió handleDynamicFile");
    }
    //toast de success
    toast.success("Archivos recolectados correctamente. Ahora puedes proceder a enviar solicitud.");
  } catch (err) {
    console.error("Error al recolectar archivos:", err);
    toast.error("Ocurrió un error al intentar subir los archivos.");
  }
};

  
  return (
    <>
      {/* ========= DOCUMENTOS TITULAR ========= */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Documentos solicitados al Titular</h3>

        <div className="space-y-4">
          {titularFormats.map((fmt) => (
            <FormField
              key={fmt.id}
              control={form.control}
              name={`titularDocuments.${fmt.id}`}
              render={() => (
                <FormItem>
                  <FormLabel>
                    {fmt.name}
                    {fmt.isForInclusion && <span className="text-red-600">*</span>}
                    {fmt.description && (
                      <span className="text-xs text-gray-500"> ({fmt.description})</span>
                    )}
                  </FormLabel>

                  <DocUploadField
                    name={`titularDocuments.${fmt.id}`}
                    label={`Sube el archivo para ${fmt.name}`}
                    multiple={false}
                    maxFiles={1}
                  />

                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </section>

      {/* ========= DOCUMENTOS CÓNYUGE ========= */}
      {isSpouseFilled && spouseFormats.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Documentos solicitados al Cónyuge</h3>

          <div className="space-y-4">
            {spouseFormats.map((fmt) => (
              <FormField
                key={fmt.id}
                control={form.control}
                name={`spouseDocuments.${fmt.id}`}
                render={() => (
                  <FormItem>
                    <FormLabel>
                      {fmt.name}
                      {fmt.isForInclusion && <span className="text-red-600">*</span>}
                      {fmt.description && (
                        <span className="text-xs text-gray-500"> ({fmt.description})</span>
                      )}
                    </FormLabel>

                    <DocUploadField
                      name={`spouseDocuments.${fmt.id}`}
                      label={`Sube el archivo para ${fmt.name}`}
                      multiple={false}
                      maxFiles={1}
                    />

                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </section>
      )}

      {/* ========= BOTÓN GENERAL ========= */}
      <div className="mt-8">
        <Button
          type="button"
          className="px-6 py-3 button4-custom text-[var(--text-light)]"
          onClick={handleSubirTodos}
        >
          Subir todos los archivos
        </Button>
      </div>
    </>
  );
};
