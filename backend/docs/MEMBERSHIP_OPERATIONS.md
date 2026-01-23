#### `POST /membership-change-requests/suspendByMember`

> **Descripción**
> Permite a un miembro (titular o cónyuge) solicitar la **suspensión** de su membresía.
> Inserta un registro en `membershipChangeRequest` con:
>
> * `requestState` = **PENDING**
> * `type` = **SUSPENSION**
> * `madeByAMember` = **true**
> * `submissionDate` = fecha-hora actual
> * `memberReason` = texto opcional
> * `changeStartDate`, `changeEndDate` = según el body

##### URL

```
POST /membership-change-requests/suspendByMember
```

##### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

##### Body (JSON)

```json
{
  "membership":       123,               // ID de la membresía
  "memberReason":     "Viaje largo",     // opcional
  "changeStartDate":  "2025-06-01",      // YYYY-MM-DD
  "changeEndDate":    "2025-08-01"       // opcional
}
```

##### Respuesta 201

```json
{
  "id":              45,
  "membership":      123,
  "requestState":    "PENDING",
  "type":            "SUSPENSION",
  "madeByAMember":   true,
  "memberReason":    "Viaje largo",
  "submissionDate":  "2025-05-15T14:23:00.000Z",
  "resolutionDate":  null,
  "managerNotes":    null,
  "changeStartDate": "2025-06-01",
  "changeEndDate":   "2025-08-01"
}
```

##### Errores comunes

* **400 Bad Request**

  * Falta algún campo requerido o formato inválido.
  * Mensaje: `{ "error": "<detalle del problema>" }`.

---

#### `POST /membership-change-requests/disaffiliateByMember`

> **Descripción**
> Permite a un miembro solicitar la **desafiliación** (anulación) de su membresía.
> Inserta un registro en `membershipChangeRequest` con:
>
> * `requestState` = **PENDING**
> * `type` = **DISAFFILIATION**
> * `madeByAMember` = **true**
> * `submissionDate` = fecha-hora actual
> * `memberReason` = texto opcional
> * `changeStartDate` = según el body

##### URL

```
POST /membership/disaffiliateByMember
```

##### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

##### Body (JSON)

```json
{
  "membership":      123,            // ID de la membresía
  "memberReason":    "Cambio de país", 
  "changeStartDate": "2025-07-01"    // YYYY-MM-DD
}
```

##### Respuesta 201

```json
{
  "id":              46,
  "membership":      123,
  "requestState":    "PENDING",
  "type":            "DISAFFILIATION",
  "madeByAMember":   true,
  "memberReason":    "Cambio de país",
  "submissionDate":  "2025-05-15T14:30:00.000Z",
  "resolutionDate":  null,
  "managerNotes":    null,
  "changeStartDate": "2025-07-01",
  "changeEndDate":   null
}
```

##### Errores comunes

* **400 Bad Request**

  * Petición malformada o datos inválidos.
  * Respuesta: `{ "error": "<detalle del error>" }`.


### `GET /membership-change-requests/`

**Descripción**
Lista **todas** las solicitudes de cambio (suspensiones y desafiliaciones), ordenadas por `submissionDate` descendente.

**URL**

```
GET /membership-change-requests/
```

**Headers**

```
Authorization: Bearer <token>
```

**Respuesta 200**

```json
[
  {
    "id": 12,
    "membership": 5,
    "requestState": "PENDING",
    "type": "SUSPENSION",
    "madeByAMember": true,
    "memberReason": "Vacaciones",
    "submissionDate": "2025-05-10T14:00:00Z",
    "changeStartDate": "2025-06-01",
    "changeEndDate": "2025-08-01"
  },
  /* ... */
]
```

## GET /membership-change-requests/member-initiated

> **Descripción**
> Devuelve todas las solicitudes de cambio de membresía **iniciadas por miembros** (`madeByAMember = true`), incluyendo datos clave para el frontend:
>
> * Código de la membresía
> * Subcode y nombre completo del titular
> * Motivo proporcionado por el miembro
> * Estado, tipo, fechas y notas del cambio

---

### URL

```
GET /membership-change-requests/member-initiated
```

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

### Respuesta 200 (application/json)

```json
[
  {
    "requestId": 123,
    "membershipCode": "CLUB-20250510-000123-X7F4",
    "titularSubCode": "SUB-000123-001",
    "titularFullName": "Ana García",
    "memberReason": "Vacaciones largas",
    "requestState": "PENDING",
    "type": "SUSPENSION",
    "madeByAMember": true,
    "submissionDate": "2025-05-15T14:23:00.000Z",
    "changeStartDate": "2025-06-01",
    "changeEndDate": "2025-08-01",
    "resolutionDate": null,
    "managerNotes": null
  },
  {
    "requestId": 124,
    "membershipCode": "CLUB-20250510-000456-ABCD",
    "titularSubCode": "SUB-000456-001",
    "titularFullName": "Luis Pérez",
    "memberReason": "Me mudo de ciudad",
    "requestState": "PENDING",
    "type": "DISAFFILIATION",
    "madeByAMember": true,
    "submissionDate": "2025-05-16T09:10:00.000Z",
    "changeStartDate": "2025-07-01",
    "changeEndDate": null,
    "resolutionDate": null,
    "managerNotes": null
  }
]
```

