// Suponiendo que estés utilizando Tanstack Query (React Query)
import { useQuery } from "@tanstack/react-query";
import { getAllAccounts } from "../services/AccountsService";
import { Account } from "../schema/AccountSchema";
import z from "zod";

export function useGetAccounts() {
  return useQuery<{
    valid: Account[];
    invalid: { item: Account; errors: z.ZodIssue[] }[];
  }, Error>({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
  });
}
