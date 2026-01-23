// src/hooks/useLogicalDeleteAccount.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logicalDeleteAccount } from "../services/AccountsService";
import { Account } from "../schema/AccountSchema";

export function useLogicalDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logicalDeleteAccount,
    onSuccess: () => {
      // Invalidar la query de accounts para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });
}