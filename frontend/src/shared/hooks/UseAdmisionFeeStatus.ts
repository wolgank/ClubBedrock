import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface AdmissionFee {
  id: string;
  description: string;
  status: "PAGADO" | "PENDIENTE" | string;
  createdAt: string;
  dueDate: string;
  finalAmount: number;
}

export interface DoIPaid {
  paid: boolean;
}

export function useAdmissionFeeStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["admissionFeeStatus"],
    queryFn: async (): Promise<DoIPaid> => {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/members/first-payment`, {
        withCredentials: true,
      });
      console.log(res.data.paid);
      return res.data;
    },
    enabled, // solo corre si es miembro
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });
}