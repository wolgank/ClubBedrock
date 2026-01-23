## Crear solicitud de inclusión familiar

**URL:**  
`POST /member-requests/new-familiar`

**Descripción:**  
Registra una nueva solicitud para incluir a un familiar como miembro.  
- Primero crea una cuenta `Auth`+`User` con rol `GUEST`.  
- Luego crea un registro en `member_request` y otro en `member_inclusion_request` asociado a ese user.

**Middleware:**  
`authMiddleware` (requiere JWT válido en cookie `token`)

**Cuerpo de la petición (JSON):**

| Campo            | Tipo    | Obligatorio | Descripción                                                      |
|------------------|---------|-------------|------------------------------------------------------------------|
| `documentType`   | string  | sí          | `"DNI" \| "CE" \| "PASSPORT"`                                    |
| `documentId`     | string  | sí          | Número de documento del nuevo miembro                             |
| `birthDate`      | string  | sí          | Fecha de nacimiento (formato ISO 8601)                             |
| `names`          | string  | sí          | Nombres del nuevo miembro                                          |
| `lastnames`      | string  | sí          | Apellidos del nuevo miembro                                        |
| `memberTypeId`   | number  | sí          | ID del `MemberType` al que pertenece este familiar                |
| `email`          | string  | sí          | Correo para la nueva cuenta `Auth`                                 |
| `username`       | string  | sí          | Nombre de usuario para la nueva cuenta `Auth`                      |
| `password`       | string  | sí          | Contraseña para la nueva cuenta `Auth`                              |
| `phone`          | string  | no          | Teléfono del nuevo miembro                                          |
| `reason`         | string  | sí          | Motivo de la solicitud de inclusión                                 |

documentType (string, obligatorio) – Uno de: "DNI", "CE", "PASSPORT".

documentId (string, obligatorio) – Número de documento.

birthDate (fecha, obligatorio) – Fecha de nacimiento (YYYY-MM-DD).

names (string, obligatorio) – Nombres del nuevo miembro.

lastnames (string, obligatorio) – Apellidos del nuevo miembro.

memberTypeId (integer, obligatorio) – ID del tipo de miembro (p.ej. “TITULAR” o “CÓNYUGUE”).

email (string, obligatorio) – Correo que se usará para la cuenta Auth.

username (string, obligatorio) – Nombre de usuario para la nueva cuenta.

password (string, obligatorio) – Contraseña para la nueva cuenta.

phone (string, opcional) – Teléfono del nuevo miembro.

reason (string, obligatorio) – Motivo breve de la solicitud.

**Ejemplo:**

```json
{
  "documentType": "DNI",
  "documentId": "12345678",
  "birthDate": "1990-05-20",
  "names": "Juan",
  "lastnames": "Pérez",
  "memberTypeId": 2,
  "email": "juan.perez@example.com",
  "username": "juanperez",
  "password": "passwordSegura123",
  "phone": "987654321",
  "reason": "Incluir cónyuge"
}
```
Respuesta exitosa (201):

{
  "memberRequestId": 42
}
memberRequestId es el ID del nuevo registro en member_request.

Códigos de respuesta:

201 Created – Solicitud procesada con éxito; retorna { memberRequestId }.

400 Bad Request – Validación Zod fallida o error de negocio (p.ej. correo ya registrado, memberTypeId inválido).

401 Unauthorized – JWT ausente o inválido.

500 Internal Server Error – Error inesperado en el servidor.

> **Nota importante:**  
> - La llamada a `AuthService.register` se hace **antes** de la transacción para crear la cuenta. Si por alguna razón el proceso interno de creación de usuario o solicitud falla luego, la cuenta `Auth` ya se habrá creado.  
> - Si necesitas que todo (Auth + User + solicitudes) se deshaga atomically en caso de error, tendrías que adaptar `AuthService.register` para aceptar un `tx` y usar la misma transacción de Drizzle. En la implementación mostrada, la cuenta `Auth` se crea fuera de ese `tx`, por simplicidad.  
> - Ajusta el enum `documentType` en tiempo de compilación de Zod para que coincida exactamente con tu definición real.