---

### Códigos de estado

* **200 OK**: Lista devuelta correctamente.
* **401 Unauthorized**: Token faltante o inválido.
* **500 Internal Server Error**: Error inesperado en el servidor.

## GET /membership-change-requests/all
Lo mismo de lo de arriba pero muestra TODAS, incluyendo las que el responsable de membresías hizo por su propia voluntad, osea con madeByMember = false



## `GET /membership-change-requests/:id`

> **Descripción**
> Recupera los datos clave de una solicitud de cambio de membresía (suspensión o desafiliación) identificada por su ID, incluyendo:
>
> * **Código de la membresía**
> * **Estado** actual de la membresía
> * **Nombre completo del titular**
> * **Motivo** proporcionado por el miembro
> * **Fechas** de inicio y fin del cambio

---

### URL

```
GET /membership-change-requests/:id
```

### Headers

```
Authorization: Bearer <token>
```

### Parámetros de ruta

| Parámetro | Tipo     | Descripción                             |
| --------- | -------- | --------------------------------------- |
| `id`      | `number` | ID de la solicitud de cambio a detallar |

---

### Respuesta 200 (application/json)

```json
{
  "membershipCode":  "CLUB-20250510-000123-X7F4",
  "membershipState": "ACTIVE",
  "titularName":     "Ana García",
  "memberReason":    "Voy de viaje dos meses",
  "changeStartDate": "2025-06-01",
  "changeEndDate":   "2025-08-01"
}
```

| Campo             | Tipo     | Descripción                                                                                 |
| ----------------- | -------- | ------------------------------------------------------------------------------------------- |
| `membershipCode`  | `string` | Código de la membresía afectada                                                             |
| `membershipState` | `string` | Estado actual de la membresía (p.ej. `ACTIVE`, `ENDED`)                                     |
| `titularName`     | `string` | Nombre completo del miembro titular asociado a la membresía                                 |
| `memberReason`    | `string` | Motivo que el miembro indicó para la suspensión o desafiliación                             |
| `changeStartDate` | `string` | Fecha de inicio del cambio (formato `YYYY-MM-DD`)                                           |
| `changeEndDate`   | `string` | Fecha de fin del cambio (formato `YYYY-MM-DD`), o `null` si no aplica (p.ej. desafiliación) |

---

### Códigos de respuesta

* **200 OK**: Devuelve detalle de la solicitud.
* **400 Bad Request**: ID inválido.
* **404 Not Found**: No existe la solicitud con ese ID.
* **401 Unauthorized**: Token faltante o inválido.
* **500 Internal Server Error**: Error inesperado en el servidor.


---

### `POST /membership-change-requests/:id/approve`

**Descripción**
Para el responsable de membresías: **aprueba** una solicitud de cambio (suspensión o desafiliación). Si `changeStartDate` ya pasó, marca todos los registros de `membership_x_member` de esa membresía con `endDate = changeStartDate` y `reasonToEnd = type`.

**URL**

```
POST /membership-change-requests/approve/:id
```
RECIBE "managerNotes" en body 
**Headers & Query**

```
Authorization: Bearer <token>
```

No query params; `:id` es el ID de la solicitud.
RECIBE "managerNotes" en body 
**Respuesta 200**

```json
{ "requestId": 12 }
```

---

### `POST /membership-change-requests/:id/reject`

**Descripción**
Para el responsable: **rechaza** una solicitud de cambio. Solo actualiza su `requestState` a **REJECTED** y anota `resolutionDate`.

**URL**

```
POST /membership-change-requests/reject/:id
```

RECIBE "managerNotes" en body 

**Headers**

```
Authorization: Bearer <token>
```

**Respuesta 200**

```json
{ "requestId": 12 }
```

---

### `POST /membership-change-requests/managerRequest`

**Descripción**
Para el responsable: crea **y aprueba** inmediatamente un cambio de membresía. Inserta un registro en estado **APPROVED**, tipo `SUSPENSION` o `DISAFFILIATION`, con `madeByAMember = false`, anotaciones del gestor y fechas de resolución al momento.

**URL**

```
POST /membership-change-requests/managerRequest
```

**Headers**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON)**

```json
{
  "membership":       number,
  "type":             "SUSPENSION" | "DISAFFILIATION",
  "managerNotes":     "string",      // (opcional)
  "changeStartDate":  "YYYY-MM-DD",
  "changeEndDate":    "YYYY-MM-DD"   // (opcional para suspensión)
}
```

**Respuesta 201**

