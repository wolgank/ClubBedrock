import { useEffect, useState } from "react";
import { AcademyCourseInscription } from "../../../utils/Academies";
import { useUser } from "@/shared/context/UserContext";
import { toast } from "sonner";
import { Member } from "@/shared/types/Person";
import { AcademyCourse } from "@/shared/types/Activities";
import { weekDayNumber } from "../../../utils/utils";

type InscriptionData = {
    id: number,
    userId: number,
    selectedDays: number[]
}

export default function useCourseInitialInscriptions(members: Member[], course: AcademyCourse) {
    const [initialInscriptions, setInitialInscriptions] = useState<AcademyCourseInscription[] | null>(null);
    const [loadingInitialInscriptions, setLoadingInitialInscriptions] = useState(true);

    const { user } = useUser();

    

    useEffect(() => {
        const fetchCourseInitialInscriptions = async () => {
            setLoadingInitialInscriptions(true);
            setInitialInscriptions(null);

            if(!members || !course) return;

            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");

                const req = {
                    "userIds": members.map(member => member.id),
                    "academyCourseId": course.id
                }

                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyInscription/inscriptions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(req)
                });

                if(!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Error ${res.status}: No se pudo obtener las inscripciones previas`);
                }

                const data = await res.json() as InscriptionData[];
                //console.log("initialInscripcions (data)", data);

                setInitialInscriptions(data.map(insData => {
                    const id = insData.id;
                    const member = members.find(member => member.id === insData.userId);
                    const timeSlotsSelected = course.courseType === 'FIXED'
                        ? []
                        : insData.selectedDays.map(
                            dayNum => course.schedule.find(timeSlot => weekDayNumber[timeSlot.day] === dayNum)
                        );
                    
                    const pricingToApply = course.courseType === 'FIXED'
                        ? course.pricing[0]
                        : course.pricing.find(pr => Number(pr.numberDays) === insData.selectedDays.length);


                    return { id, member, timeSlotsSelected, pricingToApply };
                }));
            }
            catch(err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error("Error al obtener cursos de la academia: ", msg);
                toast.error(msg);
            }
            finally {
                setLoadingInitialInscriptions(false);
            }
        }

        fetchCourseInitialInscriptions();
    }, [course, members, user?.id]);

    return { initialInscriptions, loadingInitialInscriptions };
}