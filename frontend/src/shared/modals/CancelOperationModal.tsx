import { Button } from "@/components/ui/button"

type ModalCancelarOperacionProps = {
    onConfirm: () => void,
    onCancel: () => void
}

export default function CancelOperationModal({ onConfirm, onCancel } : ModalCancelarOperacionProps) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-full">
            <div className="background-custom rounded-xl shadow-lg w-sm sm:w-2/3 sm:max-w-xl relative p-6">
                
                {/* Botón X */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)]"
                    onClick={onCancel}
                >
                    &times;
                </button>

                {/* Título del modal */}
                <h2 className="text-xl font-bold mb-1 text-[var(--brand)]">
                    ¿Seguro que quiere cancelar la operación?
                </h2>

                {/* Contenido del modal */}
                <p className="mb-5">
                    Si hace esto, todos los datos ingresados para la inscripción se perderán. Esta acción es <span className="underline">irreversible</span>.
                </p>

                {/* Botones */}
                <div className="flex justify-center space-x-2 gap-4">
                    <Button
                        className="px-4 py-2 rounded bg-[var(--brand)] text-[var(--text-light)] hover:bg-[var(--brand)]/90 cursor-pointer w-40"
                        onClick={onConfirm}
                    >
                        Borrar datos
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
    )
}