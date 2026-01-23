import { test, expect, beforeAll } from 'bun:test';
import { reservationSelectSchema } from '../../../db/schema/Reservation';
import {reservationInsertSchema} from '../../../db/schema/Reservation';
import type { CreateReservation } from '../../reservations/domain/reservation';
import { createReservationSchema } from '../../reservations/domain/reservation';

let authToken: string;
let createdReservationId: number;

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

test('POST /api/reservation crea una nueva reserva y devuelve campos válidos', async () => {
  const newReservation: CreateReservation = {
    name: 'New Reservation',
    date: '2026-07-01',
    startHour: '2026-07-01 10:00:00',
    endHour: '2026-07-01 12:00:00',
    capacity: 100,
    allowOutsiders: true,
    description: "Esta es una prueba",
    spaceId: 1,
  };

  const response = await fetch('http://127.0.0.1:3000/api/reservation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(newReservation),
  });
  expect(response.status).toBe(201);

  const createdReservation = await response.json();

  const parsedReservation = createReservationSchema.safeParse(createdReservation);
  expect(parsedReservation.success).toBe(true);
  //console.log('Reserva creada:', createdReservation);
}); 

test('GET /api/reservation devuelve una lista de reservas', async () => {
  const response = await fetch('http://127.0.0.1:3000/api/reservation', {
    headers: {
    'Authorization': authToken,
  },
});

  //console.log(response.status);
  expect(response.status).toBe(200);

  const reservations = await response.json();
  expect(Array.isArray(reservations)).toBe(true);
  //console.log('Lista de reservas:', reservations);
});

test('GET /api/reservation/:id devuelve una reserva válida', async () => {
  const response = await fetch('http://127.0.0.1:3000/api/reservation/1', {
    headers: {
    'Authorization': authToken,
  },
});

  expect(response.status).toBe(200);

  const reservation = await response.json();
  const parsed = createReservationSchema.safeParse(reservation);
  expect(parsed.success).toBe(true);
});

test('PUT /api/reservation/:id actualiza una reserva', async () => {
  const updatedData = {
    name: 'Reserva actualizada',
    date: '2026-07-02',
    startHour: '2026-07-02 14:00:00',
    endHour: '2026-07-02 16:00:00',
    capacity: 80,
    allowOutsiders: false,
    description: 'Actualización completa',
    spaceId: 1,
  };

  const response = await fetch('http://127.0.0.1:3000/api/reservation/5', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(updatedData),
  });

  expect(response.status).toBe(204);
  const check = await fetch('http://127.0.1:3000/api/reservation/5', {
    headers: {
      'Authorization': authToken,
    },
  });
  expect(check.status).toBe(200);
  const updated = await check.json() as { name: string };
  expect(updated.name).toBe('Reserva actualizada');
  //console.log('Reserva actualizada:', updated);
});

test('DELETE /api/reservation/:id elimina una reserva', async () => {
  createdReservationId = 7; // Cambia esto al ID de la reserva que deseas eliminar
  const response = await fetch(`http://127.0.0.1:3000/api/reservation/${createdReservationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': authToken,
    },
  });

  expect(response.status).toBe(204);

  // Verificar que la reserva ya no existe
  const check = await fetch(`http://127.0.0.1:3000/api/reservation/${createdReservationId}`);
  expect(check.status).toBe(404);
});
