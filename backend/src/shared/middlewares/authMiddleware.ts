// src/middlewares/authMiddleware.ts
import { verify } from 'hono/jwt'; // Usa la de Hono para JWT
import { env } from 'hono/adapter';
import { getCookie } from 'hono/cookie';
export const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const token = getCookie(c, 'token');
  if (!token) {
    return c.json({ message: 'No token cookie found' }, 401);
  }
  //console.log('🔍 Token extraído de la cookie:', token);
  try {
    const { JWT_SECRET } = env(c); // Asumiendo que lo tienes en variables de entorno
    const payload = await verify(token, JWT_SECRET);
    // Puedes guardar los datos del usuario en c.var si quieres usarlos luego
    c.set('account', payload);
    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return c.json({ message: 'Invalid or expired token' }, 401);
  }
};
