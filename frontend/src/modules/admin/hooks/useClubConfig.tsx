import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configSchema, ClubConfig } from "../schema/ConfigSchema";
import * as clubConfigService from "../services/ClubConfigService";
import * as uploadFile from "../../../shared/services/UploadService";
import { toast } from "sonner";

export const useClubConfig = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const form = useForm<ClubConfig>({
    resolver: zodResolver(configSchema),
  });
  const [config, setConfig] = useState<ClubConfig | null>(null);
  const { reset, getValues } = form;
  const { register, handleSubmit, watch, setValue } = form;
  useEffect(() => {
    (async () => {
      try {
        const data = await clubConfigService.fetchClubConfig();
        setConfig(data);
        reset(data);
      } catch (e) {
        console.error("Error al cargar configuración", e);
      }
    })();
  }, [reset]);

  const saveConfig = async () => {
    try {
      const formData = getValues();

      if (logoFile) {
        formData.logoUrl = await uploadFile.uploadImage(logoFile);
        //console.log("foto de logo subida!");
      }

      if (coverFile) {
        formData.portadaURL = await uploadFile.uploadImage(coverFile);
      }

      await clubConfigService.updateClubConfig(formData);
      toast.success("¡Configuración guardada exitosamente!");
    } catch (e) {
      console.error("Error al guardar configuración", e);
      toast.error("Error al guardar configuración");
    }
  };

  return {
    ...form,
    saveConfig,
    config,
    logoFile,
    setLogoFile,
    coverFile,
    setCoverFile,
  };
};
