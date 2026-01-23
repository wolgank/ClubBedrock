import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EditUserForm({ initialData, onClose }: { initialData: any; onClose: () => void }) {
  const { register, handleSubmit } = useForm({
    defaultValues: initialData,
  });

  const onSubmit = (data: any) => {
    console.log("Datos corregidos:", data);
    // Aquí podrías hacer una llamada API, validar con Zod o actualizar estado global
    onClose(); // cerrar modal
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <Input {...register("name")} />
      </div>
      <div>
        <label className="block text-sm font-medium">Apellido</label>
        <Input {...register("lastname")} />
      </div>
      <div>
        <label className="block text-sm font-medium">Documento</label>
        <Input {...register("documentID")} />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}
