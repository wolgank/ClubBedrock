// src/modules/employee/membership/hooks/family-config.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type DocumentoInput = {
  nombre: string;
  descripcion: string;
};

export type VinculoInput = {
  nombre: string;
  descripcion: string;
  costoInclusion: number;
  costoExclusion: number;
  costoCuotaMembresia: number;
  documentosSolicitados: DocumentoInput[];
};

export type VinculoResponse = {
  id: number;
  nombre: string;
  costoInclusion: number;
  costoExclusion: number;
  costoCuotaMembresia: number;
  documentosSolicitados: DocumentoInput[];
};

export const useFamilyConfigs = () =>
    useQuery({
      queryKey: ["family-config"],
      queryFn: async () => {
        // Simula delay para hacerlo realista
        await new Promise((r) => setTimeout(r, 500));
  
        return [
          {
            id: 1,
            nombre: "CÓNYUGE",
            costoInclusion: 100,
            costoExclusion: 50,
            costoCuotaMembresia: 200,
            documentosSolicitados: [
              { nombre: "DNI", descripcion: "Documento vigente" },
              { nombre: "Partida de matrimonio", descripcion: "Reciente" },
            ],
          },
          {
            id: 2,
            nombre: "HIJO",
            costoInclusion: 80,
            costoExclusion: 40,
            costoCuotaMembresia: 150,
            documentosSolicitados: [
              { nombre: "Partida de nacimiento", descripcion: "" },
            ],
          },
        ];
      },
    });


export const useCreateFamilyConfig = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: VinculoInput) => {
        //console.log("🟢 Simulando creación:", input);
        await new Promise((r) => setTimeout(r, 300));
        return { message: "Mock creado", id: Math.floor(Math.random() * 1000) };
        },
        onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["family-config"] });
        },
    });
};

export const useDeleteFamilyConfig = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: number) => {
        //console.log("🔴 Simulando eliminación de ID:", id);
        await new Promise((r) => setTimeout(r, 300));
        return { message: "Mock eliminado" };
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["family-config"] });
      },
    });
};

export const useUpdateFamilyConfig = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: VinculoInput }) => {
        //console.log("🟡 Simulando actualización ID:", id, data);
        await new Promise((r) => setTimeout(r, 300));
        return { message: "Mock actualizado" };
        },
        onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["family-config"] });
        },
    });
};

      