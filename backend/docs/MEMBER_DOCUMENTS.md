
## Endpoint: Adjuntar múltiples documentos a una solicitud de miembro

**URL completa** 

## POST `https\://\<TU\_BACKEND\_URL>/api/member-requests/:id/documents`

- Reemplaza `<TU_BACKEND_URL>` por el dominio o IP donde esté corriendo tu backend (por ejemplo `https://api.midominio.com`).
- `:id` corresponde al `idMemberRequest` al que quieres asociar estos archivos.

### Descripción
Adjunta una lista de documentos (previamente subidos al servidor) a una solicitud de miembro específica.  
- Cada documento deberá existir ya en el directorio de uploads (local o S3) y tendrá un `fileName` generado por el backend.  
- También se indica a qué formato de documento (`documentFormatId`) corresponde cada archivo.  
- La respuesta devuelve todos los registros (incluidos los recién insertados) con su `id`, `fileName`, `fileUrl`, `memberRequestID` y `documentFormatId`.
- El idMemberRequest debe estar en la URL, es algo que endpoints anteriores te devuelve, por ejm al momento de hacer la solicitud de membresía (devuelve id y idPossiblyPartner como ids de MemberRequest) o nuevo familiar. 
#### Body (raw JSON)
```json
{
  "documents": [
    {
      "fileName": "abc123ef456.pdf",
      "idDocumentFormat": 7
    },
    {
      "fileName": "xyz789gh012.docx",
      "idDocumentFormat": 9
    }
    // … puedes enviar tantos objetos como archivos vayas a adjuntar
  ]
}
````

* **documents**: arreglo no vacío de objetos, cada uno con:

  * `fileName` (string): nombre del archivo generado al momento de subirlo por separado (`uploadDocLocal` o equivalente).
  * `idDocumentFormat` (number): el ID de la tabla `document_format` que identifica a qué tipo de documento corresponde el archivo.

---

### Response

* **Código HTTP 201 Created**

  ```json
  {
    "message": "Documentos adjuntados correctamente",
    "data": [
      {
        "id": 42,
        "fileName": "abc123ef456.pdf",
        "fileUrl": "https://<TU_BACKEND_URL>/files/download/abc123ef456.pdf",
        "memberRequestID": 123,
        "documentFormatId": 7
      },
      {
        "id": 43,
        "fileName": "xyz789gh012.docx",
        "fileUrl": "https://<TU_BACKEND_URL>/files/download/xyz789gh012.docx",
        "memberRequestID": 123,
        "documentFormatId": 9
      }
      // … demás registros asociados a esta misma solicitud
    ]
  }
  ```

  * **message** (string): mensaje de confirmación.
  * **data** (array): lista completa de documentos asociados a `memberRequestID` = `:id`, incluyendo los recién creados.

    * Cada objeto contiene:

      * `id` (number): clave primaria en `member_attached_document`.
      * `fileName` (string): nombre interno del archivo.
      * `fileUrl` (string): URL completa para descargar el archivo (en el servidor local o S3).
      * `memberRequestID` (number): ID de la solicitud de miembro a la que pertenece.
      * `documentFormatId` (number): ID del formato de documento asociado.

* **Código HTTP 400 Bad Request**

  * Ocurre si `:id` no es numérico, si el body no contiene la propiedad `documents` o si el arreglo está vacío o mal formado.

  ```json
  {
    "error": {
      "documents": ["Array must contain at least 1 element"]  // ejemplo de validación Zod
    }
  }
  ```

* **Código HTTP 500 Internal Server Error**

  * Ocurre si hay un error interno al insertar o recuperar datos.

  ```json
  {
    "error": "Error interno al adjuntar documentos"
  }
  ```

---

## Ejemplo de uso en Postman

1. Selecciona **POST** y pega la URL:

   ```
   https://api.midominio.com/api/member-requests/123/documents
   ```

   donde `123` es el `idMemberRequest` al que deseas adjuntar los archivos.

2. En la pestaña **Headers**:

   ```
   Key:    Content-Type
   Value:  application/json

   // (Opcional, si tu API usa token)
   Key:    Authorization
   Value:  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. En la pestaña **Body**, selecciona **raw** → **JSON** y pega:

   ```json
   {
     "documents": [
       {
         "fileName": "abc123ef456.pdf",
         "idDocumentFormat": 7
       },
       {
         "fileName": "xyz789gh012.docx",
         "idDocumentFormat": 9
       }
     ]
   }
   ```

