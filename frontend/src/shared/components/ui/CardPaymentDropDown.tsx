import { AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccordionItem } from "@radix-ui/react-accordion";
import { CreditCard } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

type CardPaymentDropDownProps = {
    loadingPayment: boolean,
    onPay: () => void
}

type CardInfo = {
    number: string,
    code: string,
    endDate: string,
    name: string
}

export default function CardPaymentDropDown({ loadingPayment, onPay } : CardPaymentDropDownProps) {
    const [cardInfo, setCardInfo] = useState<CardInfo>({
        number: "",
        code: "",
        endDate: "",
        name: ""
    })

    const prevDateValueRef = useRef("");

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const prevValue = prevDateValueRef.current;

        // => Solo se permiten dígitos y slash
        value = value.replace(/[^\d/]/g, '');

        // => Se detecta si se está borrando
        const isDeleting = value.length < prevValue.length;

        // => Se autoformatea solo si se están escribiendo los dos dígitos del mes
        if (!isDeleting && value.length === 2 && !value.includes('/')) {
            value = value + '/';
        }

        // => Limita a 7 caracteres
        if (value.length > 7) {
            value = value.slice(0, 7);
        }

        // => Actualiza el valor anterior
        prevDateValueRef.current = value;

        // => Actualiza el state respectivo
        setCardInfo((prev) => ({
            ...prev,
            endDate: value
        }));
    };

    const isValidDate = (val: string) => {
        const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
        if (!regex.test(val)) return false;

        const [month, year] = val.split('/').map(Number);
        const now = new Date();
        const inputDate = new Date(year, month - 1);

        return inputDate >= new Date(now.getFullYear(), now.getMonth());
    };

    const handleCardPayment = (e: React.FormEvent) => {
        e.preventDefault();
        // Validación de datos
        // => Número de tarjeta (16 dígitos, todos númericos)
        if(!/^\d{16}$/.test(cardInfo.number)) {
            toast.error("El número de tarjeta debe ser de exactamente 16 dígitos númericos.")
            return
        }

        // => CVV/CVC (Entre 3 y 4 dígitos)
        if(!/^\d{3,4}$/.test(cardInfo.code)) {
            toast.error("El CVV/CVC debe tener entre 3 y 4 dígitos numéricos.")
            return
        }

        // => Fecha de vencimiento
        if(!isValidDate(cardInfo.endDate)) {
            toast.error("Fecha de vencimiento inválida. Verifique que los meses y años sean correctos para el formato mm/yyyy y que la fecha no sea anterior a la actual.")
            return
        }

        // => Nombre de titular
        if(cardInfo.name.trim().length === 0 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(cardInfo.name)) {
            toast.error("El nombre del titular de la tarjeta solo debe contener caracteres alfabéticos y espacios.")
            return
        }

        onPay();
    }

    return (
        <AccordionItem className="background-custom rounded-xl" value="pago-tarjeta">
            {/* Cabecera del acordeón */}
            <AccordionTrigger className="px-3">
                <div className="flex items-center gap-2">
                    <CreditCard size={20} />
                    <span className="font-medium">Tarjeta de Débito / Crédito</span>
                </div>
            </AccordionTrigger>

            {/* Contenido desplegable */}
            <AccordionContent>
                <form onSubmit={handleCardPayment} className="space-y-3 p-4 rounded-b-[10px]">
                    <div>
                        <label htmlFor="NumeroTarjeta" className="text-sm font-medium">Número de Tarjeta</label>
                        <Input
                            id="NumeroTarjeta"
                            type="text"
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            required={true}
                            className="w-full border rounded-lg px-3 py-2 border-[#cccccc] mt-1"
                            value={cardInfo.number}
                            onChange={(e) => setCardInfo((prev) => {
                                return {
                                    ...prev,
                                    number: e.target.value
                                }
                            })}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label htmlFor="CVV/CVC" className="text-sm font-medium">No. CVV/CVC</label>
                            <Input
                                id="CVV/CVC"
                                type="text"
                                placeholder="XXX"
                                required={true}
                                className="w-full border rounded-lg px-3 py-2 border-[#cccccc] mt-1"
                                value={cardInfo.code}
                                onChange={(e) => setCardInfo((prev) => {
                                    return {
                                        ...prev,
                                        code: e.target.value
                                    }
                                })}
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="FechaVencimiento" className="text-sm font-medium">Válido hasta</label>
                            <Input
                                id="FechaVencimiento"
                                type="text"
                                placeholder="mm/yyyy"
                                required={true}
                                className="w-full border rounded-lg px-3 py-2 border-[#cccccc] mt-1"
                                value={cardInfo.endDate}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="Nombre" className="text-sm font-medium">Nombre</label>
                        <Input
                            id="Nombre"
                            type="text"
                            placeholder="Nombre"
                            required={true}
                            className="w-full border rounded-lg px-3 py-2 border-[#cccccc] mt-1"
                            value={cardInfo.name}
                            onChange={(e) => setCardInfo((prev) => {
                                return {
                                    ...prev,
                                    name: e.target.value
                                }
                            })}
                        />
                    </div>
                    <Button
                        className="w-full mt-1 text-[var(--text-light)] cursor-pointer button3-custom"
                        type="submit"
                        disabled={loadingPayment}
                    >
                        { loadingPayment ? "..." : "Realizar pago" }
                    </Button>
                </form>
            </AccordionContent>
        </AccordionItem>
    )
}