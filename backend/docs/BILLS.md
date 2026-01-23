## POST `http://localhost:3000/api/bill/pay`

**Autenticación requerida:** Sí

Realiza el pago de una factura si esta se encuentra en estado **PENDING** o **OVERDUE**. Cambia su estado a **PAID** y registra el pago en la tabla `payment`.

### Descripción de la transacción

* **Verificación:** Confirma que la factura existe y esté pendiente o vencida.
* **Actualización:** Cambia el estado de la factura a `PAID`.
* **Registro:** Crea un nuevo registro en la tabla `payment`, vinculando el pago con la factura, registrando el método de pago y generando un `referenceCode` único.

### Ejemplo de input

```json
{
  "billId": 123,
  "paymentMethod": "TRANSFER"
}
```

> ⚠️ `paymentMethod` debe ser uno de los valores definidos en el enum `paymentMethod`, por ejemplo: `"CASH"`, `"TRANSFER"`, `"CARD"`, etc.

### Ejemplo de output

```json
{
  "billId": 123,
  "referenceCode": "BILL-123-1717514668754-X9K2",
  "paidAmount": 125.5
}
```

### Errores comunes

* `400 Bad Request`

  * `"Factura no encontrada"` – El `billId` no existe en la base de datos.
  * `"Factura no está en estado pendiente o vencida"` – La factura ya fue pagada o cancelada.
  * `"Invalid input"` – Los datos enviados no cumplen el esquema requerido (`billId` no es número entero o método de pago inválido).
* `401 Unauthorized`

  * `"No autenticado"` – No se ha enviado un JWT válido o ha expirado.

## POST `http://localhost:3000/api/bill/pay-admission-fee`

**Autenticación requerida:** Sí

Paga la factura correspondiente al derecho de admisión y, si es válida, activa la membresía `PRE_ADMITTED` del usuario.

### Descripción de la operación

1. **Valida y paga la factura**, usando el mismo proceso del endpoint `/pay`.
2. **Obtiene el `user.id`** a partir del `accountID` extraído del JWT.
3. **Busca si el usuario tiene una membresía en estado `PRE_ADMITTED`.**
4. **Si existe**, actualiza el estado de esa membresía a `ACTIVE`.

> Este endpoint se usa generalmente luego de que un postulante ha sido aprobado y necesita activar su membresía formalmente mediante el pago del derecho de admisión.

### Ejemplo de input

```json
{
  "billId": 456,
  "paymentMethod": "TRANSFER"
}
```

### Ejemplo de output

```json
{
  "billId": 456,
  "referenceCode": "BILL-456-1717518321290-A7PL",
  "paidAmount": 150.0
}
```

### Errores comunes

* `400 Bad Request`

  * `"Factura no encontrada"` – El ID de factura no existe.
  * `"Factura no está en estado pendiente o vencida"` – La factura ya fue pagada o cancelada.
  * `"Usuario no encontrado"` – El `accountID` no tiene un usuario relacionado.
  * `"Invalid input"` – El `billId` no es un número o el método de pago es inválido.
* `401 Unauthorized`

  * `"No autenticado"` – El JWT es inválido o no fue enviado.

Aquí tienes la documentación en formato Markdown para el endpoint `GET /api/bill/admissionFee`:

## GET `http://localhost:3000/api/bill/admissionFee`

**Autenticación requerida:** Sí

Recupera la factura asociada al derecho de admisión del usuario autenticado, incluyendo sus detalles.

### Descripción de la operación

1. Obtiene la **última solicitud de membresía** registrada por el usuario (`accountID`).
2. Extrae el **detalle de factura** (`billDetail`) relacionado con esa solicitud (`memberRequest`).
3. Recupera todos los **detalles de factura** (`BillDetailInfo[]`) asociados a ese `billId`.
4. Recupera la **factura principal** (`bill`) correspondiente.
5. Devuelve la factura y sus detalles como respuesta.

> Este endpoint es útil para mostrar al usuario la factura del derecho de admisión antes de realizar el pago.

### Ejemplo de output

