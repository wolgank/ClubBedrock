import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
//import EventFormSection from "../components/EventFormSection";
import NavigationSection from "../components/NavigationSpaces";
import { useNavigate } from 'react-router-dom';
import SpacesEventsSection from "../components/SpacesEventsSection";
import SpaceFormSection from "../components/SpaceFormSection";

export default function NuevoEvent() {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center gap-[35px] px-[34px] py-[57px]">
            <div className="relative w-full max-w-[1343px] ">
                <Button
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    className="navigate-custom"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="font-normal text-base">Regresar</span>
                </Button>
            </div>

            <div className="relative w-full max-w-[1343px] text-center">
                <SpacesEventsSection />
            </div>

            <div className="relative w-full max-w-[1343px] text-center">
                <NavigationSection />
            </div>
            <div className="relative w-full max-w-[1343px] text-center">
                <h1 className="font-bold text-5xl  leading-[48px]">
                    Nuevo Espacio
                </h1>
            </div>
            <main className="flex flex-wrap w-full max-w-[1339px] gap-10 p-[30px]  rounded-2xl overflow-hidden background-custom">
                <  SpaceFormSection />
            </main>
        </div >
    );
}