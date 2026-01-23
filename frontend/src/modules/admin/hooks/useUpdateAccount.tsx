// src/hooks/useUpdateAccount.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAccount } from "../services/AccountsService";
import { Account, updateAccountSchema} from "../schema/AccountSchema";

export function useUpdateAccount() {
  return useMutation({
    mutationFn: async (formData: Account) => {
      try {
        // Validación y transformación
        console.log("Hook recibe: "+ formData.auth);
        const updates = updateAccountSchema.parse(formData);
        return await updateAccount(updates);
      } catch (error) {
        console.error("[Zod] Falló el parseo de formData:", error);
        throw error; // React Query lo capturará
      }
    },

    onError: (error) => {
      console.error("Hook dice Error al actualizar la cuenta:", error instanceof Error ? error.message : error);
    },
  });
}