```json
{
  "bill": {
    "id": 456,
    "finalAmount": "150.00",
    "status": "PENDING",
    "description": "Pago por derecho de admisión",
    "createdAt": "2024-06-01T14:23:45.000Z",
    "dueDate": "2024-06-15T23:59:59.000Z",
    "userId": 123
  },
  "details": [
    {
      "id": 789,
      "billId": 456,
      "description": "Derecho de admisión",
      "amount": "150.00",
      "quantity": 1,
      "unit": "UNIDAD"
    }
  ]
}
```

### Errores comunes

* `401 Unauthorized`

  * `"No autenticado"` – El JWT es inválido o no fue enviado.
* `404 Not Found`

  * `"No hay solicitudes de membresía para esta cuenta"` – El usuario no ha realizado ninguna postulación.
  * `"No se encontró el detalle de factura para la solicitud"` – La solicitud no está vinculada a una factura.
  * `"Detalle de factura no encontrado"` – El detalle de la factura fue eliminado o no existe.
  * `"Factura no encontrada"` – El `billId` del detalle no existe en la tabla principal de facturas.

## GET `http://localhost:3000/api/bill/fees`

**Autenticación requerida:** Sí

Lista todas las facturas asociadas al usuario autenticado.

### Descripción de la operación

1. Obtiene el `user.id` correspondiente al `accountID` del JWT autenticado.
2. Recupera todas las facturas (`bills`) emitidas para ese `user.id`.
3. Devuelve una lista ordenada por fecha de creación descendente.

Este endpoint permite al usuario ver su historial de facturación completo, incluyendo pagos previos y facturas pendientes o vencidas.

### Ejemplo de output

```json
[
  {
    "id": 123,
    "finalAmount": "200.00",
    "description": "Cuota mensual - Junio",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "dueDate": "2025-06-10T23:59:59.000Z",
    "status": "PENDING"
  },
  {
    "id": 122,
    "finalAmount": "150.00",
    "description": "Derecho de admisión",
    "createdAt": "2025-05-01T08:45:00.000Z",
    "dueDate": "2025-05-15T23:59:59.000Z",
    "status": "PAID"
  }
]
```

### Errores comunes

* `401 Unauthorized`

  * `"No autenticado correctamente"` – No se incluyó un JWT válido.
* `500 Internal Server Error`

  * `"Usuario asociado no encontrado"` – No se halló un `user` vinculado al `accountID`.

## GET `http://localhost:3000/api/bill/:id/fees`

Es lo mismo que el anterior pero no usa el id del usuario autenticado sino el que le pasas por la URL, es para el responsable de membresías

---

## GET `http://localhost:3000/api/bill/:id/details`

**Autenticación requerida:** Sí

Devuelve una factura específica junto con todos sus detalles (`bill_details`).

---

### Descripción

1. Recibe un `billId` como parámetro de ruta.
2. Busca la factura correspondiente.
3. Si la factura existe, recupera todos sus detalles asociados.
4. Devuelve la información completa.

Este endpoint es útil para visualizar el desglose de una factura: montos originales, descuentos, precios finales y descripciones detalladas.

---

### Parámetros


| Nombre | En   | Tipo   | Descripción                 |
| ------ | ---- | ------ | ---------------------------- |
| id     | Ruta | number | ID de la factura a consultar |

---

### Ejemplo de output

```json
{
  "id": 123,
  "finalAmount": "200.00",
  "status": "PENDING",
  "description": "Cuota de membresía junio",
  "createdAt": "2025-06-01T10:00:00.000Z",
  "dueDate": "2025-06-10T23:59:59.000Z",
  "userId": 45,
  "details": [
    {
      "id": 1,
      "price": "150.00",
      "discount": "0.00",
      "finalPrice": "150.00",
      "description": "Membresía mensual"
    },
    {
      "id": 2,
      "price": "50.00",
      "discount": "0.00",
      "finalPrice": "50.00",
      "description": "Cargo por emisión"
    }
  ]
}
```

---

### Errores comunes

* `400 Bad Request`

  * `"ID inválido"` – El parámetro `id` no es un número.
* `404 Not Found`

  * `"Factura no encontrada"` – No existe una factura con ese ID.
* `500 Internal Server Error`

  * Error inesperado en el servidor.
