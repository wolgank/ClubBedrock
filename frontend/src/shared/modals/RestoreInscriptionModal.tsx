import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RestoreInscriptionModalProps = {
    onRestore: () => void
    onClose: () => void
}

export default function RestoreInscriptionModal({ onRestore, onClose }: RestoreInscriptionModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-screen">
            <Card className="background-custom rounded-xl shadow-lg w-sm sm:w-2/3 sm:max-w-xl relative p-6">
            
                {/* Botón X */}
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-[var(--text-dark)]"
                    onClick={onClose}
                >
                    &times;
                </button>

                {/* Título del modal */}
                <h2 className="text-xl font-bold text-[var(--brand)] -mb-3">
                    Restaurar cambios
                </h2>

                {/* Contenido del modal (se coloca el formato de los labels acá para aplicar a todos)*/}
                <p className="-mb-2">
                    ¿Está seguro que quiere reestablecer los cambios realizados en la inscripción?
                </p>

                {/* Botones */}
                <div className="flex justify-center space-x-2 gap-4">
                    <Button
                        className="w-44 text-[var(--text-light)] font-medium cursor-pointer button3-custom"
                        onClick={onRestore}
                    >
                        Sí, reestablecer
                    </Button>
                    <Button
                        className="w-44 text-[var(--text-light)] font-medium cursor-pointer button4-custom"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                </div>

            </Card>
        </div>
    )
}