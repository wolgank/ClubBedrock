import { Button } from "@/components/ui/button"
import { type Academy } from "@/shared/types/Activities"
import { type AcademyPageState } from "../../utils/Academies"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import useAcademies from "./hooks/UseAcademies"

export default function Academies() {
    const navigate = useNavigate();

    // algunos states
    const { academies, loadingAcademies } = useAcademies();

    // handlers
    const handleAcademyClick = (selectedAcademy: Academy) => {
        navigate("/academias/cursos", {
            state: {
                selectedAcademy,
                hasCourseInfo: false,
            } as AcademyPageState
        });
    }

    //console.log(academies);

    return (
        <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-12 py-8">
            {/* Botón Regresar */}
            <div className="relative w-full max-w-[1343px] ">
                <Button
                    onClick={() => navigate("/")}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base ">Regresar</span>
                </Button>
            </div>

            {/* Encabezado */}
            <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)] flex justify-between items-end">
                <h1 className="font-bold text-5xl leading-[48px] ">
                    Academias
                </h1>
                <Button
                    className="text-[var(--text-light)] button4-custom"
                    onClick={() => navigate("/academias/historial")}
                >
                    Mis inscripciones
                </Button>
            </div>

            <Separator className="mb-4"/>

            {/* Listado de academias */}
            <div className="flex flex-wrap justify-center gap-10 mb-4">
                { loadingAcademies ? (
                    <>
                        {
                            Array.from({ length: 9}).map((_, index) => {
                                return (
                                    <Skeleton
                                        key={`skeleton-academy-${index}`}
                                        className="w-sm h-64 rounded-md bg-amber-100/40 dark:bg-gray-700"
                                    />
                                )
                            })
                        }
                    </>
                ) : (
                    <>
                        { !academies || academies.length === 0 ? <div>Sin academias disponibles</div> :
                            academies.map((acad) => {
                                return (
                                    <Card
                                        key={`academy-${acad.id}`}
                                        className="w-sm rounded-md pt-0 overflow-hidden background-custom cursor-pointer transition-transform hover:scale-105"
                                        onClick={() => handleAcademyClick(acad)}
                                    >
                                        <img
                                            src={acad.urlImage}
                                            alt={acad.name}
                                            className="m-auto w-full h-60 object-cover rounded-t-md"
                                        />
                                        <div className="pl-4 flex flex-col">
                                            <span className="text-xl font-bold">
                                                {acad.name}
                                            </span>
                                            <span className="capitalize">
                                                {acad.sport || "Sin deporte definido"}
                                            </span>
                                        </div>
                                    </Card>
                                )
                            })
                        }
                    </>
                )}
            </div>

        </div>
    )
}