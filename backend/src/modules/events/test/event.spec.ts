import { test, expect, beforeAll } from 'bun:test';
import { eventSelectSchema } from '../../../db/schema/Event';
import {eventInsertSchema} from '../../../db/schema/Event';
import type { CreateEvent } from '../../../modules/events/domain/event';
import { createEventSchema } from '../../../modules/events/domain/event';

let authToken: string;
let createdEventId: number;
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

test('POST /se crea un nuevo evento y devuelve campos válidos', async () => {
  const newEvent ={
    name: 'Image Event Con Image',
    date: '2026-07-01',
    startHour: '2026-07-01 8:00:00',
    endHour: '2026-07-01 9:00:00',
    spaceUsed: 'Conference Room',
    ticketPriceGuest: 55.00,
    ticketPriceMember: 20.00,
    capacity: 100,
    urlImage: '644a4e0f696a90aeb89b716d013797d8.jpg',
    isActive: true,
    description: 'A great new event.',
    allowOutsiders: true,
    numberOfAssistants: 0,
    reservationId: 1,
  };

  const response = await fetch('http://127.0.0.1:3000/events', {
    method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(newEvent),
      });
      expect(response.status).toBe(201);

      const created = await response.json() as { id: number };
      createdEventId = created.id;
    const parsedEvent = eventSelectSchema.safeParse(created);
    expect(parsedEvent.success).toBe(true);
});

test('GET /events devuelve una lista de eventos', async () => {
  const response = await fetch('http://127.0.0.1:3000/events',{
    method: 'GET',
    headers: {
      'Authorization': authToken,
    },
  });
  expect(response.status).toBe(200);

  const events = await response.json();
  expect(Array.isArray(events)).toBe(true);
  //console.log("Lista de eventos",events);
});

test('GET /events/:id devuelve un evento válido', async () => {
  const response = await fetch('http://127.0.0.1:3000/events/5');
  expect(response.status).toBe(200);

  const event = await response.json();
  const parsed = eventSelectSchema.safeParse(event);
  expect(parsed.success).toBe(true);
});

test('PUT /events/:id actualiza un evento', async () => {
  const idEvent = 2; // Cambia esto al ID del evento que deseas actualizar

  const updatedEvent = {
    name: 'Evento en la picina',
    date: '2027-07-02',
    startHour: '2026-07-02 15:00:00',
    endHour: '2026-07-02 17:00:00',
    spaceUsed: 'Main Hall',
    ticketPriceGuest: 65.00,
    ticketPriceMember: 25.00,
    capacity: 120,
    urlImage: 'http://example.com/new-image.jpg',
    isActive: false,
    description: 'Updated event details.',
    allowOutsiders: false,
    numberOfAssistants: 10,
    reservationId: 1,
  };

  const response = await fetch(`http://127.0.0.1:3000/events/${idEvent}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(updatedEvent),
  });

  expect(response.status).toBe(204);
  const check = await fetch(`http://127.0.0.1:3000/events/${idEvent}`);
  const updated = await check.json() as { name: string };
  expect(updated.name).toBe('Updated Event Name');
  //console.log('Evento actualizado:', updated);
});

test('DELETE /events/:id elimina un evento', async () => {
  const idEvent = 9; // Cambia esto al ID del evento que deseas eliminar
  const response = await fetch(`http://127.0.0.1:3000/events/${idEvent}`, {
    method: 'DELETE',
    headers: {
      'Authorization': authToken,
    },
  });

  expect(response.status).toBe(204);
  // Verifica que el evento ya no existe
  const check = await fetch(`http://127.0.0.1:3000/events/${idEvent}`);
  expect(check.status).toBe(404);
});