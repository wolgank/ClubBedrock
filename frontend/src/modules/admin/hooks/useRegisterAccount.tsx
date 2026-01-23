// src/hooks/useRegisterAccount.ts
import { useMutation } from "@tanstack/react-query";
import { registerAccount } from "../services/AccountsService";
import { registerAccountSchema, Account } from "../schema/AccountSchema";
import type { z } from "zod";
import { toast } from "sonner";

export function useRegisterAccount() {
  return useMutation({
    mutationFn: (registerData:Account) => {
      console.log("[Hook] Datos de registro recibidos:", registerData);

      try {
        const parsedData = registerAccountSchema.parse(registerData);
        const result = registerAccount(parsedData);
        return result;
      } catch (error) {
        console.error("[Zod] Falló el parseo de los datos de registro:", error);
        throw error;
      }
    },

    onError: (error: Error) => {
      //console.error(`Hook dice Error al registrar la cuenta: ${error.message}`);
    },

    onSuccess: (data) => {
      //console.log("Registro exitoso:", data);
    },
  });
}