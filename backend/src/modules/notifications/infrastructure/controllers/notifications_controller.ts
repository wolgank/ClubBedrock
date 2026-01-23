import type { Context } from 'hono';
import { enviarCorreo } from '../../application/notifications_service';
import { plantillasCorreo } from '../../domain/notification_templates';

export async function notificacionHandler(c: Context) {
  try {
    const { email, nombre, tipo, extra } = await c.req.json();

    if (!plantillasCorreo[tipo]) {
      return c.json({ error: 'Tipo de notificación no soportado' }, 400);
    }

    const { subject, message } = plantillasCorreo[tipo]({ nombre, extra });

    await enviarCorreo({ to: email, subject, message });

    return c.json({ message: 'Correo enviado con éxito' });
  } catch (err) {
    console.error('Error en notificacionHandler:', err);
    return c.json({ error: 'Error al enviar correo' }, 500);
  }
}