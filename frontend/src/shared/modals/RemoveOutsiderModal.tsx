import { Button } from "@/components/ui/button";
import { Outsider } from "../types/Person";

type RemoveOutsiderModalProps = {
    onCancel: () => void,
    onRemove: () => void,
    outsiderToRemove: Outsider
};

export default function RemoveOutsiderModal({ onCancel, onRemove, outsiderToRemove }: RemoveOutsiderModalProps) {
  return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-full">
        <div className="bg-[var(--bg-light-alt)] rounded-xl shadow-lg w-sm sm:w-2/3 sm:max-w-xl relative p-6">
          
          {/* Botón X */}
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)]"
            onClick={onCancel}
          >
            &times;
          </button>

          {/* Título del modal */}
          <h2 className="text-xl font-bold mb-1 text-[var(--brand)] dark:text-[var(--brand)]">
            Quitar externo de invitados
          </h2>

          {/* Contenido del modal (se coloca el formato de los labels acá para aplicar a todos)*/}
          <p className="text-[var(--text-dark)] dark:text-[var(--text-dark)] mb-5">
            Se quitará de la lista a <strong>{outsiderToRemove.name} {outsiderToRemove.lastName}</strong>.
            ¿Estás seguro?
          </p>

          {/* Botones */}
          <div className="flex justify-center space-x-2 gap-4">
            <Button
              className="px-4 py-2 rounded bg-[var(--brand)] text-[var(--text-light)] hover:bg-[var(--brand)]/90 cursor-pointer w-40"
              onClick={onRemove}
            >
              Quitar
            </Button>
            <Button
              className="px-4 py-2 rounded bg-[var(--brand-light)] text-[var(--text-light)] hover:bg-[var(--brand-light)]/90 cursor-pointer !w-40"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>

        </div>
      </div>
    );
}