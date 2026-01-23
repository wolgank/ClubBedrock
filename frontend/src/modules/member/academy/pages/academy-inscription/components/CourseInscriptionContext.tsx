import { AcademyCourse } from "@/shared/types/Activities";
import { AcademyCourseInscription } from "../../../utils/Academies";
import { createContext, useContext } from "react";

type CourseInscriptionContextType = {
    course: AcademyCourse | null,
    newInscriptions: AcademyCourseInscription[],
    cancelledInscriptions: AcademyCourseInscription[],
    newInscriptionsTotalCost: number
}

export const CourseInscriptionContext = createContext<CourseInscriptionContextType | null>(null);

export const useCourseInscriptionContext = () => {
  const context = useContext(CourseInscriptionContext);
  if (!context) throw new Error("useCourseInscriptionContext debe ser usado en un componente hijo");
  return context;
};