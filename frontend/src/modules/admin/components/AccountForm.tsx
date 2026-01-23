import { FC } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Account,
  accountSchema,
  defaultAccount,
} from "../schema/AccountSchema";
import { defaultAccountSchema } from "../schema/DefaultAccountSchema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Import } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUploadField } from "@/shared/components/ui/ImageUploadField";
import { toast } from "sonner";

interface AccountFormProps {
  mode: "register" | "update" | "view";
  initialData?: unknown;
  onSubmit: (data: Account) => void;
}

const roleMap = {
  SPORTS: "Responsable de deportes",
  EVENTS: "Responsable de eventos",
  MEMBERSHIP: "Responsable de membresías",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
  GUEST: "Invitado",
} as const;

const genderMap = {
  MALE: "Masculino",
  FEMALE: "Femenino",
  OTHER: "Otro",
} as const;

const documentTypeMap = {
  DNI: "DNI",
  PASSPORT: "Pasaporte",
  CE: "Carnet de Extranjería",
} as const;



export const AccountForm: FC<AccountFormProps> = ({
  mode,
  initialData,
  onSubmit,
}) => {
  console.log("initial data:" + initialData);
  // Validamos los datos de entrada como `unknown` usando `defaultAccountSchema`
  let formData = null
  if (initialData!=null){
    const parsedData = defaultAccountSchema.safeParse(initialData);
    formData = parsedData.success ? parsedData.data : defaultAccountSchema.parse({});
  }
  console.log("oh yeah!");
  // Si la validación es exitosa, tomamos los datos parseados, sino usamos los valores por defecto
  
  
  const isViewMode = mode === "view";
  console.log(formData);
  //console.log(defaultAccountWithUser);
  const form = useForm<Account>({
    defaultValues: formData || defaultAccount,
    resolver: zodResolver(accountSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log("✅ Datos del formulario:", errors);
          Object.entries(errors).forEach(([key, value]: [string, unknown]) => {
            if (value && typeof value === "object") {
              Object.entries(
                value as Record<string, { message?: string }>
              ).forEach(([subKey, subValue]) => {
                toast.error(subValue.message || "Error en " + subKey);
              });
            } else if (
              typeof value === "object" &&
              value !== null &&
              "message" in value
            ) {
              toast.error(
                (value as { message?: string }).message)
            }
          });
        })}
        className="space-y-4 mx-auto w-[600px]"
      >
        {/* Account Fields */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Datos de Cuenta</h3>

          <FormField
            control={form.control}
            name="auth.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isViewMode}
                    placeholder="Correo electrónico"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="auth.username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de usuario</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isViewMode}
                    placeholder="Nombre de usuario"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(mode === "register" || mode === "update") && (
            <FormField
              control={form.control}
              name="auth.password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      disabled={isViewMode}
                      placeholder={
                        mode === "update"
                          ? "Dejar vacío si no se desea cambiar"
                          : "Contraseña"
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="auth.role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol">
                        {field.value
                          ? roleMap[field.value as keyof typeof roleMap]
                          : "Selecciona un rol"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(roleMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* User Fields */}
        {!isViewMode && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-medium">Datos Personales</h3>

            <FormField
              control={form.control}
              name="user.lastname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellidos *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isViewMode}
                      placeholder="Apellidos"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombres *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isViewMode}
                      placeholder="Nombres"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user.documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isViewMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de documento">
                          {field.value
                            ? documentTypeMap[
                                field.value as keyof typeof documentTypeMap
                              ]
                            : "Selecciona tipo de documento"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(documentTypeMap).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user.documentID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento de Identidad *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isViewMode}
                      placeholder="Documento de identidad"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user.phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isViewMode}
                      placeholder="Número de teléfono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(mode === "register") && (
            <FormField
              control={form.control}
              name="user.gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isViewMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona género">
                          {field.value
                            ? genderMap[field.value as keyof typeof genderMap]
                            : "Selecciona género"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(genderMap).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            <FormField
              control={form.control}
              name="user.birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          disabled={isViewMode}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Selecciona una fecha"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(date?.toISOString())
                        }
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(mode === "register") && (
            <FormField
              control={form.control}
              name="user.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isViewMode}
                      placeholder="Dirección"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}
            {mode === "register" && (
              <ImageUploadField
                control={form.control}
                name="user.profilePictureURL"
                label="Foto de Perfil"
                disabled={isViewMode}
              />
            )}
          </div>
        )}

        {!isViewMode && (
          <Button type="submit" className="w-full">
            {mode === "register" ? "Registrar Cuenta" : "Actualizar Cuenta"}
          </Button>
        )}
      </form>
    </Form>
  );
};
