## GET /members/search/titular

**Descripción**
Busca miembros de tipo **TITULAR** según criterios opcionales de apellido, nombre, subCode, email, tipo y número de documento. Todos los parámetros se usan como comodines (%valor%).

**URL**

```
GET /members/search/titular
```

**Query params** (todos opcionales):

* `lastname`
* `name`
* `subCode`
* `email`
* `documentType`
* `documentId`

**Headers**

```
Authorization: Bearer <token>
```

**Respuesta 200**

```json
[
  {
    "membershipId":"4",
    "subCode": "CLUB-20250510-000123-X7F4-M001",
    "fullName": "Ana García",
    "documentType": "DNI",
    "documentId": "87654321",
    "email": "ana.garcia@example.com"
  },
  …
]
```

**Errores**

* 401 Unauthorized si falta o es inválido el token.
* 500 Internal Server Error en caso de fallo.

## GET `/members/first-payment`

**Autenticación requerida:** Sí

Indica si el usuario autenticado ya pagó la **cuota de ingreso**.

* Devuelve `{ paid: false }` si el estado de la membresía activa es `PRE_ADMITTED`.
* Devuelve `{ paid: true }` si el estado es otro (por ejemplo, `ACTIVE`, `ON_REVISION`, `ENDED`).
* Si el usuario no tiene membresía activa o no existe, también se asume que no ha pagado (`false`).

### Ejemplo de respuesta

```json
{
  "paid": true
}
```

### Errores comunes

* `401 Unauthorized`:

  * `"No autenticado"`
* `500 Internal Server Error`:

  * Si ocurre una excepción inesperada al consultar los datos.

## GET `http://localhost:3000/api/members/membership-overview`

**Autenticación requerida:** Sí

Retorna un resumen de la membresía activa del usuario autenticado, incluyendo códigos, estado y desglose de deuda actual por cuotas, mora y otros conceptos.

### Ejemplo de respuesta

```json
{
  "idMembership": 12,
  "codeMembership": "MBR-2023-001",
  "subCodeMember": "001-A",
  "startDate": "2023-08-15T00:00:00.000Z",
  "state": "ACTIVE", // o ENDED
  "pendingDebt": 150.0,
  "feeDebt": 100.0,
  "moratoriumDebt": 30.0,
  "othersDebt": 20.0,
  "profilePictureURL":"hola.com"
}
```

### Errores comunes

* `401 Unauthorized`:

  * `"No autenticado"`

* `400 Bad Request`:

  * `"Usuario no encontrado"`
  * `"No tiene membresía activa"`
  * `"Membresía no encontrada"`
  * `"Registro de Member no encontrado"`

## GET `http://localhost:3000/api/members/familiars`

**Autenticación requerida:** Sí

Retorna una lista de los otros miembros activos  que pertenecen a la misma membresía activa que el usuario autenticado. Se excluye al usuario solicitante.

### Ejemplo de respuesta

```json
[
  {
    "idAuth": 201,
    "idUser": 45,
    "idMember": 45,
    "subCode": "002-B",
    "membershipCode": "MBR-2023-001",
    "name": "María",
    "lastname": "Pérez",
    "profilePictureURL": "https://cdn.example.com/profile/maria.jpg",
    "memberTypeName": "CÓNYUGE",
    "memberTypeId": 2
  },
  {
    "idAuth": 202,
    "idUser": 46,
    "idMember": 46,
    "subCode": "002-C",
    "membershipCode": "MBR-2023-001",
    "name": "Lucía",
    "lastname": "García",
    "profilePictureURL": null,
    "memberTypeName": "PRIMO",
    "memberTypeId": 3
  }
]
```

### Errores comunes

* `401 Unauthorized`:

  * `"No autenticado correctamente"`

* `400 Bad Request`:

  * `"Usuario no encontrado para este accountID"`
  * `"Este usuario no es un miembro registrado"`
  * `"No se encontró membresía activa para este miembro"`

## `.../api/members/by-type?typeId=?`
Lista miembros por tipo de miembro en query (parametro en URL) "typeId" <- id del tipo de miembro que desees, ejm del CONYUGUE, PRIMO 

'''
```
```

# Endpoint: GET `/api/members/moras`

Devuelve un listado de las cuotas de membresía que tienen intereses de mora, agrupado por factura.

## Descripción

Recorre todas las facturas en estado **PENDING** u **OVERDUE** que contengan al menos un detalle con descripción que incluya `"MORA"`, y devuelve un resumen por factura del socio titular responsable.

## URL

```
GET /api/members/with-moras

```

> Requiere estar autenticado; el middleware extrae el token de la cookie `token`.

## Respuesta

```
[
  {
    "name": "Juan",
    "lastname": "Pérez",
    "membershipCode": "M2025-001",
    "subCode": "M2025-001-M001",
    "daysDelayed": 12,
    "rawAmount": 150.00,
    "moraAmount": 15.00,
    "totalAmount": 165.00,
    "billCreatedAt": "2025-05-01T00:00:00.000Z",
    "billDueDate":   "2025-05-10T00:00:00.000Z"
  },
  {
    "name": "María",
    "lastname": "Gómez",
    "membershipCode": "M2025-002",
    "subCode": "M2025-002-M001",
    "daysDelayed":  5,
    "rawAmount": 200.00,
    "moraAmount": 20.00,
    "totalAmount": 220.00,
    "billCreatedAt": "2025-05-01T00:00:00.000Z",
    "billDueDate":   "2025-05-15T00:00:00.000Z"
  }
]
```

### Campos

| Campo            | Tipo   | Descripción                              |
| ---------------- | ------ | ---------------------------------------- |
| `name`           | string | Nombre del socio titular.                |
| `lastname`       | string | Apellidos del socio titular.             |
| `membershipCode` | string | Código de la membresía.                  |
| `subCode`        | string | Subcódigo interno del miembro (titular). |
| `daysDelayed`    | number | Días de retraso desde `dueDate`.         |
| `rawAmount`      | number | Suma de cuotas normales (sin mora).      |
| `moraAmount`     | number | Suma de importes de mora.                |
| `totalAmount`    | number | `rawAmount + moraAmount`.                |
| `billCreatedAt`  | Date   | Fecha en que se generó la factura.       |
| `billDueDate`    | Date   | Fecha límite de pago de la factura.      |

---

> **Importante:** solo se incluyen facturas con **al menos un** detalle cuyo `description` contenga `"MORA"`.




