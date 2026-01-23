// components/HorarioInput.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface Block {
  startDay: string;
  endDay: string;
  startTime: string;
  endTime: string;
}

interface HorarioInputProps {
  value: string;
  onChange: (val: string) => void;
}

export function HorarioInput({ value, onChange }: HorarioInputProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [startDay, setStartDay] = useState("");
  const [endDay, setEndDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const addBlock = () => {
    if (startDay && endDay && startTime && endTime) {
      const newBlocks = [...blocks, { startDay, endDay, startTime, endTime }];
      setBlocks(newBlocks);
      onChange(blocksToString(newBlocks));
      // Reset
      setStartDay(""); setEndDay(""); setStartTime(""); setEndTime("");
    }
  };

  const removeBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
    onChange(blocksToString(newBlocks));
  };

  const blocksToString = (blks: Block[]) =>
    blks.map(b => `${b.startDay}-${b.endDay} ${b.startTime}-${b.endTime}`).join(", ");

  return (
    <div className="space-y-4">
      <Label className="block">Horario de atención</Label>
      <div className="flex flex-wrap gap-4">
        <Select value={startDay} onValueChange={setStartDay}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="De" />
          </SelectTrigger>
          <SelectContent>
            {days.map(day => (
              <SelectItem key={day} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={endDay} onValueChange={setEndDay}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="A" />
          </SelectTrigger>
          <SelectContent>
            {days.map(day => (
              <SelectItem key={day} value={day}>{day}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="time"
          className="w-[120px]"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <Input
          type="time"
          className="w-[120px]"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <Button type="button" onClick={addBlock}>
          Agregar
        </Button>
      </div>

      <ul className="space-y-2">
        {blocks.map((b, i) => (
          <li key={i} className="flex items-center justify-between bg-muted px-4 py-2 rounded">
            <span>{`${b.startDay}-${b.endDay} ${b.startTime}-${b.endTime}`}</span>
            <Button variant="ghost" size="icon" onClick={() => removeBlock(i)}>
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      {/* Campo oculto o para que puedas ver el string resultante */}
      <Input readOnly value={value} className="mt-2" />
    </div>
  );
}
