import React, { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner"; // Librería de notificaciones
import { Button } from "@/components/ui/button";// ShadCN Button
import { Input } from "@/components/ui/input"; // ShadCN Input

// Función para subir el archivo
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("/api/api/users/bulk-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });
    return response.data; // Esperamos que la respuesta tenga el formato adecuado
  } catch (error) {
    throw new Error("Error al procesar el archivo");
  }
};

export const BulkUploadButton: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Usamos Tanstack Query para manejar la mutación (subir el archivo)
  const mutation = useMutation({
    mutationFn: uploadFile, // <- ahora lo pasas como propiedad
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      toast.success(data.message);
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning: string) => toast.warning(warning));
      }
    },
    onError: (error: any) => {
      toast.error("Error al procesar la carga.");
      console.error(error);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo Excel.");
      return;
    }

    // Ejecutar la mutación para subir el archivo
    mutation.mutate(file);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg dark:bg-cyan-950 shadow-md">
      <h3 className="text-lg font-semibold mb-4">Cargar Membresías y Miembros</h3>
      
      {/* Input para seleccionar el archivo */}
      <Input
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        disabled={loading}
        className="mb-4"
      />
      
      {/* Botón para subir el archivo */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !file}
        className="w-full bg-green-500 text-white hover:bg-green-600"
      >
        {loading ? "Cargando..." : "Subir archivo"}
      </Button>
      
      {/* Mensaje de error en caso de fallo */}
      {mutation.isError && (
        <p className="text-red-500 mt-2">{mutation.error?.message}</p>
      )}

      {/* Mensaje de éxito en caso de carga exitosa */}
      {mutation.isSuccess && (
        <div className="text-green-500 mt-4">
          <p>¡Carga completada con éxito!</p>
          <ul>
            {mutation.data.warnings && mutation.data.warnings.length > 0 ? (
              mutation.data.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-yellow-600">
                  {warning}
                </li>
              ))
            ) : (
              <p>No hubo advertencias.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
