// src/pages/RegistrationPage.tsx
import React, {
  useState,
  useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonalDataSection } from '../components/RegistrationPage/Form/PersonalDataSection';
import { ContactInfoSection } from '../components/RegistrationPage/Form/ContactInfoSection';
import { SpouseSection } from '../components/RegistrationPage/Form/SpouseSection';
import { SponsorsSection } from '../components/RegistrationPage/Form/SponsorSection';
import { DocumentsSection } from '../components/RegistrationPage/Form/DocumentsSection';
import { SuccessModal } from '../components/RegistrationPage/Others/SuccesModal';
import { SubmitSection } from '../components/RegistrationPage/Form/SubmitSection';

// src/pages/RegistrationPage.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { registrationSchema, RegistrationFormValues } from '../schemas/registrationSchema';
import { toast } from 'sonner';



interface MemberType { id: number; name: string; }
interface DocumentFormat {
  id: number;
  name: string;
  description: string;
  isForInclusion: boolean;
  memberTypeForDocument: number;
}

const uploadSingleFile = async (
  id: string,
  file: File,
  backendUrl: string
): Promise<{ id: string; fileName: string | null }> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${backendUrl}/files/uploadDoc`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) throw new Error('Error al subir archivo');

    const result = await res.json();
    //console.log(`Archivo subido (${id}):`, result);
    return { id, fileName: result.fileName };
  } catch (err) {
    console.error(`Falló la subida (${id}):`, err);
    return { id, fileName: null };
  }
};

// const deleteUploadedFile = async (fileName: string, backendUrl: string): Promise<boolean> => {
//   try {
//     const res = await fetch(`${backendUrl}/files/delete/${fileName}`, {
//       method: 'DELETE',
//       credentials: 'include',
//     });
//     if (!res.ok) throw new Error('No se pudo eliminar');
//     return true;
//   } catch (err) {
//     console.error('Error al eliminar archivo:', err);
//     return false;
//   }
// };


const RegistrationPage: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  //Define el formulario
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      docType: "DNI",
      docNumber: "",
      birthDate: undefined,
      names: "",
      surnames: "",
      address: "",
      workInfo: "",
      contactEmail: "",
      contactPhone: "",
      spouseDocType: "DNI",
      spouseDocNumber: "",
      spouseBirthDate: "",
      spouseNames: "",
      spouseSurnames: "",
      spouseEmail: "",
      spousePhone: "",
      spouseUsername: "",
      spousePassword: "",
      sponsor1Id: "",
      sponsor1Name: "",
      sponsor2Id: "",
      sponsor2Name: "",
      dynamicFiles: {},
    },
  });
  /* ---------- IDs dinámicos de member-type ---------- */
  const [memberTypeIds, setMemberTypeIds] = useState<{ titular?: number; cony?: number }>({});

  /* ---------- formatos ---------- */
  const [titularFormats, setTitularFormats] = useState<DocumentFormat[]>([]);
  const [spouseFormats, setSpouseFormats] = useState<DocumentFormat[]>([]);
  // const [dynamicFiles, setDynamicFiles] = useState<Record<number, File | null>>({});
  // const [uploadedFileNames, setUploadedFileNames] = useState<Record<number, string>>({});

  // 2. Obtén los estados del formulario
  const {
    watch,
    setValue,
    formState: { isSubmitting },
  } = form;

  // 3. Observa los campos del cónyuge para determinar si está lleno
  const spouseFields = watch([
    "spouseDocNumber",
    "spouseBirthDate",
    "spouseNames",
    "spouseSurnames",
    "spouseEmail",
    "spousePhone",
  ]);
  const isSpouseFilled = spouseFields.some((v) => v && v.trim() !== "");



  /* ---------- UI ---------- */
  // const [errors, setErrors] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [checkingExists, setCheckingExists] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  /* ═════════════════ OBTENER MEMBER-TYPES ═════════════════ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/member-types`, { credentials: 'include' });
        if (!res.ok) return;
        const list: MemberType[] = await res.json();

        const titular = list.find(m => m.name.toUpperCase().includes('TITULAR'));
        const cony = list.find(m => m.name.toUpperCase().includes('CÓNYUG') || m.name.toUpperCase().includes('CONYUG'));

        setMemberTypeIds({ titular: titular?.id, cony: cony?.id });
      } catch (err) {
        console.error('Error obteniendo member-types', err);
      }
    })();
  }, [backendUrl]);

// ═════════════════ FORMATOS TITULAR ═════════════════
useEffect(() => {
  if (!memberTypeIds.titular) return;

  (async () => {
    try {
      const r = await fetch(
        `${backendUrl}/api/member-types/${memberTypeIds.titular}/document-formats`,
        { credentials: 'include' }
      );
      if (r.ok) {
        const allFormats = await r.json();
        const inclusionFormats = allFormats.filter(f => f.isForInclusion);
        setTitularFormats(inclusionFormats);
      }
    } catch (e) {
      console.error('No se cargaron formatos titular', e);
    }
  })();
}, [backendUrl, memberTypeIds.titular]);

