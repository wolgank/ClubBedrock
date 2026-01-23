// src/services/AccountService.ts
export async function getAccountInfo(accountId: number) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/auth/accounts`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: {
    auth: { id: number; email: string };
    user:    { name: string; lastname: string };
  }[] = await res.json();

  //console.log("data: ", data);

  const entry = data.find((e) => e.auth.id === accountId);
  if (!entry) throw new Error("Cuenta no encontrada");

  return {
    email: entry.auth.email,
    nombre: `${entry.user.name} ${entry.user.lastname}`,
  };
}
