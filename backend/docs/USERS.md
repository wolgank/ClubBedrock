````markdown
## Obtener cuenta y perfil por solicitud de membresía

**URL**: `GET /users/by-membership-application/:id`  
**Autenticación**: Sí (JWT)  

### Parámetros de ruta
- `id` (number, _requerido_): ID de la `membershipApplication`

### Descripción
Devuelve los datos de autenticación y, si existe, el perfil de usuario asociado a esa solicitud de membresía.

### Respuesta exitosa (200)
```json
{
  "auth": {
    "id": 123,
    "email": "usuario@dominio.com",
    "username": "usuario123",
    "role": "member",
    "isActive": true,
    "oauthProvider": null,
    "googleId": null
  },
  "user": {
    "id": 456,
    "name": "Juan",
    "lastname": "Pérez",
    "documentType": "DNI",
    "documentID": "12345678",
    "phoneNumber": "912345678",
    "birthDate": "1990-01-01",
    "gender": "male",
    "address": "Av. Ejemplo 123",
    "profilePictureURL": "https://..."
  }
}
````

### Error 404

```json
{ "message": "Not Found" }
```

```
```


# Bulk Upload de Miembros

Permite cargar por lote **membresías** y **miembros** a través de un archivo Excel (.xlsx) con dos pestañas:

* **Membresías**
* **Miembros**

---

## Endpoint

```
POST /api/users/bulk-upload
```

**Autenticación**: Necesita enviar la cookie `token` generada por el login.
**Content‑Type**: `multipart/form-data`

| Campo  | Descripción      |
| ------ | ---------------- |
| `file` | El archivo Excel |

---

## Formato del Excel

### 1) Hoja **“Membresías”**

Encabezados **exactos** (fila 1):

| A                      | B                      | C                                                    |
| ---------------------- | ---------------------- | ---------------------------------------------------- |
| Código de la membresía | Estado de la membresía | Fecha fin de membresía (solo si aplica) (dd/mm/yyyy) |

* **Código**: string no vacío, máx 255 caracteres
* **Estado**: `"ACTIVE"` o `"ENDED"`
* **Fecha fin**: (opcional) si `ENDED`, debe ser `dd/mm/yyyy` o fecha de Excel; si falta, se asume hoy.

### 2) Hoja **“Miembros”**

Encabezados **exactos** (fila 1):

| A       | B         | C           | D                                     | E                   | F                  | G                   | H                    | I         | J                                          | K                      | L                                     |
| ------- | --------- | ----------- | ------------------------------------- | ------------------- | ------------------ | ------------------- | -------------------- | --------- | ------------------------------------------ | ---------------------- | ------------------------------------- |
| Email\* | Nombres\* | Apellidos\* | Tipo de documento (DNI,CE o PASSPORT) | Número de documento | Número de teléfono | Fecha de nacimiento | Género (M, F u Otro) | Dirección | Tipo (TITULAR, CÓNYUGUE, HIJO, PRIMO, etc) | Código de la membresía | Código de miembro (puede dejar vacío) |

* **Email\***: debe contener `@`.
* **Nombres\***, **Apellidos\***: no vacíos, máx 100 caracteres.
* **Tipo de documento**: `"DNI"`, `"CE"` o `"PASSPORT"`.
* **Número de documento**: no vacío, máx 50.
* **Teléfono**: no vacío, máx 50.
* **Fecha de nacimiento**: formato `dd/MM/yyyy`; debe ser mayor de 18 años.
* **Género**: `"M"`, `"F"` o `"Otro"` (otros valores se vacían y generan *warning*).
* **Dirección**: opcional.
* **Tipo**: rol dentro de la membresía, uno de:

  * `"TITULAR"` (obligatorio que exista al menos un TITULAR por membresía)
  * `"CÓNYUGUE"`, `"HIJO"`, `"PRIMO"`, etc.
* **Código de la membresía**: debe coincidir con alguno de los códigos de la Hoja “Membresías”.
* **Código de miembro**: opcional; si se deja vacío se genera automáticamente.

---

## Cómo funciona

1. **Validación de encabezados**: Si faltan o cambian nombres de columna, se devuelve **400** con mensaje de error.
2. **Lectura de filas**:

   * Se ignoran las filas de “Miembros” sin email.
   * Se parsean fechas (`dd/MM/yyyy` → `Date`).
3. **Inserción en BD** (transacción única):

   * Crea o actualiza cada membresía.
   * Para cada miembro:

     1. Crea `Auth`, `User`, `Member` y su relación `membership_x_member` (con fecha de fin solo si el estado es ENDED).
     2. Genera una contraseña al azar y la **acumula**.
4. **Envío de correos**:

   * Solo tras confirmar la transacción.
   * Cada mail incluye la contraseña generada.
   * Fallos de SMTP **no** revierten la BD: se devuelven como *warnings*.

---

## Respuesta

* **200 OK**

  ```json
  {
    "message": "Carga completada",
    "warnings": [
      "Membresía fila 2: código truncado",
      "Miembro fila 5: género inválido → vaciado",
      "Error enviando a pepe@example.com: Timeout del servidor SMTP"
    ]
  }
  ```
* **400 Bad Request** (validación Excel)

  ```json
  { "error": "Hoja “Miembros”: columna 3 debe ser “Apellidos*”" }
  ```
* **500 Internal Server Error** (errores inesperados)

  ```json
  { "error": "Error al procesar transacción: Conexión a BD fallida" }
  ```

---

### Notas de validación

* **Membresías ACTIVE**: `endDate` será ignorada
* **Membresías ENDED**: si falta `endDate`, se asume la fecha de carga
* **Miembros**:

  * Si la fecha de nacimiento no tiene el formato correcto o el miembro es menor de 18, la fila **falla completamente** y aborta la carga.
  * Otros errores (género inválido, subCode faltante) generan *warnings* y dejan la carga continuar.

---

Cualquier duda, contáctanos. (soy solo yo a la 1:30 AM)


