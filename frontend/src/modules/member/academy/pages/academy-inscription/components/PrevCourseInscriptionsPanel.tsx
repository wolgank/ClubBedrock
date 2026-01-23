import { Card } from "@/components/ui/card";
import { AcademyCourseInscription } from "../../../utils/Academies";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowDown, ArrowUp, Info } from 'lucide-react';
import { useCourseInscriptionContext } from "./CourseInscriptionContext";
import CourseSchedule from "./CourseSchedule";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type PrevCourseInscriptionsPanelProps = {
    oldInscriptions: AcademyCourseInscription[],
    onCancelInscription: (inscription: AcademyCourseInscription) => void,
    onRecoverInscription: (inscription: AcademyCourseInscription) => void
}

const baseClass = 'px-4 py-2 font-medium rounded-none';
const activeClass   = 'border-b-2 border-[var(--brand)]';
const inactiveClass = 'text-[var(--brand)] hover:text-[var(--brand-light)]';

export default function PrevCourseInscriptionsPanel({ oldInscriptions, onCancelInscription, onRecoverInscription} : PrevCourseInscriptionsPanelProps) {
    const [tabToShow, setTabToShow] = useState<'old' | 'cancelled'>('old');
    const { course, cancelledInscriptions } = useCourseInscriptionContext();

    const handleTabClick = (tabClicked: 'old' | 'cancelled') => {
        if(tabToShow === tabClicked) return;
        setTabToShow(tabClicked);
    }

    return (
        <Card className="background-custom rounded-[10px] shadow-lg w-full max-w-2xl p-6 flex flex-col justify-between h-[450px]">
            <div className="space-y-4">
                
                {/* Titulo */}
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-[var(--brand)]">Antiguas inscripciones</h2>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="text-[var(--brand)]"/>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>
                                Revise las inscripciones en la pestaña "Inscripciones previas".<br/>
                                Para dar de baja, use la flecha hacia abajo. Para recuperar una<br />
                                cancelación, vaya a "Inscripciones canceladas" y use la flecha<br />
                                hacia arriba.
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Listados de inscripciones */}
                <nav className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => handleTabClick('old')}
                        className={`${baseClass} ${tabToShow === 'old' ? activeClass : inactiveClass}`}
                    >
                        Inscripciones previas
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => handleTabClick('cancelled')}
                        className={`${baseClass} ${tabToShow === 'cancelled' ? activeClass : inactiveClass}`}
                    >
                        Inscripciones canceladas
                    </Button>
                </nav>

                { tabToShow === 'old' ? (
                        <>
                            {oldInscriptions.length > 0 ? (
                                    <ul className="divide-y text-sm max-h-52 overflow-auto mt-2">
                                        {oldInscriptions.map((ins) => (
                                            <li key={ins.member.id} className="flex items-center justify-between p-2 border-gray-500 dark:border-gray-400">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ins.member.name} {ins.member.lastname}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">{ins.member.memberType}</span>
                                                </div>
                                                <div className="flex flex-nowrap gap-8">
                                                    { course.courseType === 'FLEXIBLE' && (
                                                        <CourseSchedule
                                                            course={course}
                                                            timeSlotsSelected={ins.timeSlotsSelected}
                                                        />
                                                    )}
                                                    <button className="cursor-pointer" onClick={() => onCancelInscription(ins)}><ArrowDown/></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                                        No hay inscripciones previas por mostrar
                                    </p>
                                )
                            }
                        </>
                    ) : (
                        <>
                            {cancelledInscriptions.length > 0 ? (
                                    <ul className="divide-y text-sm max-h-52 overflow-auto mt-2">
                                        {cancelledInscriptions.map((ins) => (
                                            <li key={ins.member.id} className="flex items-center justify-between p-2 border-gray-500 dark:border-gray-400">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ins.member.name} {ins.member.lastname}</span>
                                                    <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">{ins.member.memberType}</span>
                                                </div>
                                                <div className="flex flex-nowrap gap-8">
                                                    { course.courseType === 'FLEXIBLE' && (
                                                        <CourseSchedule
                                                            course={course}
                                                            timeSlotsSelected={ins.timeSlotsSelected}
                                                        />
                                                    )}
                                                    <button className="cursor-pointer" onClick={() => onRecoverInscription(ins)}><ArrowUp/></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                                        No se han anulado inscripciones
                                    </p>
                                )
                            }
                        </>
                    ) 
                }
            </div>

             {/* Resumen de inscripción */}
            <div className="flex justify-evenly text-lg font-semibold pt-4">
                <span><span className="text-[var(--brand-light)]">Ins. vigentes: </span><strong>{oldInscriptions.length}</strong></span>
                <span><span className="text-[var(--brand-light)]">Ins. por anular: </span><strong>{cancelledInscriptions.length}</strong></span>
            </div>
        </Card>
    )
}