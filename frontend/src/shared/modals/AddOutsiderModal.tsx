import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type Outsider, type DocumentType } from "../types/Person";
import { toast } from "sonner";

type AddOutsiderModalProps = {
    onCancel: () => void;
    onAdd: (newMember: Outsider) => void;
};

export default function AddOutsiderModal({ onCancel, onAdd }: AddOutsiderModalProps) {
  const [documentType, setDocumentType] = useState<DocumentType | "Ninguno">("Ninguno");
  const [documentId, setDocumentId] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleConfirm = (e : React.FormEvent) => {
    e.preventDefault();

    // => Algunas verificaciones previas
    // para el documentId
    switch(documentType) {
      case "DNI":
        if (!/^\d{8}$/.test(documentId)) {
          toast.error("El DNI debe tener exactamente 8 dígitos que sean númericos.")
          return
        }
        break;
      case "CE":
      case "PAS":
        if(!/^[a-zA-Z0-9]{6,}$/.test(documentId)) {
          toast.error("El carné de extranjería o el pasaporte debe tener mínimo 6 caracteres alfanúmericos.")
          return
        }
        break;
    }

    // Para nombres y apellidos (caracteres alfabeticos y espacios)
    if(name.trim().length === 0 || lastName.trim().length === 0 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name) || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(lastName)) {
      toast.error("Los nombres y apellidos solo debe contener caracteres alfabéticos y espacios.")
      return
    }

    // id random para asignar a los outsiders creados (recién se registran)
    const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

    // se define el nuevo outsider
    const newOutsider: Outsider = {
      id: generateId(),
      documentType: documentType === "Ninguno" ? undefined : documentType,
      documentId: documentType === "Ninguno" ? undefined : documentId,
      name,
      lastName
    }

    onAdd(newOutsider);
  }

  return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-full">
        <form onSubmit={handleConfirm} className="bg-[var(--bg-light-alt)] rounded-xl shadow-lg w-md sm:w-4/5 sm:max-w-2xl relative p-6">
          
          {/* Botón X */}
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)]"
            onClick={onCancel}
          >
            &times;
          </button>

          {/* Título del modal */}
          <h2 className="text-xl font-bold mb-4 text-[var(--brand)] dark:text-[var(--brand)] text-center">
            Inscribir a un externo
          </h2>

          {/* Contenido del modal (se coloca el formato de los labels acá para aplicar a todos)*/}
          <div className="text-[var(--text-dark)] dark:text-[var(--text-dark)]">
            {/* Datos personales del invitado */}
            <div className="space-y-4 mb-6 pb-4">
              { /* Subtitulo */}
              <h3 className="text-lg font-semibold text-[var(--brand-light)] dark:text-[var(--brand-light)]">
                Datos personales del invitado
              </h3>
              
              {/* Contenido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/*  Tipo de documento */}
                  <div>
                      <label className="block text-sm font-medium mb-1">
                        Tipo de documento (opcional):
                      </label>
                      <Select
                        value={documentType}
                        onValueChange={(val) =>
                          setDocumentType(val as DocumentType || "Ninguno")
                        }
                      >
                        <SelectTrigger className="w-full border rounded-lg px-3 py-2 border-[#cccccc] flex items-center">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent className="z-110">
                          <SelectItem value="Ninguno">Ninguno</SelectItem>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CE">Carné de extranjería</SelectItem>
                          <SelectItem value="PAS">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  {/* Número de documento */}
                  <div>
                      <label className="block text-sm font-medium mb-1">
                          Número de documento (opcional):
                      </label>
                      <Input
                          type="text"
                          className="block w-full border rounded-lg px-3 py-2 border-[#cccccc]"
                          disabled={documentType === "Ninguno"}
                          placeholder={documentType === "Ninguno" ? "Indique un tipo de documento" : ""}
                          required={documentType !== "Ninguno"}
                          value={documentId}
                          onChange={(e) => setDocumentId(e.target.value)}
                      />
                  </div>
                  {/* Nombres */}
                  <div>
                      <label className="block text-sm font-medium mb-1">
                          Nombres:
                      </label>
                      <Input
                          type="text"
                          className="block w-full border rounded-lg px-3 py-2 border-[#cccccc]"
                          value={name}
                          required={true}
                          onChange={(e) => setName(e.target.value)}
                      />
                  </div>
                  {/* Apellidos */}
                  <div>
                      <label className="block text-sm font-medium mb-1">
                          Apellidos:
                      </label>
                      <Input
                          type="text"
                          className="block w-full border rounded-lg px-3 py-2 border-[#cccccc]"
                          value={lastName}
                          required={true}
                          onChange={(e) => setLastName(e.target.value)}
                      />
                  </div>
              </div>

            </div>

          </div>

          {/* Botones */}
          <div className="flex justify-center space-x-2 gap-4">
            <Button
              className="px-4 py-2 rounded bg-[var(--brand)] text-[var(--text-light)] hover:bg-[var(--brand)]/90 cursor-pointer w-40"
              type="submit"
            >
              Añadir invitado
            </Button>
            <Button
              className="px-4 py-2 rounded bg-[var(--brand-light)] text-[var(--text-light)] hover:bg-[var(--brand-light)]/90 cursor-pointer w-40"
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    );
}