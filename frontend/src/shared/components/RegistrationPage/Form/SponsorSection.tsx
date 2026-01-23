import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input'; // Los componentes de ShadCN

export const SponsorsSection = ({ form }) => {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-4">Socios recomendantes</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* ID socio 1 */}
        <FormField
          control={form.control}
          name="sponsor1Id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID socio 1</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese ID socio 1" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre socio 1 */}
        <FormField
          control={form.control}
          name="sponsor1Name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre socio 1</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese nombre socio 1" {...field} className='shadow-sm' />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ID socio 2 */}
        <FormField
          control={form.control}
          name="sponsor2Id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID socio 2</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese ID socio 2" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre socio 2 */}
        <FormField
          control={form.control}
          name="sponsor2Name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre socio 2</FormLabel>
              <FormControl>
                <Input placeholder="Ingrese nombre socio 2" {...field} className='shadow-sm'/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
};

