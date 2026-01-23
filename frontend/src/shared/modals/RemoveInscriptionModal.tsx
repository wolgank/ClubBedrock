import { Button } from "@/components/ui/button";
import { Member } from "../types/Person";

type RemoveInscriptionModalProps = {
    onCancel: () => void,
    onRemove: () => void,
    member: Member
};

export default function RemoveInscriptionModal({ onCancel, onRemove, member }: RemoveInscriptionModalProps) {
  return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-full">
        <div className="background-custom rounded-xl w-sm sm:w-2/3 sm:max-w-xl relative p-6">
          
          {/* Botón X */}
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)]"
            onClick={onCancel}
          >
            &times;
          </button>

          {/* Título del modal */}
          <h2 className="text-xl font-bold mb-1 text-[var(--brand)]">
            Quitar inscripción de socio
          </h2>

          {/* Contenido del modal (se coloca el formato de los labels acá para aplicar a todos)*/}
          <p className="mb-5">
            Se quitará de la lista a <strong>{member.name} {member.lastname} ({member.memberType})</strong>.
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
              className="px-4 py-2 rounded bg-[var(--brand-light)] text-[var(--text-light)] hover:bg-[var(--brand-light)]/90 cursor-pointer w-40"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>

        </div>
      </div>
    );
}