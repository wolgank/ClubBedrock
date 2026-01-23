// src/pages/ForgotPasswordPage.tsx

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      // Usamos fetch en lugar de Axios
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }
  
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      setSubmitted(true); // Igual mostramos mensaje genérico
      const msg = err?.message;
      if (msg?.includes("invalid")) {
        setErrorMsg("Hubo un error al procesar tu solicitud.");
      }
    },
  });
  

  const onSubmit = (data: any) => {
    mutation.mutate({ email: data.email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md background-custom">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center">Recuperar Contraseña</h2>

          {submitted ? (
            <Alert variant="default">
              <AlertTitle>Si existe una cuenta con ese correo...</AlertTitle>
              <AlertDescription>
                Se ha enviado un enlace para restablecer la contraseña.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Correo electrónico</label>
                <Input type="email" {...register("email")} className="shadow-md"/>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Enviando..." : "Enviar instrucciones"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
