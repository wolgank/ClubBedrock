import { Member } from "@/shared/types/Person";
import { useEffect, useState } from "react";
import useEventInscriptionCheck from "../../event-list/hooks/UseEventInscriptionCheck";
import { EventInfo } from "@/shared/types/Activities";

export default function useEventInitialInscriptions(members: Member[], event: EventInfo) {
    const [initialInscriptions, setInitialInscriptions] = useState<Member[] | null>(null);
    const [loadingInitialInscriptions, setLoadingInitialInscriptions] = useState(true);
    const { inscribedList, loadingInscribed } = useEventInscriptionCheck(event);

    useEffect(() => {
        const fetchInitialInscriptions = async () => {
            setLoadingInitialInscriptions(true);
            setInitialInscriptions(null);

            if(!members || !event || loadingInscribed || !inscribedList) return;

            setInitialInscriptions(members.filter(
                member => inscribedList[member.id.toString()]
            ));
            setLoadingInitialInscriptions(false);
        }

        fetchInitialInscriptions();
    }, [event, inscribedList, loadingInscribed, members]);

    return { initialInscriptions, loadingInitialInscriptions};
}