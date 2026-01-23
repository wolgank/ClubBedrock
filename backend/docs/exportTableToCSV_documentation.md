
# 📁 Exportación de tablas a CSV – Utilidad `exportTableToCSV`

Este módulo permite exportar datos de una tabla construida con `@tanstack/react-table` a un archivo `.csv` descargable. Es útil para que usuarios finales puedan exportar listados o reportes personalizados.

---

## 📦 Archivo: `frontend/src/shared/utils/export.ts`

### 🧩 Tipos

#### `MyColumnDef<T>`
```ts
type MyColumnDef<T> = ColumnDef<T> & {
  headerText?: string;
};
```
Extiende `ColumnDef` del paquete `@tanstack/react-table`, permitiendo definir un título personalizado para exportación (`headerText`).

---

### 🔧 Función: `exportTableToCSV`

```ts
function exportTableToCSV<T>(
  data: T[],
  columns: MyColumnDef<T>[],
  filename = "export.csv"
)
```

#### Parámetros:
- `data`: Lista de objetos a exportar (filas de la tabla).
- `columns`: Definición de columnas, compatible con React Table + `headerText`.
- `filename`: Nombre del archivo CSV a descargar (por defecto: `export.csv`).

#### Comportamiento:
1. Ignora si no hay datos.
2. Filtra columnas exportables (`accessorKey` definido).
3. Obtiene los nombres de columnas:
   - Usa `headerText` si existe.
   - Si no, intenta obtener texto desde `header()` o usa `id`.
4. Construye filas con valores escapados y separados por coma.
5. Genera un archivo Blob `.csv` y lo descarga en el navegador.

#### Detalles adicionales:
- Los valores `boolean` se transforman a `"Sí"` / `"No"` para mejor legibilidad.
- Comillas en los valores se escapan correctamente para evitar errores en el CSV.

---

## ✅ Uso en componente: `DataTable.tsx`

### 1. Configuración de columnas

```ts
const columns: MyColumnDef<EventItem>[] = [
  {
    accessorKey: "name",
    headerText: "Nombre",
    ...
  },
  {
    accessorKey: "date",
    headerText: "Fecha",
    ...
  },
  ...
];
```

### 2. Datos convertidos

```ts
const dataEvent = React.useMemo(() => {
  return dataEvento.map(evento => ({
    id: evento.id,
    name: evento.name,
    date: evento.date.split("T")[0],
    ...
  }));
}, [dataEvento]);
```

### 3. Botón de exportación

```tsx
<Button
  className="h-full text-white font-bold rounded-lg border-0 button3-custom flex items-center"
  onClick={() => exportTableToCSV(dataEvent, columns, "eventos.csv")}
>
  <Download className="mr-2 h-4 w-4" />
  Exportar
</Button>
```

---

## 💡 Recomendaciones

- Siempre usar `headerText` si quieres que el CSV tenga títulos amigables.
- Evita definir columnas sin `accessorKey` si deseas que sean exportables.
- No es necesario exportar columnas de acción (`id: "acciones"`), simplemente omítelas en el `accessorKey`.

---

## 🧠 Ejemplo de salida en CSV

```
Nombre,Fecha,Espacio,Inscritos/Capacidad,Solo Socios
Evento 1,2025-06-15,Sala A,30/50,Sí
Evento 2,2025-06-16,Sala B,45/60,No
...
```

---

## 📁 Archivos relacionados

- `frontend/src/shared/utils/export.ts`: Lógica de exportación.
- `frontend\src\modules\employee\event\components\EventsSection.tsx`: Ejemplo de uso en nuestro proyecto.

---

## 🧪 Ejemplo completo de uso

```tsx
import { exportTableToCSV, MyColumnDef } from "@/shared/utils/export";

type User = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

const columns: MyColumnDef<User>[] = [
  { accessorKey: "name", headerText: "Nombre" },
  { accessorKey: "email", headerText: "Correo electrónico" },
  { accessorKey: "isAdmin", headerText: "Administrador" },
];

const data: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com", isAdmin: true },
  { id: 2, name: "Bob", email: "bob@example.com", isAdmin: false },
];

// Botón para exportar
<Button onClick={() => exportTableToCSV(data, columns, "usuarios.csv")}>
  Exportar Usuarios
</Button>
```

Este código generará un archivo `usuarios.csv` con el siguiente contenido:

```
Nombre,Correo electrónico,Administrador
Alice,alice@example.com,Sí
Bob,bob@example.com,No
```

