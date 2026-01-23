import { accountSchema, Account, RegisterAccountInput, registerAccountSchema, baseAuthSchema, BaseAuth, UpdateAccountInput } from "../schema/AccountSchema";
import {z} from "zod";
import { DefaultAccount, defaultAccountSchema } from "../schema/DefaultAccountSchema";
//---------GET ALL -------------------------
export async function getAllAccounts(): Promise<{
  valid: Account[];
  invalid: { item: unknown; errors: z.ZodIssue[] }[];
}> {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/accounts`, {
    method: "GET",
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const rawData = await res.json();
  const valid: Account[] = [];
  const invalid: { item: Account; errors: z.ZodIssue[] }[] = [];

  for (const item of rawData) {
    const result = accountSchema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ item, errors: result.error.issues });
    }
  }
  return { valid, invalid };
}

//---------DELETE -------------------------
export async function logicalDeleteAccount(accountId: number): Promise<boolean> {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/auth/delete/${accountId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  //console.log(response);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error ${response.status}: ${response.statusText}`
    );
  }

  return true;
}

//---------GET ONE -------------------------
export async function getAccountById(accountId: number): Promise<DefaultAccount> {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/${accountId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  const rawData = await res.json();
  // Validación y transformación en un solo paso
  return defaultAccountSchema.parse(rawData);
}

//---------UPDATE -------------------------
export async function updateAccount(updates: UpdateAccountInput): Promise<void> {
  console.log("[Service] Payload enviado:", JSON.stringify(updates));
  
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/updateAllDetails`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.message || `Error ${res.status}: ${res.statusText}`
    );
  }

  // Si llegas aquí, fue exitoso.
}

//---------REGISTER -------------------------
export async function registerAccount(registerData: RegisterAccountInput) {
  //console.log("hola");
    try {
        // Validamos los datos antes de enviarlos
        //console.log("data register",registerData);
        const parsedData = registerAccountSchema.parse(registerData);  // Aquí se valida que los datos estén en el formato correcto
        //console.log("data parsed",parsedData);
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData), // Enviamos los datos validados
        });

        if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
            errorData?.message || `Error ${res.status}: ${res.statusText}`
        );
        }

        const rawData = await res.json();
        return rawData;  // Aquí ya podemos retornar los datos o procesarlos más
    } catch (error) {
    if (error instanceof z.ZodError) {
      // Si el error es de Zod, lo manejamos específicamente
      throw new Error(`Errores de validación: ${error.errors.map(e => e.message).join(', ')}`);
    }
    // Si no es un error de Zod, lo lanzamos como está (puede ser un error de la API)
    const prettyMessage = formatZodMessageFromString(error.message);
    throw prettyMessage ? new Error(prettyMessage) : error;
  }
}


export function formatZodMessageFromString(message: string): string {
  if (typeof message !== "string") return "Ocurrió un error inesperado.";

  const camposTraducidos: Record<string, string> = {
    documentID: "Documento de identidad",
    documentType: "Tipo de documento",
    email: "Correo electrónico",
    password: "Contraseña",
    name: "Nombre",
    lastname: "Apellido",
    birthDate: "Fecha de nacimiento",
    gender: "Género",
    phoneNumber: "Teléfono",
    username: "Usuario",
    profilePictureURL: "Foto de perfil",
    address: "Dirección",
  };

  const traducirMensaje = (msg: string): string => {
    if (msg.includes("must contain at least 1 character")) return "Este campo es obligatorio.";
    if (msg.includes("must be a valid email")) return "Debe ser un correo electrónico válido.";
    if (msg.includes("must be a valid URL")) return "Debe ser un enlace válido.";
    if (msg.includes("must be a valid date")) return "Debe ser una fecha válida.";
    if (msg.includes("must be at least")) return "Tiene muy pocos caracteres.";
    if (msg.includes("must be at most")) return "Tiene demasiados caracteres.";
    if (msg.includes("Invalid enum value")) return "Valor no permitido.";
    return msg; // Por defecto, deja el mensaje original
  };

  // Detecta si contiene errores tipo Zod serializados
  if (message.includes("[") && message.includes("path")) {
    try {
      const jsonArrayStr = message.match(/\[.*\]/s)?.[0];
      if (jsonArrayStr) {
        const parsedErrors = JSON.parse(jsonArrayStr);
        const pretty = parsedErrors
          .map((e: any) => {
            const campo = e.path?.[0];
            const nombreCampo = camposTraducidos[campo] || campo;
            const mensaje = traducirMensaje(e.message);
            return `• ${nombreCampo}: ${mensaje}`;
          })
          .join("\n");
        return pretty;
      }
    } catch (e) {
      console.warn("No se pudo parsear el mensaje JSON del error:", e);
    }
  }

  return message || "Ocurrió un error inesperado.";
}

