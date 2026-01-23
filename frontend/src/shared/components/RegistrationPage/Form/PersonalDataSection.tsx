import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PersonalDataSection = ({ form }) => (
    <section>
        <h3 className="text-lg font-semibold mb-4">Datos personales</h3>
        <div className="grid grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="docType"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo de documento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger className='shadow-sm'>
                        <SelectValue placeholder="Seleccione"/>
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                    <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        
            <FormField
                control={form.control}
                name="docNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Número de documento</FormLabel>
                    <FormControl>
                        <Input placeholder="Ingrese documento" {...field} className='shadow-sm'/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        
            <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                    <Input
                        type="date"
                        placeholder="Selecciona tu fecha de nacimiento"
                        {...field}
                        className='shadow-sm'
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
                control={form.control}
                name="names"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                    <Input placeholder="Ingrese tus nombres" {...field} className='shadow-sm'/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="surnames"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                    <Input placeholder="Ingrese sus apellidos" {...field} className='shadow-sm'/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                    <Input placeholder="Ingrese tu dirección" {...field} className='shadow-sm'/>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="gap-4 mt-4">
            <FormField
                control={form.control}
                name="workInfo"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Información de trabajo</FormLabel>
                    <FormControl>
                    <textarea
                        placeholder="Describe tu información de trabajo"
                        rows={3}
                        {...field}
                        className="w-full border rounded px-2 py-1 shadow-sm"
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
    </section>
);