# Endpoints de solicitudes de membresía

## POST /member-requests/excludeFamiliar

**Descripción**  
Crea una nueva solicitud para excluir a un familiar (miembro) de la membresía.

**Headers**  
- `Authorization: Bearer <token>` (cookie `token`, validado por `authMiddleware`)

**Body (JSON)**  
```json
{
  "memberToExclude": 123,        // Identificador del miembro a excluir
  "reasonToExclude": "Motivo..." // Razón de la exclusión (max 250 caracteres)
}
memberToExclude (integer, obligatorio): ID del miembro que se desea excluir.

reasonToExclude (string, obligatorio): Explicación de la exclusión.

Respuesta exitosa (201)

{
  "requestId": 42
}

requestId: ID del member_request recién creado que acoge la solicitud de exclusión.

Errores comunes

400 Bad Request: Si el body no pasa la validación Zod.

400 Bad Request: Si falla la creación en base de datos.

401 Unauthorized: Si falta o es inválido el JWT/Cookie.
```

## GET `/member-requests/family`

**Descripción**  
Devuelve todas las solicitudes de inclusión y exclusión familiar que haya generado el miembro actualmente autenticado.  
Cada elemento del arreglo incluye:

- `requestId` (integer): ID de la `member_request`.
- `isForInclusion` (boolean): `true` o `false`, indica que es solicitud de inclusión.
- `referencedFullName` (string): nombre completo del usuario referenciado en la inclusión.
- `submissionDate` (date|null): fecha de envío de la solicitud.
- `requestState` (string|null): estado actual de la solicitud (`PENDING`, `REJECTED`, `APPROVED`, etc.).
- `memberTypeName` (string): nombre del `member_type` solicitado (p.ej. “TITULAR” o “CÓNYUGUE”).

**Headers**  
- `Authorization: Bearer <token>` (JWT emitido al iniciar sesión; validado por `authMiddleware`).

**Respuesta Exitosa (200)**  
```json
[
  {
    "requestId": 42,
    "isForInclusion": true,
    "referencedFullName": "María López",
    "submissionDate": "2024-05-12T00:00:00.000Z",
    "requestState": "PENDING",
    "memberTypeName": "CÓNYUGUE"
  },
  {
    "requestId": 37,
    "isForInclusion": false,
    "referencedFullName": "Pedro Gómez",
    "submissionDate": "2024-04-20T00:00:00.000Z",
    "requestState": "APPROVED",
    "memberTypeName": "HIJO"
  }
]
```

## GET `/member-requests/family-all-manager`

**Descripción**  
Devuelve TODAS las solicitudes de inclusión **y** exclusión familiar existentes, para que un manager las revise.  
Cada objeto del arreglo incluye:

- `requestId` (integer): ID de la `member_request`.
- `isForInclusion` (boolean):  
  - `true` → solicitud de inclusión familiar.  
  - `false` → solicitud de exclusión familiar.
  - `requestinMemberId` (integer): id del miembro que hizo la solicitud.  
- `requestingMemberName` (string): nombre del miembro que hizo la solicitud.  
- `requestingMemberLastName` (string): apellido del miembro que hizo la solicitud.  
- `familiarName` (string): nombre del familiar involucrado.  
- `familiarLastName` (string): apellido del familiar involucrado.  
- `relationship` (string): nombre del `MemberType` (p.ej. “CÓNYUGUE”, “HIJO”, etc.).  
- `submissionDate` (date|null): fecha en que se envió la solicitud.  
- `requestState` (string|null): estado actual de la solicitud (`PENDING`, `REJECTED`, `APPROVED`, etc.).  
- `reason` (string):  
  - Para inclusión: proviene de `member_request.reason`.  
  - Para exclusión: proviene de `member_exclusion_request.reasonToExclude`.

**Headers**  
- `Authorization: Bearer <token>` (JWT validado por `authMiddleware`).

