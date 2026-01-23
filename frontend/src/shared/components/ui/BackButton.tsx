import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BackButton() {
    const navigate = useNavigate();
    return (
        <div className="relative w-full max-w-[1343px] ">
            <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="navigate-custom"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-normal text-base ">Regresar</span>
            </Button>
        </div>
    );
}