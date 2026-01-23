import { useCallback, useState } from "react";
import { type Member } from "@/shared/types/Person";
import { UserPlus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import RemoveInscriptionModal from "@/shared/modals/RemoveInscriptionModal";
import { AcademyCourseInscription } from "../../../utils/Academies";
import CourseDaySelection from "../modals/CourseDaySelection";
import { useCourseInscriptionContext } from "./CourseInscriptionContext";
import { toast } from "sonner";
import CourseSchedule from "./CourseSchedule";

type NewCourseInscriptionPanelProps = {
    availableMembers: Member[],
    isInscriptionValid: (inscription: AcademyCourseInscription) => boolean,
    onAddInscription: (inscription: AcademyCourseInscription) => void,
    onRemoveInscription: (memberIdToRemove: number) => void
};

export default function NewCourseInscriptionPanel({ availableMembers, isInscriptionValid, onAddInscription, onRemoveInscription } : NewCourseInscriptionPanelProps) {
    const [memberSearchText, setMemberSearchText] = useState("");
    const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
    const [flexibleInscriptionMember, setFlexibleInscriptionMember] = useState<Member | null>(null);
    const { course, newInscriptions, newInscriptionsTotalCost } = useCourseInscriptionContext();

    const handleAddNewInscription = useCallback((member: Member) => {
        if(course.courseType === 'FIXED') {
            const inscription = {
                member,
                timeSlotsSelected: [],
                pricingToApply: course.pricing[0]
            };

            if(isInscriptionValid(inscription)) {
                onAddInscription(inscription);
                //console.log("inscripcion tomada como valida:", inscription);
            } else {
                toast.error("No puede anular una inscripción y volver a registrar una igual. Seleccione a otra persona.");
            }
        } else {
            setFlexibleInscriptionMember(member);
        }
    }, [course.courseType, course.pricing, isInscriptionValid, onAddInscription]);

    return (
        <Card className="background-custom rounded-[10px] shadow-lg w-full max-w-2xl p-6 flex flex-col justify-between h-[450px]">
            <div className="space-y-4">
                
                {/* Titulo */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--brand)]">Nuevas inscripciones</h2>
                </div>

                {/* Agregar socios a la inscripción */}
                <div
                    className="w-2/3 relative"
                    tabIndex={-1}
                    onFocus={() => setShowMemberSuggestions(true)}
                    onBlur={() => setShowMemberSuggestions(false)}
                >
                {/* Texto de buscador */}
                <div className="flex items-center relative">
                    <UserPlus size={40} strokeWidth={2} className="bg-transparent p-2 absolute"/>
                    <input
                        type="search" placeholder="Ingrese el nombre del socio a inscribir"
                        className="flex-1 shadow dark:shadow-gray-700 p-2 pl-12 text-sm"
                        value={memberSearchText}
                        onChange={(e) => setMemberSearchText(e.target.value)}
                    />
                </div>
                {/* Sugerencias */}
                {showMemberSuggestions &&
                    <ul className="bg-[var(--bg-light-alt)] dark:bg-[var(--color-gray-800)] z-10 absolute w-full border shadow max-h-44 overflow-auto divide-y">
                        { availableMembers.length > 0 ? (
                            <>
                                {availableMembers
                                    .filter((member) => 
                                        member.name.concat(member.lastname).toLowerCase().includes(memberSearchText.toLowerCase())
                                    )
                                    .map((member) => (
                                        <li key={member.id} className="flex justify-between items-center p-2">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{member.name} {member.lastname}</span>
                                                <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">{member.memberType}</span>
                                            </div>
                                            <button
                                                className="px-2 py-1 rounded cursor-pointer hover:bg-amber-50 dark:hover:bg-gray-700"
                                                onMouseDown={() => handleAddNewInscription(member)}
                                            >
                                                Agregar
                                            </button>
                                        </li>
                                    ))
                                }
                            </>
                        ) : (
                            <li key="no-available-members" className="flex justify-between items-center p-2">
                                Sin socios disponibles
                            </li>
                        )}
                    </ul>}
                </div>

                {/* Listado de socios inscritos */}
                <div>
                    {newInscriptions.length > 0 ? (
                            <ul className="divide-y text-sm max-h-52 overflow-auto mt-2">
                                {newInscriptions.map((ins) => (
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
                                            <button className="cursor-pointer" onClick={() => setMemberToRemove(ins.member)}><X size={16} /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-gray-500 dark:text-gray-400">
                                Sin nuevas inscripciones
                            </p>
                        )
                    }
                </div>

                {/* Modal de especificación de horario */}
                { flexibleInscriptionMember &&
                    <CourseDaySelection
                        course={course}
                        member={flexibleInscriptionMember}
                        onConfirm={(ins) => {
                            if(isInscriptionValid(ins)) {
                                onAddInscription(ins);
                                setFlexibleInscriptionMember(null);
                            } else {
                                toast.error("No puede anular una inscripción y volver a registrar una igual. Seleccione otros días u otra persona.");
                            }
                        }}
                        onClose={() => setFlexibleInscriptionMember(null)}
                    />
                }

                {/* Modal de quitado de socios */}
                { memberToRemove &&
                    <RemoveInscriptionModal
                        member={memberToRemove}
                        onRemove={() => {
                            onRemoveInscription(memberToRemove.id);
                            setMemberToRemove(null);
                        }}
                        onCancel={() => setMemberToRemove(null)}
                    />
                }

            </div>

            {/* Resumen de inscripción */}
            <div className="flex justify-evenly text-lg font-semibold pt-4">
                <span><span className="text-[var(--brand-light)]">Ins. nuevas: </span><strong>{newInscriptions.length}</strong></span>
                <span><span className="text-[var(--brand-light)]">Total a pagar: </span><strong>S/. {newInscriptionsTotalCost}</strong></span>
            </div>
        </Card>
    )
}