**Respuesta Exitosa (200)**  
```json
[
  {
    "requestId": 102,
    "isForInclusion": true,
    "requestinMemberId":1,
    "requestingMemberName": "Ana",
    "requestingMemberLastName": "Gómez",
    "familiarName": "Pedro",
    "familiarLastName": "Gómez",
    "relationship": "HIJO",
    "submissionDate": "2024-06-12T00:00:00.000Z",
    "requestState": "PENDING",
    "reason": "Quiero inscribir a mi hijo"
  },
  {
    "requestId": 98,
    "isForInclusion": false,
    "requestinMemberId":2,
    "requestingMemberName": "Miguel",
    "requestingMemberLastName": "Ramírez",
    "familiarName": "Laura",
    "familiarLastName": "Ramírez",
    "relationship": "CÓNYUGUE",
    "submissionDate": "2024-06-10T00:00:00.000Z",
    "requestState": "APPROVED",
    "reason": "Exclusión por divorcio"
  }
]


## GET /member-requests/:id/detail

**Descripción**  
Retorna el detalle completo de una sola petición (`member_request`) ya sea de **inclusión** o **exclusión** familiar.

**Parámetros**  
- `id` (path): ID de la solicitud (`member_request.id`).

**Headers**  
- `Authorization: Bearer <token>` (JWT validado por `authMiddleware`).

**Respuesta (200 OK)**  
```json
{
  "requestId": 123,
  "isForInclusion": true,
  "requestingMemberId": 45,
  "requestingMemberSubCode": "MEM-00045",
  "requestingMemberName": "Juan",
  "requestingMemberLastName": "Pérez",
  "requestingMemberMembershipId": 78,
  "requestingMemberMembershipState": "ACTIVE",
  "familiarDocumentType": "DNI",
  "familiarDocumentId": "12345678",
  "familiarBirthDate": "2010-05-20T00:00:00.000Z",
  "familiarName": "María",
  "familiarLastName": "Pérez",
  "memberTypeId": 3,
  "memberTypeName": "HIJO",
  "reason": "Quiero inscribir a mi hija",
  "familiarEmail": "maria@example.com",
  "familiarPhone": "987654321",
  "submissionDate": "2024-06-15T00:00:00.000Z",
  "requestState": "PENDING"
}

En caso de exclusión, isForInclusion vendrá como false y los campos del familiar se llenarán con los datos del miembro a excluir.

Códigos de estado

200 OK → Se encontró y devolvió el detalle correctamente.

400 Bad Request → Si id no es un número válido.

404 Not Found → Si no existe ninguna member_request con ese id.

500 Internal Server Error → Cualquier otro error del servidor/DB.
---

**Nota**:  
- El `requestingMemberMembershipId` y `requestingMemberMembershipState` corresponden a la membresía activa (sin `endDate`) del solicitante, o `null` si no se encuentra.
- En eliminación, el campo `reason` proviene de `member_exclusion_request.reasonToExclude`.  
- En inclusión, el campo `reason` es `member_request.reason`.
```

## GET `/member-requests/:id/detail`

**Descripción**  
Retorna el detalle completo de una sola petición (`member_request`) ya sea de **inclusión** o **exclusión** familiar.

**Parámetros**  
- `id` (path): ID de la solicitud (`member_request.id`).


**Respuesta (200 OK)**  
```json
{
  "requestId": 123,
  "isForInclusion": true,
  "requestingMemberId": 45,
  "requestingMemberSubCode": "MEM-00045",
  "requestingMemberName": "Juan",
  "requestingMemberLastName": "Pérez",
  "requestingMemberMembershipId": 78,
  "requestingMemberMembershipState": "ACTIVE",
  "familiarDocumentType": "DNI",
  "familiarDocumentId": "12345678",
  "familiarBirthDate": "2010-05-20T00:00:00.000Z",
  "familiarName": "María",
  "familiarLastName": "Pérez",
  "memberTypeId": 3,
  "memberTypeName": "HIJO",
  "reason": "Quiero inscribir a mi hija",
  "familiarEmail": "maria@example.com",
  "familiarPhone": "987654321",
  "submissionDate": "2024-06-15T00:00:00.000Z",
  "requestState": "PENDING"
}
En caso de exclusión, isForInclusion vendrá como false y los campos del familiar se llenarán con los datos del miembro a excluir.

Códigos de estado

200 OK → Se encontró y devolvió el detalle correctamente.

