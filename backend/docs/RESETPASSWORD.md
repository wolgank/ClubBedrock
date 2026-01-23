## POST `http://localhost:3000/auth/forgot-password`

**Autenticación requerida:** No

Envía un correo de recuperación de contraseña al usuario con el token correspondiente. Este token será válido por 15 minutos.

---

### Descripción de la operación

1. Verifica que exista una cuenta con el correo electrónico proporcionado.
2. Genera un token JWT con los siguientes datos:
   - `sub`: ID de la cuenta
   - `email`: correo electrónico
   - `type`: `"password_reset"`
   - `exp`: tiempo de expiración (15 minutos desde la generación)
3. Registra el token en la base de datos con fecha de expiración.
4. Envía el token por correo electrónico para que el usuario pueda restablecer su contraseña.

---

### Ejemplo de input

```json
{
  "email": "usuario@dominio.com"
}
```

---

### Ejemplo de output

```json
{
  "message": "Se ha enviado un correo con instrucciones para restablecer tu contraseña."
}
```

---

### Errores comunes

* `404 Not Found`
  - `"Account not found"` – No existe ninguna cuenta con ese correo.

* `500 Internal Server Error`
  - `"Failed to create password reset token"` – No se pudo guardar el token.
  - `"Internal server error"` – Error inesperado en el sistema.

---

## POST `http://localhost:3000/auth/reset-password`

**Autenticación requerida:** No

Permite al usuario restablecer su contraseña utilizando un token válido previamente enviado por correo.

---

### Descripción de la operación

1. Verifica que el token JWT sea válido y no haya expirado.
2. Comprueba que el token esté registrado en la base de datos y no haya sido usado.
3. Hashea la nueva contraseña utilizando el algoritmo configurado.
4. Actualiza la contraseña del usuario en la base de datos.
5. Marca el token como "usado" para evitar reutilización.

---

### Ejemplo de input

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NuevaContrasenaSegura123"
}
```

---

### Ejemplo de output

```json
{
  "message": "Contraseña restablecida exitosamente",
}
```

---

### Errores comunes

* `400 Bad Request`
  - `"Invalid token"` – El token es inválido o no tiene el campo `sub`.
  - `"Invalid or expired token"` – El token no está registrado o ha expirado.

* `404 Not Found`
  - `"Account not found"` – No se encontró la cuenta asociada al token.

* `500 Internal Server Error`
  - `"Failed to reset password"` – Error al actualizar la contraseña.
  - `"Failed to mark password reset token as used"` – No se pudo marcar el token como utilizado.
