## Obtener tipo de miembro por nombre parcial

**URL**: `GET /member-types/by-name-containing?nameLike=algunNombreTipoMiembro`

**Query Parameter**:

* `nameLike` (string, *requerido*): Texto parcial para filtrar el campo `name` de los tipos de miembro. La búsqueda se realiza por coincidencia (LIKE).

**Descripción**:

Este endpoint devuelve el primer registro de `member_type` cuyo nombre contiene el valor proporcionado en `nameLike`. Si no se encuentra ninguno, responde con un `404 Not Found`.

**Respuesta Exitosa (200)**:

```json
{
  "id": 1,
  "name": "TITULAR",
  ... otros campos ...
}
```

**Error (404)**:

```json
{
  "message": "Not Found"
}
```

## Obtener formatos de documento por MemberType

**URL:**  
`GET /member-types/:id/document-formats`

**Descripción:**  
Devuelve todos los registros de `DocumentFormat` asociados al `MemberType` cuyo ID se recibe como parámetro en la ruta.

- El endpoint requiere un token JWT válido (guardado en cookie `token`) para autenticar al usuario.
- Si el `id` en la ruta no es un número válido, responde con **400 Bad Request**.
- En caso de error interno, responde con **500 Internal Server Error**.

**Parámetros de ruta:**

| Parámetro | Tipo    | Descripción                                 |
|-----------|---------|---------------------------------------------|
| `id`      | number  | ID del `MemberType` cuyos formatos se consultan. |


## Obtener formatos de documento por MemberType

**URL:**  
`GET /member-types/:id/document-formats`

**Descripción:**  
Devuelve todos los registros de `DocumentFormat` asociados al `MemberType` cuyo ID se recibe como parámetro en la ruta.

- El endpoint requiere un token JWT válido (guardado en cookie `token`) para autenticar al usuario.
- Si el `id` en la ruta no es un número válido, responde con **400 Bad Request**.
- En caso de error interno, responde con **500 Internal Server Error**.

**Parámetros de ruta:**

| Parámetro | Tipo    | Descripción                                 |
|-----------|---------|---------------------------------------------|
| `id`      | number  | ID del `MemberType` cuyos formatos se consultan. |

**Ejemplo de petición:**

GET /member-types/3/document-formats
Cookie: token=<jwt_token>

cpp
Copiar
Editar

**Respuesta exitosa (200):**

```json
[
  {
    "id": 1,
    "isForInclusion": true,
    "name": "Cédula de identidad",
    "description": "Formato obligatorio para inclusión",
    "memberTypeForDocument": 3
  },
  {
    "id": 2,
    "isForInclusion": false,
    "name": "Recibo de servicios",
    "description": "Formato opcional para verificación",
    "memberTypeForDocument": 3
  }
]
Códigos de respuesta:

200 OK – Retorna un array de objetos DocumentFormat.

400 Bad Request – El id proporcionado no es un número válido.

500 Internal Server Error – Error inesperado en el servidor.

```
## Obtener MemberType (vinculos) REVISAR ROUTES PARA ASEGURARTE

**URL:**  
`GET /member-types/`

obtiene todos los tipos de miembro
gaa

## Crear un nuevo MemberType con DocumentFormats

```
POST /member-types/with-docs
```

**Body** (JSON):

```json
{
  "name": "TITULAR",
  "description": "Miembro titular",
  "inclusionCost": 100.0,
  "exclusionCost": 50.0,
  "canPayAndRegister": true,
  "costInMembershipFee": 10.0,
  
  "documentFormats": [
    {
      "isForInclusion": true,
      "name": "DNI",
      "description": "Documento nacional de identidad"
    },
    {
      "isForInclusion": false,
      "name": "Certificado de matrimonio",
      "description": "Formato para cónyuges"
    }
  ]
}
```

**Response**: `201 Created`

```json
{ "memberTypeId": 42 }
```

---

## Actualizar un MemberType existente y sus DocumentFormats

```
PUT /member-types/with-docs/:id
```

* **Parameters**: `:id` – ID del MemberType a actualizar, como el titular
* **Body**: igual que en `POST /member-types`, reemplaza toda la configuración y formatos
* **Response**: `200 OK` o `204 no content`

```json
{ "memberTypeId": 42 }
```

Error `400 Bad Request` si falla la validación o no existe el ID.
