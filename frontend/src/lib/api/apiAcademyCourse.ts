import { Evento } from "../../modules/employee/event/pages/detalleEvent"
import { MiembrosInscritos } from "../../modules/employee/event/components/Participantssection"
import { EventoSpace } from "../../modules/employee/event/components/EventsSection"
import { AcademyType } from "../../modules/employee/sports/components/AcademiesSection"
import { InscriptionEVent } from "../../modules/employee/sports/components/ParticipantsSection"
import { RawCourse } from "../../modules/employee/sports/components/AcademyInfoSection"
import { AcademiaItem } from "../../modules/employee/sports/components/FormAssignAcademyCourse"
import { CourseWithSchedules } from "../../modules/employee/sports/components/FormAssignAcademyCourse";

export async function getCoursesByAcademyId(id: string) {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/academyCourse/getCoursesByAcademyId/${id}`, {credentials: "include",});
    const data = await res.json();
    return data as CourseWithSchedules[];
}