```json
{
  "id":              number,
  "membership":      number,
  "requestState":    "APPROVED",
  "type":            "SUSPENSION" | "DISAFFILIATION",
  "madeByAMember":   false,
  "memberReason":    null,
  "submissionDate":  "ISO date",
  "resolutionDate":  "ISO date",
  "managerNotes":    "string | null",
  "changeStartDate": "YYYY-MM-DD",
  "changeEndDate":   "YYYY-MM-DD | null"
}
```

---

> **Nota**:
>
> * Todos los endpoints están protegidos por `authMiddleware`.
> * Las fechas se envían en formato ISO-8601 o `"YYYY-MM-DD"`.
> * Las constantes numéricas de enums (`requestState[0]`, `membershipChangeType[1]`, etc.) se manejan internamente; el cliente usa las cadenas.

---

## Reactivar miembros suspendidos

**Endpoint**  
`POST /membership-change/:membershipId/reactivate`

**Descripción**  
Reactiva todos los miembros que estaban suspendidos (`reasonToEnd = SUSPENSION`) para una membresía dada y marca la membresía como `ACTIVE`.

**Parámetros de URL**  
- `membershipId` _(number, requerido)_: ID de la membresía a reactivar.

**Respuesta (200 OK)**  
```json
{
  "membershipId": 123,
  "reactivatedCount": 2
}
```

* `membershipId`: el mismo ID de la membresía.
* `reactivatedCount`: número de miembros que se volvieron a activar.

**Errores comunes**

* `400 Bad Request`: `membershipId` inválido.
* `500 Internal Server Error`: falla de servidor o transacción.



## Endpoint: Obtener MIS solicitudes de cambio de membresía

* **URL**: `/api/users/my-change-requests`
* **Método**: `GET`
* **Autenticación**: Requiere JWT en header `Authorization: Bearer <token>`.

---

#### Descripción

Devuelve la lista de todas las solicitudes de cambio de membresía que el usuario autenticado haya creado.

---

#### Request

* Header `Authorization: Bearer <token>`
* No tiene parámetros de ruta ni query.

---

#### Response Éxito (200)

```json
[
  {
    "requestId": 123,
    "membershipCode": "ABCDEFGH",
    "membershipId": 45,
    "titularSubCode": "23062801",
    "titularFullName": "Juan Pérez",
    "memberReason": "Viaje de negocios",
    "requestState": "PENDING",
    "type": "SUSPENSION",
    "madeByAMember": true,
    "submissionDate": "2025-06-20T14:23:00.000Z",
    "changeStartDate": "2025-07-01",
    "changeEndDate": "2025-07-15",
    "resolutionDate": null,
    "managerNotes": null
  },
  …
]
```

* `requestId` (number): ID de la solicitud.
* `membershipCode` (string): Código de la membresía afectada.
* `membershipId` (number): ID interno de la membresía.
* `titularSubCode` (string): Subcódigo del titular.
* `titularFullName` (string): Nombre completo del titular.
* `memberReason` (string): Motivo proporcionado por el miembro.
* `requestState` (string): Estado de la solicitud (`PENDING`, `APPROVED`, `REJECTED`).
* `type` (string): Tipo de cambio (`SUSPENSION`, `DISAFFILIATION`, etc.).
* `madeByAMember` (boolean): Si la solicitud la generó un miembro.
* `submissionDate` (ISO datetime): Fecha de envío de la solicitud.
* `changeStartDate` (YYYY‑MM‑DD): Fecha de inicio del cambio.
* `changeEndDate` (YYYY‑MM‑DD|null): Fecha de fin (solo suspensiones).
* `resolutionDate` (ISO datetime|null): Fecha de aprobación/rechazo.
* `managerNotes` (string|null): Observaciones del encargado.

---

#### Errores

* **401 Unauthorized**

  ```json
  { "error": "No autenticado correctamente" }
  ```
* **500 Internal Server Error**

  ```json
  { "error": "Descripción del error interno" }
  ```



## Endpoint: Reactivar membresía suspendida

* **URL**: `/api/membership/:id/reactivate`
* **Método**: `POST`
* **Autenticación**: sí
---

#### Parámetros

| Nombre | Ubicación | Tipo   | Descripción                                |
| ------ | --------- | ------ | ------------------------------------------ |
| `id`   | Path      | number | ID de la membresía que se desea reactivar. |

---

#### Request

No lleva body.
Ejemplo de llamada:

```http
POST /api/membership/42/reactivate
Authorization: Bearer eyJhbGci...
```

---

#### Response 200 (Éxito)

```json
{ "message": "Membresía reactivada correctamente" }
```

---

#### Errores comunes

* **400 Bad Request**

  * `{"error":"ID inválido"}` si `:id` no es numérico.
  * `{"error":"Membresía 42 no encontrada"}` si no existe ese ID.
  * `{"error":"Membresía 42 no está en estado ENDED"}` si no está suspendida.

* **401 Unauthorized**

  ```json
  { "error": "No autenticado correctamente" }
  ```

* **500 Internal Server Error**

  ```json
  { "error": "Descripción del error interno" }
  ```
