// src/modules/user/membership/components/FamilyGrid.tsx
import React from "react";
import { FamilyCard, Familiar } from "./FamilyCard";

interface Props {
  items: Familiar[];
  /** Vuelve a llamar a fetchFamily cuando la exclusión se envió con éxito */
  refresh: () => void;
}

export default function FamilyGrid({ items, refresh }: Props) {
  return (
    <div className="grid grid-cols-3 gap-6 my-6 ">
      {items.map((fam) => (
        <FamilyCard key={fam.id} {...fam} onExcluded={refresh} />
      ))}
    </div>
  );
}