// ═════════════════ FORMATOS CÓNYUGE ═════════════════
useEffect(() => {
  if (!memberTypeIds.cony) return;
  if (!isSpouseFilled) {
    setSpouseFormats([]);
    return;
  }

  (async () => {
    try {
      const r = await fetch(
        `${backendUrl}/api/member-types/${memberTypeIds.cony}/document-formats`,
        { credentials: 'include' }
      );
      if (r.ok) {
        const allFormats = await r.json();
        const inclusionFormats = allFormats.filter(f => f.isForInclusion);
        setSpouseFormats(inclusionFormats);
      }
    } catch (e) {
      console.error('No se cargaron formatos cónyuge', e);
    }
  })();
}, [backendUrl, memberTypeIds.cony, isSpouseFilled]);
  /* ═════════════════ VERIFICAR SOLICITUD EXISTENTE ═════════════════ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/membership-applications/exists`,
          { credentials: 'include' });
        if (res.ok) {
          const raw = await res.json();
          const exists = typeof raw === 'boolean' ? raw : !!raw.exists;
          if (exists) {
            setAlreadyApplied(true);
            navigate('/');
            toast.error('Ya tienes una solicitud activa o pendiente.');
            
          }
        }
      } catch (err) { console.error('Error verificando solicitud', err); }
      finally { setCheckingExists(false); }
    })();
  }, [backendUrl, navigate]);


  /* ================================================================= */
  /* ---------------------- MANEJADORES ------------------------------ */
  /* ================================================================= */

const handleDynamicFile = async (
  archivos: { id: string; file: File }[]
) => {
    if (!archivos || archivos.length === 0) {
      throw new Error("No se proporcionaron archivos para subir.");
    }

    for (const { id, file } of archivos) {
      if (!(file instanceof File)) {
        throw new Error(`El archivo para el campo con ID "${id}" no es válido.`);
      }

      // Esta línea debe mantenerse sí o sí
      setValue(`dynamicFiles.${id}`, file);
    }
    // => Solo se tira (throw) para que pueda ser capturado por quien llame a esta función
};

  /* ================================================================= */
  /* --------------------------- SUBMIT ------------------------------ */
  /* ================================================================= */
  const onSubmit = async (data: RegistrationFormValues) => {
    if (alreadyApplied || checkingExists) return;
    try {

    const fileUploads = [];
    for (const [id, file] of Object.entries(data.dynamicFiles)) {
      if (file) {
        fileUploads.push(uploadSingleFile(id, file, backendUrl));
      }
    }

    if (fileUploads.length === 0) {
      throw new Error("No se han subido archivos. Por favor, suba los documentos requeridos.");
    }
    
      const uploadedFiles = await Promise.all(fileUploads);
    if(uploadedFiles.some(file => file.fileName === null)) {
        throw new Error("Algunos archivos no se pudieron subir. Por favor, inténtelo de nuevo.");
      }
      // Procesar los nombres de archivos subidos...
      //console.log("Que hay aqui", uploadedFiles)
      // Luego enviar el formulario principal

      const payload = {
        inclusion: {
          newMemberDocumentType: data.docType,
          newMemberDocumentId: data.docNumber,
          newMemberName: data.names,
          newMemberLastName: data.surnames,
          newMemberAddress: data.address,
          newMemberEmail: data.contactEmail,
          newMemberPhone: data.contactPhone,
          newMemberBirthDate: data.birthDate,
        },
        recommendation1: {
          subCodeInserted: data.sponsor1Id,
          namesAndLastNamesInserted: data.sponsor1Name,
        },
        recommendation2: {
          subCodeInserted: data.sponsor2Id,
          namesAndLastNamesInserted: data.sponsor2Name,
        },
        applicantJobInfo: data.workInfo,
        ...(isSpouseFilled && {
          partnerInclusion: {
            newMemberDocumentType: data.spouseDocType,
            newMemberDocumentId: data.spouseDocNumber,
            newMemberName: data.spouseNames,
            newMemberLastName: data.spouseSurnames,
            newMemberAddress: data.address,
            newMemberEmail: data.spouseEmail,
            newMemberPhone: data.spousePhone,
            newMemberBirthDate: data.spouseBirthDate,
          },
          partnerUsername: data.spouseUsername,
          partnerPassword: data.spousePassword,
        }),
      };

      const res = await fetch(
        `${backendUrl}/api/membership-applications/newMemberApplication`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Error ${res.status}`);
      }

      const datos = await res.json();

      const payloadDoc = {
        documents: uploadedFiles.map(doc => ({
          idDocumentFormat: Number(doc.id),
          fileName: doc.fileName,
        }))
      };


      const resDoc = await fetch(
        `${backendUrl}/api/member-requests/${datos.id}/documents`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloadDoc),
        }
      );


      if (!resDoc.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Error ${res.status}`);
      }


      setShowModal(true);
    } catch (err) {
      form.setError("root", {
        message: err.message || "Error de red",
      });
    }
  };
  /* ================================================================== */
  /* -------------------------- RENDER UI ----------------------------- */
  /* ================================================================== */
  return (
    <div className="container mx-auto px-4 py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded-lg shadow background-custom">
          <PersonalDataSection form={form} />
          <ContactInfoSection form={form} />
          <SpouseSection form={form} isSpouseFilled={isSpouseFilled} />
          <SponsorsSection form={form} />

          <DocumentsSection
            form={form}
            titularFormats={titularFormats}
            spouseFormats={spouseFormats}
            handleDynamicFile={handleDynamicFile}
            isSpouseFilled={isSpouseFilled}
          />

          <SubmitSection
            form={form}
            isSubmitting={isSubmitting}
            alreadyApplied={alreadyApplied}
            checkingExists={checkingExists}
          />
        </form>
      </Form>

      <SuccessModal showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default RegistrationPage;