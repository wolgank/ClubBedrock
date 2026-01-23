// src/modules/employee/membership-suspension/components/SearchPanel.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SocioSearchModal, { Member } from "./SocioSearchModal";
import SuspendMembershipModal from "./SuspendMembershipModal";

interface SearchForm {
  apellido1: string;
  nombres:    string;
  codigo:     string;
  correo:     string;
  docTipo:    string;
  docNum:     string;
}

interface Props {
  action: "suspend" | "annul";
}

export default function SearchPanel({ action }: Props) {
  const [form, setForm]                       = useState<SearchForm>({
    apellido1: "",
    nombres:    "",
    codigo:     "",
    correo:     "",
    docTipo:    "",
    docNum:     "",
  });
  const [openSearch, setOpenSearch]           = useState(false);
  const [selectedMember, setSelectedMember]   = useState<Member | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (m: Member) => {
    setSelectedMember(m);
    setOpenSearch(false);
  };

  return (
    <>
      {/* ==== Formulario de Búsqueda ==== */}
      <form
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setOpenSearch(true);
        }}
      >
        <div>
          <Label>Apellidos</Label>
          <Input
            name="apellido1"
            value={form.apellido1}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Nombres</Label>
          <Input
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Código de socio</Label>
          <Input
            name="codigo"
            value={form.codigo}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Correo</Label>
          <Input
            name="correo"
            value={form.correo}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label>Tipo de documento</Label>
            <select
              name="docTipo"
              value={form.docTipo}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            >
              <option value="" className="dark:text-black">--</option>
              <option value="DNI" className="dark:text-black">DNI</option>
              <option value="Passport" className="dark:text-black">Pasaporte</option>
              <option value="CE" className="dark:text-black">CE</option>
            </select>
          </div>
          <div className="flex-1">
            <Label>Número de documento</Label>
            <Input
              name="docNum"
              value={form.docNum}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="md:col-span-3 text-right">
          <Button type="submit" className="button4-custom text-[var(--text-light)]">Buscar</Button>
        </div>
      </form>

      {/* ==== Modal de Búsqueda de Socio ==== */}
      {openSearch && (
        <SocioSearchModal
          params={form}
          onClose={() => setOpenSearch(false)}
          onSelect={handleSelect}
        />
      )}

      {/* ==== Modal de Acción (Suspender o Anular) ==== */}
      {selectedMember && (
        action === "annul" ? (
          <SuspendMembershipModal
            member={selectedMember}
            action={action}
            onClose={() => setSelectedMember(null)}
          />
        ) : (
          <SuspendMembershipModal
            member={selectedMember}
            action={action}
            onClose={() => setSelectedMember(null)}
          />
        )
      )}
    </>
  );
}