import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
    onClose: () => void;
}

export default function MensajeDeAviso({ onClose }: Props) {
    return (
        <Card className="w-[527px] rounded-xl border-none background-custom">
            <CardContent className="flex flex-col gap-4 py-1 px-10">
                <h2 className="text-2xl font-bold text-[var(--brand)] ">
                    ¡Academia creada!
                </h2>

                <p className="text-base font-medium  ">
                    Puedes ver la nueva academia en la lista de Academias Deportivas.
                </p>

                <div className="flex justify-center mt-2">
                    <Button className="h-[43px] w-[137px]  rounded-lg text-[13px] font-bold button3-custom text-white " onClick={onClose}>
                        Ok
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}