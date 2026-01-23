import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Definimos el schema Zod
const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
});

// Inferimos el tipo de datos del schema
type FormData = z.infer<typeof schema>;

export function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    //console.log("Datos enviados:", data);
    toast.success(`Formulario enviado:\nNombre: ${data.name}\nEmail: ${data.email}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Nombre:</label>
        <input {...register("name")} />
        {errors.name && <span style={{ color: "red" }}>{errors.name.message}</span>}
      </div>

      <div>
        <label>Email:</label>
        <input {...register("email")} />
        {errors.email && <span style={{ color: "red" }}>{errors.email.message}</span>}
      </div>

      <button type="submit">Enviar</button>
    </form>
  );
}