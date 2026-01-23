// src/pages/ResetPasswordPage.tsx

import { useSearchParams } from "react-router-dom";
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

const schema = z
  .object({
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/reset-password`, {
        token,
        newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? "Hubo un error";
      setErrorMsg(message);
    },
  });

  const onSubmit = (data: any) => {
    if (!token) {
      setErrorMsg("Token inválido o no presente en la URL.");
      return;
    }
    mutation.mutate({ newPassword: data.newPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md background-custom">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center">Restablecer Contraseña</h2>

          {success ? (
            <Alert variant="default">
              <AlertTitle>¡Éxito!</AlertTitle>
              <AlertDescription>Tu contraseña ha sido actualizada.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Nueva contraseña</label>
                <Input type="password" {...register("newPassword")} className="shadow-md"/>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Confirmar contraseña</label>
                <Input type="password" {...register("confirmPassword")} className="shadow-md"/>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {errorMsg && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
