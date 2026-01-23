# Documentación del Endpoint: Enviar Notificación por Correo

---

## POST `/api/notifications`

Envía un correo electrónico de notificación al usuario según el tipo especificado.

---

### 🔐 Autenticación

Este endpoint **requiere autenticación** mediante el middleware `authMiddleware`.

---

### 📥 Cuerpo del Request (JSON)

| Campo   | Tipo                | Descripción                                                  | Obligatorio |
|---------|---------------------|--------------------------------------------------------------|-------------|
| email   | `string`            | Correo electrónico del destinatario                          | Sí          |
| nombre  | `string`            | Nombre del usuario para personalizar el mensaje              | Sí          |
| tipo    | `string`            | Tipo de notificación. Debe ser uno de los valores soportados | Sí          |
| extra   | `object` (opcional) | Datos adicionales para la plantilla (depende del tipo)       | No          |

---

### 📑 Tipos de Notificación Soportados

| Tipo                | Descripción                                        | Campos `extra` necesarios                |
|---------------------|---------------------------------------------------|------------------------------------------|
| `bienvenida`        | Correo de bienvenida al usuario                    | Ninguno                                  |
| `inscripcionExitosa`| Confirmación de inscripción a un evento            | `evento` (string), `fecha` (string)      |
| `eliminacionInscripcion` | Notificación de cancelación de inscripción     | `evento` (string)                        |
| `solicitudAceptada` | Aceptación de solicitud a academia                 | `academia` (string)                      |
| `solicitudRechazada`| Rechazo de solicitud a academia                     | `academia` (string)                      |
| `recordatorioEvento` | Recordatorio de evento                              | `evento` (string), `fecha` (string), `hora` (string) |
| `eliminacionReserva` | Notificación de cancelación de reserva             | `espacio` (string) |
| `solicitudMembresiaAprobada` | Notificación de aprobacion de solic         | Ninguno |
| `solicitudMembresiaRechazada` | Notificación de rechazo de solic            | `motivo` (string) |
| `eliminarInscripcionAcademiaCurso` | Eliminación de inscripción a curso     | `curso` (string) |
| `confirmarInscripcionAcademiaCurso` | Confirmación de inscripción a curso     | `curso` (string), `fecha` (string)  |
---

### 📤 Ejemplo de Request

```json
{
  "email": "juan@example.com",
  "nombre": "Juan",
  "tipo": "inscripcionExitosa",
  "extra": {
    "evento": "Curso de IA",
    "fecha": "10 de junio a las 18:00"
  }
}
```
### 📦 Respuesta Exitosa (200 OK)

```json
{
  "message": "Correo enviado con éxito"
}
```
## ⚠️ Errores Comunes

| Código | Descripción                        | Causa común                              |
|--------|----------------------------------|-----------------------------------------|
| 400    | Tipo de notificación no soportado| Se envió un tipo inválido o no registrado |
| 401    | No autorizado                    | Falta o token de autenticación inválido  |
| 500    | Error al enviar correo           | Problema en el servidor o en el envío del correo |

## 📋 Flujo interno

1. Se recibe el request con datos del usuario y tipo de notificación.  
2. Se valida que el tipo exista entre las plantillas definidas.  
3. Se genera el asunto y mensaje usando la plantilla correspondiente.  
4. Se envía el correo vía `SMTPClient` conectado a Gmail.  
5. Se responde con éxito o error según corresponda.  

## ⚙️ Notas para el equipo Backend

- Las plantillas están definidas en `domain\notification_templates.ts`.  
- El controlador que maneja la petición es `notifications_controller.ts`.  
- Middleware de autenticación `authMiddleware` protege la ruta.  
- La ruta está expuesta en `/api/notifications`.


