import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const ContactInfoSection = ({ form }) => {
    return (
      <section>
        <h3 className="text-lg font-semibold mb-4">Información de contacto</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Campo de correo */}
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Ingrese su correo"
                    {...field}
                    className='shadow-sm'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Campo de teléfono */}
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Ingrese su teléfono"
                    {...field}
                    className='shadow-sm'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </section>
    );
  };