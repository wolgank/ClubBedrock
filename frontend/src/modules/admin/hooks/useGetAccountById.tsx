import { useQuery } from "@tanstack/react-query";
import { getAccountById } from "../services/AccountsService";
import { Account } from "../schema/AccountSchema";
import { DefaultAccount } from "../schema/DefaultAccountSchema";

export function useGetAccountById(accountId: number, options?: { enabled?: boolean }) {
  return useQuery<DefaultAccount, Error>({
    queryKey: ['accounts', accountId],
    queryFn: () => getAccountById(accountId),
    enabled: options?.enabled ?? true,
  });
}