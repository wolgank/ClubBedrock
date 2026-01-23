import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdateMemberType } from "../hooks/useFamilyPolicy";
import { MemberTypeWithDocsInput } from "../schemas/FamilyPolicySchema";
import axios from "axios";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ConfigureFeeForm: React.ComponentType<{ open: boolean; onClose: () => void }> = ({ 
  open, 
  onClose 
}: Props) => {
  const updateMemberType = useUpdateMemberType();
  const [documents, setDocuments] = useState<{ 
    name: string; 
    description: string; 
    isForInclusion: boolean 
  }[]>([]);
  
  const [formData, setFormData] = useState({
    inclusionCost: "0",
    costInMembershipFee: "0",
  });
  
  const [newDoc, setNewDoc] = useState({ 
    name: "", 
    description: "", 
    isForInclusion: true 
  });

  useEffect(() => {
    if (!open) return;

    const loadTitularData = async () => {
      try {
        // Cargar datos del titular (siempre ID = 1)
        const { data: memberType } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/member-types/1`,
          { withCredentials: true }
        );

        // Cargar documentos del titular
        const { data: documents } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/member-types/1/document-formats`,
          { withCredentials: true }
        );

        setFormData({
          inclusionCost: memberType.inclusionCost?.toString() || "0",
          costInMembershipFee: memberType.costInMembershipFee?.toString() || "0",
        });

        setDocuments(documents?.map(doc => ({
          name: doc.name,
          description: doc.description || '',
          isForInclusion: doc.isForInclusion
        })) || []);
      } catch (error) {
        console.error("Error loading titular data:", error);
      }
    };

    loadTitularData();
  }, [open]);

  const addDocument = () => {
    if (!newDoc.name) return;
    setDocuments([...documents, newDoc]);
    setNewDoc({ name: "", description: "", isForInclusion: true });
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const data: MemberTypeWithDocsInput = {
      name: "Titular",
      description: "Titular de la membresía",
      inclusionCost: parseFloat(formData.inclusionCost) || 0,
      exclusionCost: 0,
      costInMembershipFee: parseFloat(formData.costInMembershipFee) || 0,
      canPayAndRegister: true,
      documentFormats: documents
    };

    try {
      await updateMemberType.mutateAsync({ id: 1, data }); // Siempre ID = 1 para el titular
      onClose();
    } catch (error) {
      console.error("Error updating titular data:", error);
    }
  };

  if (!open) return null;

  return (
    <div className="w-[600px]">
      <DialogHeader>
        <DialogTitle className="text-emerald-800 font-semibold">Configurar Cuota de Ingreso Titular</DialogTitle>
      </DialogHeader>
          <div>
            <Label>Monto de cuota de ingreso</Label>
            <Input
              placeholder="Monto de cuota de ingreso"
              value={formData.inclusionCost}
              onChange={(e) => setFormData({...formData, inclusionCost: e.target.value})}
              className="mt-1"
            />
            <Label>Monto de cuota de membresía</Label>
            <Input
              placeholder="Monto de cuota de membresía"
              value={formData.costInMembershipFee}
              onChange={(e) => setFormData({...formData, costInMembershipFee: e.target.value})}
              className="mt-2"
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-emerald-800 font-semibold">Documentos Obligatorios</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Estos documentos se pedirán a externos que deseen solicitar una membresía
            </p>

            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={doc.name} readOnly className="w-1/2" />
                  <Input value={doc.description} readOnly className="w-1/2" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{doc.isForInclusion ? "Inclusión" : "Exclusión"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator  className="m-4"/>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nombre del documento"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                />
                <Input
                  placeholder="Descripción"
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={newDoc.isForInclusion}
                    onChange={(e) => setNewDoc({ ...newDoc, isForInclusion: e.target.checked })}
                  />
                  Para inclusión?
                </label>
                <Button
                  variant="outline"
                  onClick={addDocument}
                  className="text-emerald-700 border-emerald-700 hover:bg-emerald-50"
                >
                  + Añadir documento
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={handleSubmit}
            >
              Guardar Cambios
            </Button>
          </div>
        {/* </div>
      </div> */}
    </div>
  );
};