import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, X, Users } from "lucide-react";
import { ReservaInformacionBasica } from "../pages/Reservas"
// Define data for the component
const grillData = {
    title: "Parrilla Norte",
    date: "Domingo 28 de Abril",
    starHour: "07:00",
    endHour: "09:00",
    location: "Complejo recreativo",
    capacity: 20,
    price: 20,
    description:
        "La zona de parrilla norte es un área especialmente acondicionada para disfrutar reuniones al aire libre en un ambiente cómodo y funcional. Cuenta con parrillas de acero inoxidable, mesas amplias con bancos de madera, techado parcial para protección solar, y un área de lavado equipada con lavadero y agua corriente. También dispone de iluminación adecuada para uso nocturno y tomacorrientes accesibles para pequeños electrodomésticos. Es ideal para encuentros familiares, asados con amigos o celebraciones informales.",
};
interface Props {
    reserva: ReservaInformacionBasica
    onClose: () => void
}
export default function InfoEspacioReservModal({ reserva, onClose }: Props) {
    function extraerHoras(rango: string): { horaInicial: string, horaFinal: string } {
        // Dividir la parte de la hora por la coma
        const partes = rango.split(', ');
        if (partes.length < 2) {
            throw new Error("Formato de fecha/hora inválido");
        }

        // Obtener la parte que contiene las horas: "10:00 - 12:00"
        const horas = partes[1];

        // Separar por " - " para obtener hora inicial y final
        const [horaInicial, horaFinal] = horas.split(" - ");

        return {
            horaInicial,
            horaFinal
        };
    }
    function extraerFecha(cadena: string): string {
        // Divide por coma y toma la primera parte
        const partes = cadena.split(', ');
        return partes[0]; // "17 agosto de 2025"
    }

    return (
        <Card className="flex flex-col items-start justify-center px-9 py-8 rounded-xl background-custom">
            <CardContent className="p-0">
                <div className="flex items-center justify-between pl-3 pr-0 ">
                    <h1 className="font-bold text-[40.5px] text-[#142e38]  leading-[48.6px] dark:text-[var(--primary)]">
                        {reserva.title}
                    </h1>

                    <div className="inline-flex items-center justify-center p-2" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </div>
                </div>

                <div className="flex items-start gap-2.5 px-2.5">
                    <div className="flex flex-col h-[397px] items-center justify-center gap-2.5 p-2.5" >
                        <img
                            className="w-[446px] h-[324px] object-cover rounded-xl image-custom"
                            alt="Parrilla Norte"
                            src={reserva.urlImage}
                        />
                    </div>

                    <div className="flex flex-col w-[458px] items-start p-2.5">
                        <div className="inline-flex items-start gap-2.5 p-2.5">
                            <h2 className="font-bold text-xl text-[#142e38] tracking-[-0.60px] leading-[24.0px] dark:text-[var(--primary)]">
                                {extraerFecha(reserva.date)}
                            </h2>
                        </div>

                        <div className="flex items-center gap-2.5 px-3 w-full ">
                            <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5 w-[180px]">
                                <Clock className="w-6 h-6" />
                                <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                    {extraerHoras(reserva.date).horaInicial + " - " + extraerHoras(reserva.date).horaFinal + " hs"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5 p-2.5">
                                <MapPin className="w-6 h-6" />
                                <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                    {reserva.location}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 px-3 w-full">
                            <div className="inline-flex items-center gap-2.5 pl-0 pr-2.5 py-2.5 w-[180px] ">
                                <Users className="w-6 h-6" />
                                <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                    {reserva.capacity + " personas"}
                                </span>
                            </div>

                            {/* <div className="flex items-center gap-2.5 p-2.5">
                                <div className="relative w-6 h-6">
                                    <span className="absolute top-0.5 left-1 font-bold text-base tracking-[-0.48px] leading-[19.2px] ">
                                        S/
                                    </span>
                                </div>
                                <span className="font-bold text-base text-[#142e38] tracking-[-0.48px] leading-[19.2px] dark:text-[var(--primary)]">
                                    {reserva.constPerHour}
                                </span>
                            </div> */}
                        </div>
                        <div className="flex items-start justify-center gap-2.5 p-2.5 w-full">
                            <p className="w-[410px] font-medium text-sm text-[#142e38] tracking-[-0.42px] leading-[19.6px] text-justify dark:text-[var(--primary)]">
                                {reserva.description}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}