4. Haz clic en **Send**.

   * Si todo sale bien, verás una respuesta con código `201` y un JSON semejante a:

     ```json
     {
       "message": "Documentos adjuntados correctamente",
       "data": [
         {
           "id": 42,
           "fileName": "abc123ef456.pdf",
           "fileUrl": "https://api.midominio.com/files/download/abc123ef456.pdf",
           "memberRequestID": 123,
           "documentFormatId": 7
         },
         {
           "id": 43,
           "fileName": "xyz789gh012.docx",
           "fileUrl": "https://api.midominio.com/files/download/xyz789gh012.docx",
           "memberRequestID": 123,
           "documentFormatId": 9
         }
       ]
     }
     ```
   * Si envías un `documents: []` vacío o un `idDocumentFormat` no numérico, recibirás un `400 Bad Request` con el detalle de validación en el campo `error`.
   * Si ocurre un problema en el servidor, recibirás un `500 Internal Server Error`.

---

### Resumen rápido

* **Método**: `POST`
* **URL**: `https://<TU_BACKEND_URL>/api/member-requests/:id/documents`
* **Body**: `{ "documents": [ { "fileName": string, "idDocumentFormat": number }, … ] }`
* **Éxito**: `201 Created` con lista de todos los documentos asociados a la solicitud.
* **Errores**:

  * `400 Bad Request` (validación Zod o `id` inválido)
  * `500 Internal Server Error` (error de base de datos u otro fallo interno)

Con esta documentación tu equipo de frontend podrá construir la llamada a este endpoint y procesar la respuesta sin problemas.


## {{base_url}}/files/download/fileName
TE DEVUELVE EL ARCHIVO PA QUE LO DESCARGUES Y VEAS, el fileName es el mismo que te devuelve el servidor cuando haces UPLOAD 






Método: GET

URL completa (por ejemplo):


## https://<TU_BACKEND_URL>/api/member-requests/123/documents
donde 123 es el idMemberRequest que quieras consultar. RECUERDA QUE SIEMPRE TRAS HACER EL ENVIAR SOLICITUD TIENES EL ID DE MEMBER REQUEST, O AL CONSULTAR VARIOS O UNO

Body: No se envía body en un GET.

Respuesta exitosa (HTTP 200):


{
  "message": "Documentos obtenidos correctamente",
  "data": [
    {
      "id": 42,
      "fileName": "abc123ef456.pdf",
      "fileUrl": "https://<TU_BACKEND_URL>/files/download/abc123ef456.pdf",
      "memberRequestID": 123,
      "documentFormatId": 7
       "format": {
                "id": 7,
                "isForInclusion": true,
                "name": "DNI u otro",
                "description": "Indispensable del cónyugue.",
                "memberTypeForDocument": 2
            }
    },
    {
      "id": 43,
      "fileName": "xyz789gh012.docx",
      "fileUrl": "https://<TU_BACKEND_URL>/files/download/xyz789gh012.docx",
      "memberRequestID": 123,
      "documentFormatId": 9
       "format": {
                "id": 9,
                "isForInclusion": true,
                "name": "ACTA MATRIMONIAL",
                "description": "Indispensable del cónyugue.",
                "memberTypeForDocument": 2
            }
    }
    // … demás registros asociados a memberRequestID = 123
  ]
}
Errores posibles:

400 Bad Request si :id no es válido.

500 Internal Server Error si hay fallo al leer la BD.