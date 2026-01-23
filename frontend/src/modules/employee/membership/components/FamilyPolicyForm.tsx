import { useMemberTypes, useCreateMemberType, useUpdateMemberType, useDocumentFormatsForMemberType } from "../hooks/useFamilyPolicy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Info, Edit, Plus, Check, X } from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MemberTypeWithDocsInputSchema, DocumentFormatInputSchema, MemberTypeWithDocsInput } from "../schemas/FamilyPolicySchema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Props {
  open: boolean;
  onClose: () => void;
}


export const FamilyPolicyForm = ({ open, onClose }: Props) => {
  const queryClient = useQueryClient();
  const { data: memberTypes, isLoading } = useMemberTypes();
  const createMemberType = useCreateMemberType();
  const updateMemberType = useUpdateMemberType();
  
  const filteredMemberTypes = memberTypes?.filter(memberType => memberType.id !== 1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<MemberTypeWithDocsInput>({
    resolver: zodResolver(MemberTypeWithDocsInputSchema),
    defaultValues: {
      name: "",
      description: "",
      inclusionCost: 0,
      exclusionCost: 0,
      costInMembershipFee: 0,
      canPayAndRegister: false,
      documentFormats: [],
      active: true
    },
  });

  const handleSubmit = (values: MemberTypeWithDocsInput) => {
    values.active = true;
    //console.log("Valores a enviar:", values); 
    //console.log("Validación Zod:", MemberTypeWithDocsInputSchema.safeParse(values));
    if (editingId) {
      updateMemberType.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          form.reset();
          setEditingId(null);
          queryClient.invalidateQueries({ queryKey: ['member-types'] });
        }
      });
    } else {
      createMemberType.mutate(values, {
        onSuccess: () => {
          form.reset();
          setIsCreating(false);
          queryClient.invalidateQueries({ queryKey: ['member-types'] });
        }
      });
    }

  };

  const handleEdit = async (memberTypeId: number) => {
    setEditingId(memberTypeId);
    
    // Buscar el memberType en los datos existentes
    const memberType = filteredMemberTypes?.find(mt => mt.id === memberTypeId);
    if (!memberType) return;
    
    // Obtener los documentos para este memberType
    const { data: documents } = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/member-types/${memberTypeId}/document-formats`,{
        withCredentials: true,
      }
    );
    
    // Transformar a EditableMemberType
    const editableMemberType: MemberTypeWithDocsInput = {
      id: memberType.id,
      name: memberType.name || '',
      description: memberType.description || '',
      inclusionCost: memberType.inclusionCost || 0,
      exclusionCost: memberType.exclusionCost || 0,
      costInMembershipFee: memberType.costInMembershipFee || 0,
      canPayAndRegister: memberType.canPayAndRegister || false,
      documentFormats: documents?.map(doc => ({
        name: doc.name,
        description: doc.description || '',
        isForInclusion: doc.isForInclusion,
      })) || [],
      active: true
    };
    
    form.reset(editableMemberType);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    form.reset({
      name: "",
      description: "",
      inclusionCost: 0,
      exclusionCost: 0,
      costInMembershipFee: 0,
      canPayAndRegister: false,
      documentFormats: []
    });
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleRemoveDocument = (index: number) => {
    const currentDocs = form.getValues("documentFormats") || [];
    form.setValue("documentFormats", currentDocs.filter((_, i) => i !== index));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl text-emerald-800 font-semibold">
          Configuración de Tipos de Miembros
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-emerald-800 font-semibold">
            Tipos de Miembros y Parámetros
          </h3>
          {!isCreating && (
            <Button onClick={handleStartCreate} variant="outline" className="text-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Tipo
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm">Cargando tipos de miembros...</p>
        ) : (
          <div className="border rounded-md mt-2">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100">
                <tr className="text-muted-foreground">
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Inclusión⠀⠀ (S/)</th>
                  <th className="px-3 py-2">Exclusión⠀⠀ (S/)</th>
                  <th className="px-3 py-2">Cuota⠀⠀⠀⠀⠀ (S/)</th>
                  <th className="px-3 py-2">Puede pagar/registrar</th>
                  <th className="px-3 py-2">Documentos</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* Fila para creación */}
                {isCreating && (
                  <tr className="border-t bg-gray-50">
                    <td className="px-3 py-2">
                      <Input
                        {...form.register("name")}
                        placeholder="Nombre"
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        {...form.register("description")}
                        placeholder="Descripción"
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="1"
                        {...form.register("inclusionCost", { valueAsNumber: true })}
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="1"
                        {...form.register("exclusionCost", { valueAsNumber: true })}
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="1"
                        {...form.register("costInMembershipFee", { valueAsNumber: true })}
                        className="w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Switch
                        checked={form.watch("canPayAndRegister")}
                        onCheckedChange={(checked) => form.setValue("canPayAndRegister", checked)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-2">
                        {form.watch("documentFormats")?.map((doc, i) => (
                          <div key={i} className="flex flex-col">
                            <Input
                              placeholder="Nombre"
                              value={doc.name}
                              onChange={(e) => {
                                const newDocs = [...form.getValues("documentFormats")];
                                newDocs[i].name = e.target.value;
                                form.setValue("documentFormats", newDocs);
                              }}
                              className="text-xs"
                            />
                            <Input
                              placeholder="Descripción"
                              value={doc.description}
                              onChange={(e) => {
                                const newDocs = [...form.getValues("documentFormats")];
                                newDocs[i].description = e.target.value;
                                form.setValue("documentFormats", newDocs);
                              }}
                              className="text-xs"
                            />
                            <div className="flex gap-2 items-center mt-2">
                            <Switch
                              checked={doc.isForInclusion}
                              onCheckedChange={(val) => {
                                const newDocs = [...form.getValues("documentFormats")];
                                newDocs[i].isForInclusion = val;
                                form.setValue("documentFormats", newDocs);
                              }}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveDocument(i)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            form.setValue("documentFormats", [
                              ...(form.getValues("documentFormats") || []),
                              { name: "", description: "", isForInclusion: true},
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" /> Añadir doc
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          type="button"
                          onClick={()=>{
                            handleSubmit(form.getValues());
                          }}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={handleCancelCreate}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Filas existentes */}
                {filteredMemberTypes?.map((memberType) => {
                  const isEditing = editingId === memberType.id;
                  const formValues = form.getValues();

                  return (
                    <tr key={memberType.id} className="border-t">
                      {/* Nombre */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            {...form.register("name")}
                            defaultValue={formValues.name}
                            className="w-full"
                          />
                        ) : (
                          memberType.name
                        )}
                      </td>

                      {/* Descripción */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            {...form.register("description")}
                            defaultValue={formValues.description}
                            className="w-full"
                          />
                        ) : (
                          memberType.description
                        )}
                      </td>

                      {/* Costo Inclusión */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="1"
                            {...form.register("inclusionCost", { valueAsNumber: true })}
                            defaultValue={formValues.inclusionCost}
                            className="w-full"
                          />
                        ) : (
                          memberType.inclusionCost
                        )}
                      </td>

                      {/* Costo Exclusión */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="1"
                            {...form.register("exclusionCost", { valueAsNumber: true })}
                            defaultValue={formValues.exclusionCost}
                            className="w-full"
                          />
                        ) : (
                          memberType.exclusionCost
                        )}
                      </td>

                      {/* Costo en Cuota */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="1"
                            {...form.register("costInMembershipFee", { valueAsNumber: true })}
                            defaultValue={formValues.costInMembershipFee}
                            className="w-full"
                          />
                        ) : (
                          memberType.costInMembershipFee
                        )}
                      </td>

                      {/* CanPayAndRegister */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Switch
                            checked={form.watch("canPayAndRegister")}
                            onCheckedChange={(checked) => form.setValue("canPayAndRegister", checked)}
                          />
                        ) : memberType.canPayAndRegister ? (
                          <Badge variant="outline" className="border-green-500 text-green-600">Sí</Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500 text-red-600">No</Badge>
                        )}
                      </td>

                      {/* Documentos */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="space-y-2">
                            {form.watch("documentFormats")?.map((doc, i) => (
                              <div key={i} className="flex flex-col">
                                <Input
                                  placeholder="Nombre"
                                  value={doc.name}
                                  onChange={(e) => {
                                    const newDocs = [...form.getValues("documentFormats")];
                                    newDocs[i].name = e.target.value;
                                    form.setValue("documentFormats", newDocs);
                                  }}
                                  className="text-xs"
                                />
                                <Input
                                  placeholder="Descripción"
                                  value={doc.description}
                                  onChange={(e) => {
                                    const newDocs = [...form.getValues("documentFormats")];
                                    newDocs[i].description = e.target.value;
                                    form.setValue("documentFormats", newDocs);
                                  }}
                                  className="text-xs"
                                />
                                <div className="flex gap-2 items-center mt-2">
                                <Switch
                                  checked={doc.isForInclusion}
                                  onCheckedChange={(val) => {
                                    const newDocs = [...form.getValues("documentFormats")];
                                    newDocs[i].isForInclusion = val;
                                    form.setValue("documentFormats", newDocs);
                                  }}
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveDocument(i)}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                form.setValue("documentFormats", [
                                  ...(form.getValues("documentFormats") || []),
                                  { name: "", description: "", isForInclusion: true},
                                ])
                              }
                            >
                              <Plus className="w-4 h-4 mr-1" /> Añadir doc
                            </Button>
                          </div>
                        ) : (
                          <DocumentList memberTypeId={memberType.id} />
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              type="button"
                              onClick={form.handleSubmit(handleSubmit)}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              type="button"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(memberType.id)}
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// Componente auxiliar para mostrar la lista de documentos
const DocumentList = ({ memberTypeId }: { memberTypeId: number }) => {
  const { data: documents, isLoading } = useDocumentFormatsForMemberType(memberTypeId);

  if (isLoading) return <p>Cargando documentos...</p>;
  if (!documents || documents.length === 0) return <p className="text-muted-foreground">Ninguno</p>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="underline decoration-dotted cursor-help">
          {documents.length} documento(s)
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px]">
        <div className="space-y-1">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-medium">{doc.name}:</span>
              <span className="text-muted-foreground">{doc.description}</span>
              <Badge variant={doc.isForInclusion ? "default" : "secondary"} className="ml-auto">
                {doc.isForInclusion ? "Inclusión" : "Exclusión"}
              </Badge>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};