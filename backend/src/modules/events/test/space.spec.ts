import { test, expect, beforeAll } from 'bun:test';
import { spaceSelectSchema } from '../../../db/schema/Space';
import type { CreateSpace } from '../domain/space';

let authToken: string;
let createdSpaceId: number;

beforeAll(async () => {
  const loginResponse = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123',
    }),
  });

  expect(loginResponse.status).toBe(200);
  const data = await loginResponse.json() as { token: string };
  authToken = `Bearer ${data.token}`;
});

test('POST /api/space crea un nuevo espacio y devuelve campos válidos', async () => {
  const newSpace: CreateSpace = {
    name: 'Test Space',
    description: 'Test description',
    reference: 'Test reference',
    capacity: 50,
    urlImage: 'http://example.com/test.jpg',
    costPerHour: '40.00',
    canBeReserved: true,
    isAvailable: true,
    type: 'LEISURE',
  };

  const response = await fetch('http://127.0.0.1:3000/api/space', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(newSpace),
  });

  expect(response.status).toBe(201);

  const created = await response.json() as { id: number };
  createdSpaceId = created.id; // Guardamos el ID para las siguientes pruebas

  const parsed = spaceSelectSchema.safeParse(created);
  expect(parsed.success).toBe(true);
});

test('GET /api/space devuelve una lista de espacios', async () => {
  const response = await fetch('http://127.0.0.1:3000/api/space', {
    headers: {
      'Authorization': authToken,
    },
  });

  expect(response.status).toBe(200);
  const spaces = await response.json();
  expect(Array.isArray(spaces)).toBe(true);
  //Muestra la lista de espacios
  //console.log('Lista de espacios:', spaces);
});

test('GET /api/space/:id devuelve un espacio válido', async () => {
  const response = await fetch('http://127.0.0.1:3000/api/space/1');
  expect(response.status).toBe(200);
  const space = await response.json();
  const parsed = spaceSelectSchema.safeParse(space);
  expect(parsed.success).toBe(true);
  // Muestra el espacio
  //console.log('Espacio:', space);
});

test('PUT /api/space/:id actualiza un espacio', async () => {
  const updatedData = {
    name: 'Updated Space',
    description: 'Updated description',
    reference: 'Updated ref',
    capacity: 80,
    urlImage: 'http://example.com/updated.jpg',
    costPerHour: '100.00',
    canBeReserved: false,
    isAvailable: false,
    type: 'LEISURE',
  };

  const response = await fetch('http://127.0.0.1:3000/api/space/3', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(updatedData),
  });

  expect(response.status).toBe(204);
  const Verifica = await fetch('http://127.0.0.1:3000/api/space/3');
  expect(Verifica.status).toBe(200);
  const updated = await Verifica.json() as { name: string };
  expect(updated.name).toBe('Updated Space');
});

test('DELETE /api/space/:id elimina un espacio', async () => {
  createdSpaceId=5; // Cambia esto al ID del espacio que deseas eliminar
  const response = await fetch(`http://127.0.0.1:3000/api/space/${createdSpaceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': authToken,
    },
  });

  expect(response.status).toBe(204);

  // Verifica que ya no existe
  const checkResponse = await fetch(`http://127.0.0.1:3000/api/space/${createdSpaceId}`);
  expect(checkResponse.status).toBe(404);
});