400 Bad Request → Si id no es un número válido.

404 Not Found → Si no existe ninguna member_request con ese id.

500 Internal Server Error → Cualquier otro error del servidor/DB.

markdown
Copiar
Editar
---

**Nota**:  
- El `requestingMemberMembershipId` y `requestingMemberMembershipState` corresponden a la membresía activa (sin `endDate`) del solicitante, o `null` si no se encuentra.
- En eliminación, el campo `reason` proviene de `member_exclusion_request.reasonToExclude`.  
- En inclusión, el campo `reason` es `member_request.reason`.
```




## Aprobar `memberRequest`

**URL:**  
## POST `/member-requests/:id/approve`
**Autenticación:**  
Se requiere JWT válido (middleware `authMiddleware`).

**Parámetros de ruta:**  
- `:id` (integer): ID de la solicitud (`memberRequest`) a aprobar.

**Lógica interna:**  
1. Marca `memberRequest.requestState = APPROVED (2)`.  
2. Si la solicitud es de **inclusión** (`memberInclusionRequest` existe):
   - Obtiene el `idUserReferenced` y el `newMemberType`.
   - Halla la membresía activa del solicitante (`membershipXMember.endDate IS NULL`).
   - Genera un `subCode` para el nuevo miembro (basado en el código de la membresía y el conteo actual de miembros).
   - Inserta `member` con `{ id: idUserReferenced, subCode, isActive: true, memberTypeId }`.
   - Inserta `membershipXMember` para vincular el nuevo miembro a la membresía, `startDate = ahora`.
   - Crea una **factura** (“CUOTA DE INGRESO”) sobre el titular (`bill`) y un `billDetail` con `price = inclusionCost`.
   - Llama a `addNewMemberFeeToMembership(newMemberId)` para generar un ticket adicional de cuota mensual.

3. Si la solicitud es de **exclusión** (`memberExclusionRequest` existe):
   - Obtiene `memberToExclude`.
   - Actualiza el registro activo en `membershipXMember` estableciendo `endDate = ahora` y `reasonToEnd = DISAFFILIATION (2)`.

**Respuesta exitosa (200):**  
```json
{ "requestId": 123 }
Errores comunes (400):

"ID inválido": si :id no es un número.

"MemberRequest no encontrada": si no existe.

"La solicitud no es ni de inclusión ni de exclusión": si el id no corresponde a ningún subregistro en memberInclusionRequest o memberExclusionRequest.

"Membresía activa no encontrada para el miembro proporcionado": si el solicitante no tiene una membresía activa al aprobar inclusión.

Otros errores de integración (e.g., no crear factura, no crear detalle de factura).
**Explicación de campos relevantes:**

- `memberRequest`  
  - `id`: Identificador de la solicitud.  
  - `requestState`: Se actualiza a `APPROVED (2)`.  
  - `idRequestingMember`: El miembro que hizo la petición (titular).  

- `memberInclusionRequest`  
  - `idUserReferenced`: ID del `user` que se convertirá en nuevo miembro.  
  - `newMemberType`: Indica el `memberTypeId` (titular, cónyuge, etc.).  

- `memberExclusionRequest`  
  - `memberToExclude`: ID del `member` que se dará de baja.  

- `bill` / `billDetail`  
  - Se crea una factura “CUOTA DE INGRESO” para el titular, y el detalle con `price = inclusionCost`.

- `membershipXMember`  
  - Se enlaza o desvincula (`endDate`) al miembro de la membresía activa.

- `addNewMemberFeeToMembership(...)`  
  - Se invoca para agregar la cuota mensual al “nuevo” miembro, reutilizando la lógica de tickets y detalles ya implementada.

  ```
# Rechazar una solicitud de miembro

## POST `/member-requests/:id/reject`

Parámetros de ruta

:id (número) – ID de la MemberRequest a rechazar.

Respuesta

200 OK con JSON:

{
  "requestId": 123
}

400 Bad Request si id no es numérico o si la solicitud no existe, con el mensaje de error.

Efecto
Marca la fila member_request con requestState = "REJECTED". No realiza ninguna otra operación.



