import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export const SpouseSection = ({ form, isSpouseFilled }) => {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-4">Información de cónyuge (opcional)</h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Tipo de documento */}
        <FormField
          control={form.control}
          name="spouseDocType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de documento</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full border rounded px-2 py-1 shadow-sm">
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                    <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Número de documento */}
        <FormField
          control={form.control}
          name="spouseDocNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de documento</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese número de documento" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha de nacimiento */}
        <FormField
          control={form.control}
          name="spouseBirthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de nacimiento</FormLabel>
              <FormControl>
                <Input type="date" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Nombres */}
        <FormField
          control={form.control}
          name="spouseNames"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombres</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese nombres" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Apellidos */}
        <FormField
          control={form.control}
          name="spouseSurnames"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellidos</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese apellidos" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Correo */}
        <FormField
          control={form.control}
          name="spouseEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Ingrese correo" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Teléfono */}
        <FormField
          control={form.control}
          name="spousePhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Ingrese teléfono" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Si está lleno, mostrar los campos de usuario y contraseña */}
      {isSpouseFilled && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Usuario */}
          <FormField
            control={form.control}
            name="spouseUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input placeholder="Ingrese usuario" {...field} className='shadow-sm'/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contraseña */}
          <FormField
            control={form.control}
            name="spousePassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Ingrese contraseña" {...field} className='shadow-sm'/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </section>
  );
};
