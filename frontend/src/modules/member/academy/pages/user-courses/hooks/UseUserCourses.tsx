import { useEffect, useState } from "react";
import useAcademies from "../../academy-list/hooks/UseAcademies";
import { UserCourseInscription } from "../../../utils/Academies";
import { AcademyCourse } from "@/shared/types/Activities";
import { useUser } from "@/shared/context/UserContext";
import { toast } from "sonner";
import { weekDayNumber } from "../../../utils/utils";

type UserCourseResponse = {
    inscribedCourses: {
        course: AcademyCourse,
        selectedDays: number[]
    } []
}

export default function useUserCourses() {
    const { academies, loadingAcademies } = useAcademies();
    const [userCourses, setUserCourses] = useState<UserCourseInscription[] | null>(null);
    const [loadingUserCourses, setLoadingUserCourses] = useState(true);

    const { user } = useUser();

    useEffect(() => {
        const fetchUserCourses = async () => {
            setLoadingUserCourses(true);
            setUserCourses(null);

            if(loadingAcademies || !academies) return;

            try {
                if(!user?.id) throw new Error("No se pudo obtener el ID del usuario autenticado.");
    
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyInscription/historicUserId/${user.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                        
                if(!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.message || `Error ${res.status}: No se pudo obtener el historial de cursos`)
                }
                
                const data = await res.json() as UserCourseResponse;
                //console.log("aver el historial de cursos: ", data.inscribedCourses);
                
                setUserCourses(data.inscribedCourses.map(ins => {
                    return {
                        academy: academies.find(acad => acad.id === ins.course.academyId),
                        course: ins.course,
                        timeSlotsSelected: ins.course.courseType === 'FIXED'
                            ? ins.course.schedule
                            : ins.selectedDays.map(day => {
                                return ins.course.schedule.find(timeSlot => day === weekDayNumber[timeSlot.day])
                            }) 
                    } as UserCourseInscription
                }));
            }
            catch (err: unknown) {
                setUserCourses([]);
                const msg = err instanceof Error ? err.message : 'Error desconocido';
                console.error('Error al obtener el historial de cursos:', msg);
                toast.error(msg);
            }
            finally {
                setLoadingUserCourses(false);
            }
        }

        fetchUserCourses();
    }, [academies, loadingAcademies, user?.id]);

    return { userCourses, loadingUserCourses };
}