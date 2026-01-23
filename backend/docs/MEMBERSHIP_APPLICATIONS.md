Perfecto. A partir de ahora usaré un formato `.md` breve y estandarizado como este:

---

## POST `http://localhost:3000/api/membership-applications/newMemberApplication`

### 🔐 Requiere autenticación (cookie con token JWT)

### 📝 Descripción

Crea una nueva solicitud de membresía para el usuario autenticado.
Permite también adjuntar los datos de cónyuge y registrar dos recomendaciones.

### 📥 Body (JSON)

```json
{
  "inclusion": { /* datos del solicitante */ },
  "applicantJobInfo": { /* datos laborales */ },
  "partnerInclusion": { /* datos del cónyuge */ },
  "partnerPassword": "opcional",
  "partnerUsername": "opcional",
  "recommendation1": { "recommenderMemberCode": "..." },
  "recommendation2": { "recommenderMemberCode": "..." }
}
```

* `partnerInclusion`, `partnerPassword` y `partnerUsername` son obligatorios solo si se incluye cónyuge.

### 📤 Respuesta `201 Created`

```json
{
  "id": 12,
  "idPosiblyPartner": 13,
  "accountID": 9,
  "applicantJobInfo": { ... },
  "idRecommendationMember1": 34,
  "idRecommendationMember2": 35
}
```

### ⚠️ Errores comunes

* `400 Bad Request`: Body inválido o falta un campo.
* `401 Unauthorized`: No hay token o es inválido.

---

Aquí tienes la documentación en formato `.md` con todos los elementos solicitados:

---

## GET `http://localhost:3000/api/membership-applications/`

### 🔐 Requiere autenticación

### 📝 Descripción

Devuelve una lista de resúmenes de solicitudes de membresía.
Incluye nombre del solicitante, fecha de envío, estado actual y cuántas recomendaciones son válidas (es decir, están asociadas a un miembro).

### 🔧 Orquestación (breve)

Consulta una vista combinada de las tablas `memberRequest`, `membershipApplication`, `user` y `rec_member` (recomendaciones).
Usa una subconsulta para contar recomendaciones válidas por solicitud.
Los resultados están ordenados por la fecha de envío más reciente.

### 📤 Respuesta `200 OK`

```json
[
  {
    "id": 23,
    "applicantName": "Lucía",
    "applicantLastName": "Salazar",
    "submissionDate": "2024-05-01T15:30:00.000Z",
    "requestState": "PENDIENTE",
    "validRecommendations": 2
  },
  {
    "id": 21,
    "applicantName": "Carlos",
    "applicantLastName": "Mendoza",
    "submissionDate": "2024-04-29T11:00:00.000Z",
    "requestState": "RECHAZADA",
    "validRecommendations": 1
  }
]
```

### ⚠️ Errores comunes

* `401 Unauthorized`: No hay token o es inválido.

---


Aquí tienes la documentación en formato `.md` del endpoint `GET /:id/detail`:

## GET `http://localhost/api/membership-applications/:id/detail`

**Autenticación requerida:** Sí (JWT)

### Descripción
Devuelve todos los datos relevantes de una solicitud de membresía, incluyendo información del solicitante, contacto, trabajo, recomendaciones, y, si aplica, datos del cónyuge.

### Orquestación a nivel de base de datos
1. Se recuperan datos del solicitante desde `user`, `auth` y `memberRequest`.
2. Se obtienen los datos de las dos recomendaciones.
3. Si existe un cónyuge (`partnerAccountId`), se recuperan sus datos también desde `user` y `auth`.

### Ejemplo de respuesta

```json
{
  "applicationId": 12,
  "requestDate": "2024-06-01T00:00:00.000Z",
  "applicant": {
    "documentType": "DNI",
    "documentId": "12345678",
    "fullName": "Juan Pérez",
    "birthDate": "1990-04-15T00:00:00.000Z"
  },
  "contact": {
    "email": "juan@example.com",
    "phone": "987654321",
    "address": "Av. Siempre Viva 123"
  },
  "jobInfo": "Ingeniero de software en Acme Corp.",
  "recommendations": [
    {
      "subCodeInserted": "ABC123",
      "namesAndLastNamesInserted": "Luis Gómez"
    },
    {
      "subCodeInserted": "DEF456",
      "namesAndLastNamesInserted": "Carlos Ruiz"
    }
  ],
  "partner": {
    "info": {
      "documentType": "DNI",
      "documentId": "87654321",
      "fullName": "María López",
      "birthDate": "1992-01-01T00:00:00.000Z"
    },
    "contact": {
      "email": "maria@example.com",
      "phone": "912345678",
      "address": "Av. Siempre Viva 123"
    }
  }
}
```

### Errores comunes

* `400 Bad Request`: ID inválido.
* `404 Not Found`: Solicitud no encontrada.
* `500 Internal Server Error`: Error inesperado en la consulta.


## POST `http://localhost/api/membership-applications/:id/approve`

**Autenticación requerida:** Sí (JWT)

### Descripción
Aprueba una solicitud de membresía. Esta operación:

- Actualiza el estado de la solicitud principal (y la del cónyuge si aplica) a `APPROVED`.
- Crea los registros de miembro a partir de la solicitud de inclusión.
- Asigna una nueva membresía a los miembros aprobados.
- Cambia el rol del solicitante (y su cónyuge) a `MEMBER`.
- Genera la `bill` correspondiente a la cuota de ingreso, con detalles separados si hay cónyuge.

### Orquestación a nivel de base de datos
Se ejecuta una transacción con los siguientes pasos:

1. Verifica la existencia de la solicitud y sus inclusiones.
2. Actualiza los estados de `memberRequest` a `APPROVED`.
3. Crea una nueva `membership` y asigna a los miembros.
4. Inserta los registros de miembro (`member`) para el solicitante y su cónyuge (si aplica).
5. Crea una `bill` para la cuota de ingreso con sus respectivos `billDetail` (uno o dos).
6. Actualiza las solicitudes con los IDs de detalle de factura (`idBillDetail`).
7. Recalcula el monto total de la factura.
8. Genera automáticamente el ticket de pago de cuota periódica.

### Ejemplo de respuesta

```json
{
  "applicationId": 12,
  "membershipId": 34
}
```

### Errores comunes

* `400 Bad Request`:

  * `"Application no encontrada"`
  * `"Inclusion principal no encontrada"`
  * `"User titular no encontrado"`
  * `"MemberType no encontrado"`
  * `"No se creó la Bill"`
  * `"No se creó BillDetail del cónyuge"`


## POST `http://localhost/api/membership-applications/:id/reject`

**Autenticación requerida:** Sí

Rechaza una solicitud de membresía, marcando como `REJECTED` el estado de la solicitud principal y, si existe, también el de la solicitud del cónyuge.

### Ejemplo de respuesta

```json
{
  "applicationId": 12
}
```

### Errores comunes

* `400 Bad Request`:

  * `"Application no encontrada"`

## GET `/membership-applications/exists`

**Autenticación requerida:** Sí

Indica si el usuario autenticado ya ha enviado al menos una solicitud de membresía que contenga alguna inclusión **pendiente** o **aprobada**.

Devuelve `true` si existe al menos una `memberRequest` asociada que no haya sido rechazada.
Devuelve `false` si no hay solicitudes o si todas las inclusiones están rechazadas.

### Ejemplo de respuesta

```json
{
  "exists": true
}
```

### Errores comunes

* `401 Unauthorized`:

  * `"No autenticado"`

