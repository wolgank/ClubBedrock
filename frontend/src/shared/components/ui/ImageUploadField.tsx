import { Controller, Control } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ImageUploader } from "./ImageUploader";

interface FormImageUploadProps {
  name: string;
  control: Control<any>;
  label?: string;
  disabled?: boolean;
  defaultImageUrl?: string | null;
}

export const ImageUploadField = ({
  name,
  control,
  label = "Imagen",
  disabled = false,
  defaultImageUrl,
}: FormImageUploadProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <ImageUploader
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              defaultImageUrl={defaultImageUrl}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};