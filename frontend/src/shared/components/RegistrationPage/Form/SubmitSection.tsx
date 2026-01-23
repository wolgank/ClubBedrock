import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';

export const SubmitSection = ({ 
  form, 
  isSubmitting, 
  alreadyApplied, 
  checkingExists 
}) => {
  // Función para obtener mensajes de error seguros
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Error de validación';
  };

  return (
    <div className="space-y-4">
      {/* ========= TÉRMINOS Y CONDICIONES ========= */}
      <section className="flex items-center">
      <FormField
        control={form.control}
        name="acceptTerms"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className='border-gray-400'
                // No necesitas añadir estilos manualmente, shadcn ya los incluye
              />
            </FormControl>
            <FormLabel className="text-sm font-normal cursor-pointer">
              Para continuar debes aceptar los{" "}
              <a href="/terms" target='_blank' className="text-blue-600 dark:text-blue-300 underline">
                términos y condiciones
              </a>
            </FormLabel>
          </FormItem>
        )}
      />
      </section>
      {/* ========= BOTÓN DE ENVÍO ========= */}
      <Button
        type="submit"
        className="w-full button3-custom text-[var(--text-light)]"
        disabled={isSubmitting || alreadyApplied || checkingExists}
      >
        {checkingExists 
          ? 'Verificando…' 
          : alreadyApplied 
            ? 'Solicitud existente' 
            : isSubmitting
              ? 'Enviando...'
              : 'Enviar solicitud'}
      </Button>

      {/* ========= ERRORES DEL FORMULARIO ========= */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="bg-red-100 text-red-800 p-4 rounded mt-4">
          <ul className="list-disc list-inside">
            {Object.values(form.formState.errors).map((error, i) => (
              <li key={i}>{getErrorMessage(error)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};