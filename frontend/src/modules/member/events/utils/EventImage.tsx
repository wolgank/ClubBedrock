import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventInfo } from "@/shared/types/Activities";

type EventImageProps = {
    loading: boolean,
    event: EventInfo
}

export default function EventImage({ event, loading } : EventImageProps) {
    return (
        <Card className="w-full md:h-96 p-2 flex flex-col justify-center background-custom">
            {loading || !event ? (
                <Skeleton className="w-full h-full rounded-xl bg-amber-50/70 dark:bg-gray-700" />
            ) : (
                <img
                    src={event.urlImage}
                    alt="Evento principal"
                    className="rounded-xl shadow-lg object-cover w-full h-full"
                />
            )}
        </Card>
    );
}