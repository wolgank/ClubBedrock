import { EventInfo } from "@/shared/types/Activities";
import { Member } from "@/shared/types/Person";
import { createContext, useContext } from "react";

type EventInscriptionContextType = {
    event: EventInfo,
    newInscriptions: Member[],
    cancelledInscriptions: Member[],
    newInscriptionsTotalCost: number
}

export const EventInscriptionContext = createContext<EventInscriptionContextType | null>(null);

export const useEventInscriptionContext = () => {
  const context = useContext(EventInscriptionContext);
  if (!context) throw new Error("useEventInscriptionContext debe ser usado en un componente hijo");
  return context;
};