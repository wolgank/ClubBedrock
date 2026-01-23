import { test, expect } from 'bun:test';
import { authSelectSchema } from '../../../db/schema/Auth'; // Ajusta si tu esquema está en otra ruta

const PORT = 3000;

test('POST /auth/register debe registrar un nuevo usuario y devolverlo con campos válidos', async () => {
  const newAccount = {
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN', // O el valor que corresponda en tu enum
  };

  const response = await fetch(`http://localhost:${PORT}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newAccount),
  });


  expect(response.status).toBe(201);

  const createdAccount = (await response.json()) as { account: unknown };
  //console.log('Created account:', createdAccount.account);

  // Validamos el account creado usando el esquema Zod
  const parsedAccount = authSelectSchema.safeParse(createdAccount.account);
  if (!parsedAccount.success) {
    //console.log('Validation errors:', parsedAccount.error.errors);
  }

  expect(parsedAccount.success).toBe(true); // La validación debe ser exitosa
});


test('POST /auth/login debe iniciar sesión correctamente con credenciales válidas', async () => {
  const loginData = {
    email: 'admin@example.com',
    password: 'password123',
  };

  const response = await fetch(`http://localhost:${PORT}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData),
  });
  expect(response.status).toBe(200);
  
  const loginResponse = (await response.json()) as { token: string };
  ////console.log('Login response:', loginResponse);

  // Esperamos que devuelva un token o algo que indique éxito
  expect(loginResponse).toHaveProperty('token');
  expect(typeof loginResponse.token).toBe('string');
});

test('POST /auth/login debe fallar con credenciales incorrectas', async () => {
  const wrongLoginData = {
    email: 'newuser@example.com',
    password: 'wrongpassword',
  };

  const response = await fetch(`http://localhost:${PORT}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(wrongLoginData),
  });

  expect(response.status).toBe(401); // Asumiendo que devuelves 401
});

