// src/modules/employee/membership/hooks/family-config.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import {DocumentFormat, MemberType, MemberTypeWithDocsInput} from "../schemas/FamilyPolicySchema";

const backendUrl   = import.meta.env.VITE_BACKEND_URL;

export const useMemberTypes = () =>
useQuery({
  queryKey: ["member-types"],
  queryFn: async () => {
    const { data } = await axios.get(`${backendUrl}/api/member-types`, {
      withCredentials: true,
    });
    return data as MemberType[];
  },
});

export const useDocumentFormatsForMemberType = (id?: number) =>
  useQuery({
    queryKey: ["document-formats", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await axios.get(`${backendUrl}/api/member-types/${id}/document-formats`, {
        withCredentials: true,
      });
      return data as DocumentFormat[];
    },
    enabled: !!id,
  });

export const useCreateMemberType = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: MemberTypeWithDocsInput) => {
      const { data } = await axios.post(`${backendUrl}/api/member-types`, 
        input,
        {
        withCredentials: true, 
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-types"] });
    },
  });
};

export const useUpdateMemberType = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MemberTypeWithDocsInput }) => {
      const res = await axios.put(`${backendUrl}/api/member-types/with-docs/${id}`, 
        data,
        {
          withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-types"] });
    },
  });
};

// export const useFamilyConfigs = () =>
//   useQuery<VinculoResponse[]>({
//     queryKey: ["family-config"],
//     queryFn: async () => {
//       const { data } = await axios.get(`${backendUrl}/api/member-types`, {
//         withCredentials: true
//       });
//       return validateVinculoResponse(data);
//     },
//   });

// export const useCreateFamilyConfig = () => {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (input: unknown) => {
//       const validatedInput = validateVinculoInput(input);
//       return axios.post(`${backendUrl}/api/family-config`, validatedInput);
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["family-config"] }),
//   });
// };

// export const useUpdateFamilyConfig = () => {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: unknown }) => {
//       const validatedData = validateVinculoInput(data);
//       return axios.put(`${backendUrl}/api/family-config/${id}`, validatedData);
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["family-config"] }),
//   });
// };

// export const useDeleteFamilyConfig = () => {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (id: number) => axios.delete(`${backendUrl}/api/family-config/${id}`),
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["family-config"] }),
//   });
// };