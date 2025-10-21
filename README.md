# MauerApp - Gestor de Stock

MauerApp es una aplicación web diseñada para la gestión de inventario, enfocada en el control de stock de bebidas, prebatches y otros insumos, probablemente para un bar o establecimiento similar. Permite registrar compras, procesar ventas, realizar ajustes y visualizar el estado actual del inventario.

## Características Principales

* **Autenticación y Roles:** Sistema de inicio de sesión seguro con JWT. Soporta roles de `admin` y `operator`, con permisos diferenciados. Cierre de sesión automático por inactividad. Opción "Recordar Usuario".
* **Dashboard:** Visualización rápida de totales de stock por marca, totales de prebatches, informe de hielo ("Informe Hielístico") y alertas de stock bajo o agotado.
* **Gestión de Inventario:** Listado paginado y detallado del stock actual, con buscador por nombre o categoría.
* **Gestión de Prebatches:** Listado, creación, edición y desactivación (soft delete) de lotes de prebatch, con cálculo de estado (Fresco, Advertencia, Vencido).
* **Operaciones de Stock (Admin):**
    * **Procesar Ventas:** Carga de archivo Excel (`.xlsx`) para descontar automáticamente el stock según las recetas.
    * **Registrar Compras:** Formulario para añadir items comprados individualmente, con autocompletado para buscar items. Requiere descripción del evento.
    * **Ajustes de Stock:** Permite ajustes individuales (con autocompletado) o masivos (mediante una planilla editable), requiriendo un motivo.
* **Gestión de Catálogo (Admin):** Funcionalidad CRUD completa (Crear, Leer paginado con búsqueda, Actualizar, Desactivar/Restaurar) para:
    * Categorías
    * Marcas (asociadas a categorías)
    * Items de Stock (envases, asociados a marcas, con equivalencia en ml, prioridad y alerta de stock bajo)
    * Recetas/Productos (asocia un nombre de producto (ej: "Cuba Libre") con los items y cantidades (ml) necesarios)
* **Historial de Movimientos (Admin):** Registra todos los eventos que modifican el stock (Compras, Ventas, Ajustes). Presenta una lista paginada de eventos y una vista de detalle para cada uno, mostrando los items específicos afectados.
* **UI Moderna:** Interfaz construida con React, Tailwind CSS y Lucide Icons para una apariencia limpia y funcional. Notificaciones con React Hot Toast.

## Tech Stack

* **Backend:**
    * Node.js
    * Express.js
    * MySQL (con `mysql2/promise`)
    * JSON Web Tokens (`jsonwebtoken`)
    * `bcryptjs` para hashing de contraseñas
    * `dotenv` para variables de entorno
    * `cors` para manejo de CORS
    * `multer` y `xlsx` para carga y procesamiento de archivos Excel
* **Frontend:**
    * React (con Vite)
    * Zustand (manejo de estado global)
    * Tailwind CSS (estilos)
    * React Router DOM (navegación)
    * Axios (peticiones HTTP)
    * Lucide React (iconos)
    * React Hot Toast (notificaciones)

## Prerrequisitos

* Node.js (versión >= 18 recomendada según `engines` en algunos paquetes)
* npm (o yarn/pnpm)
* Una instancia de base de datos MySQL en ejecución.

## Instalación y Configuración

1.  **Clonar el repositorio (si aplica):**
    ```bash
    git clone <url-del-repositorio>
    cd StockManagerApp-xxxxxxxx
    ```

2.  **Backend:**
    * Navegar a la carpeta `Backend`: `cd Backend`
    * Instalar dependencias: `npm install`
    * Crear un archivo `.env` en la raíz de `Backend/` basado en un `.env.example` (si existe) o con las siguientes variables:
        ```ini
        DB_HOST=tu_host_mysql
        DB_USER=tu_usuario_mysql
        DB_PASSWORD=tu_contraseña_mysql
        DB_DATABASE=tu_nombre_db
        JWT_SECRET=tu_secreto_super_secreto_para_jwt
        PORT=5000 # O el puerto que prefieras
        ```
    * Asegúrate de que la base de datos y las tablas necesarias existan. (Puede requerir ejecutar un script SQL no proporcionado aquí).

3.  **Frontend:**
    * Navegar a la carpeta `Frontend`: `cd ../Frontend` (desde `Backend/`) o `cd Frontend` (desde la raíz)
    * Instalar dependencias: `npm install`
    * Crear un archivo `.env` en la raíz de `Frontend/` con la URL base de tu API backend:
        ```ini
        VITE_API_BASE_URL=http://localhost:5000/api # Ajusta el puerto si lo cambiaste en el backend
        ```

## Ejecutar la Aplicación

1.  **Backend:**
    * Desde la carpeta `Backend/`, ejecuta:
        ```bash
        npm start
        ```
        o
        ```bash
        node server.js
        ```
        El servidor debería iniciarse en el puerto especificado (por defecto 5000).

2.  **Frontend:**
    * Desde la carpeta `Frontend/`, ejecuta:
        ```bash
        npm run dev
        ```
        La aplicación React debería iniciarse en un puerto diferente (generalmente `http://localhost:5173` o similar, indicado por Vite en la consola). Abre esa URL en tu navegador.

## Variables de Entorno

Asegúrate de configurar correctamente los archivos `.env` en las carpetas `Backend` y `Frontend` como se describe en la sección de Instalación. Estas variables son cruciales para la conexión a la base de datos, la seguridad JWT y la comunicación entre el frontend y el backend.
