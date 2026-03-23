# 🏟️ AytoDeporte — Sistema de Reservas Deportivas Municipales

Aplicación web fullstack desarrollada como Trabajo de Fin de Ciclo (DAW) para digitalizar y automatizar la gestión de reservas de instalaciones deportivas en un ayuntamiento municipal.

---

## 📌 Descripción del proyecto

AytoDeporte nace para sustituir un proceso de reserva manual, lento y presencial — que implicaba llamadas telefónicas, desplazamientos al ayuntamiento y tickets físicos — por una plataforma digital accesible desde cualquier dispositivo.

**Permite a los ciudadanos:**
- Consultar instalaciones y horarios disponibles en tiempo real
- Realizar, gestionar y cancelar reservas de forma autónoma
- Acceder a su historial de reservas desde cualquier dispositivo

**Permite a los administradores:**
- Gestionar usuarios, instalaciones y reservas desde un panel centralizado
- Crear bloqueos masivos por torneos, festividades o mantenimiento
- Supervisar toda la actividad deportiva del municipio

---

## 🛠️ Stack tecnológico

| Capa            | Tecnología                                  |
|-----------------|---------------------------------------------|
| Frontend        | HTML5, CSS3, JavaScript (Vanilla)           |
| Backend         | Java + Spring Boot                          |
| Base de datos   | MySQL                                       |
| Autenticación   | JWT (JSON Web Tokens)                       |
| Servidor        | XAMPP (Apache + MySQL) + Tomcat             |
| Herramientas    | VSCode, Live Server, Postman, GitHub        |

---

## ✨ Funcionalidades principales

- 🔐 **Autenticación JWT** con control de acceso por roles (USUARIO / ADMIN)
- 📅 **Reservas en tiempo real** con validación de disponibilidad y anti-solapamiento
- 🚫 **Bloqueos masivos** para torneos, festivos y mantenimiento
- 👤 **Panel de usuario** con historial y gestión de reservas
- 🛡️ **Panel de administración** completo con gestión de instalaciones, usuarios y bloqueos
- 📱 **Diseño responsive** adaptado a móvil, tablet y escritorio
- ⚙️ **Reglas municipales reales** como diferenciación entre pistas de pádel viejas y nuevas, o restricciones de cancelación con menos de X horas de antelación

---

## 🏗️ Arquitectura del proyecto

El sistema sigue una arquitectura cliente-servidor con separación clara de capas:

```
Cliente (navegador)
    ↓ petición HTTP + JWT
Backend Spring Boot
    ├── Controllers  → Endpoints REST
    ├── Services     → Lógica de negocio
    ├── Repositories → Acceso a datos (JPA/Hibernate)
    ├── Security     → Filtros JWT y control de roles
    └── Models / DTOs
    ↓
Base de datos MySQL
    ├── usuarios
    ├── instalaciones
    ├── reservas
    └── bloqueos
```

---

## 📂 Estructura del repositorio

```
aytoDeporte/
├── backend/                        # API REST en Java Spring Boot
├── frontend/                       # Interfaz HTML, CSS y JavaScript
├── config/                         # Configuraciones del proyecto
├── scriptSaelices.txt              # Script SQL para crear la base de datos
├── Puesta_en_funcionamiento.pdf    # Guía de instalación paso a paso
└── documentacionSaelices.pdf       # Documentación técnica y funcional completa
```

---

## 🚀 Puesta en marcha

### Requisitos previos

- Java 17 o superior
- XAMPP (versión 17 o superior)
- Visual Studio Code con la extensión **Live Server**

### Pasos de instalación

**1. Clona el repositorio**
```bash
git clone https://github.com/Diegosaelices/aytoDeporte.git
cd aytoDeporte
```

**2. Inicia XAMPP**
- Abre el panel de control de XAMPP
- Arranca los módulos **Apache** y **MySQL**

**3. Crea la base de datos**
- Accede a `http://localhost/phpmyadmin/`
- Ejecuta el script `scriptSaelices.txt` para crear todas las tablas, relaciones y datos iniciales

**4. Inicia el backend**
```bash
cd backend
.\mvnw spring-boot:run
```

**5. Inicia el frontend**
- Abre el proyecto en VSCode
- Haz clic derecho sobre `index.html`
- Selecciona **"Open with Live Server"**

**6. Accede a la aplicación**
- La web se abrirá automáticamente en tu navegador
- Usa las credenciales de prueba incluidas en el script SQL

> 📖 Consulta `Puesta_en_funcionamiento.pdf` para ver la guía completa con capturas de pantalla.

---

## 🔌 Endpoints principales de la API REST

| Método     | Endpoint                            | Descripción                               |
|------------|-------------------------------------|-------------------------------------------|
| `POST`     | `/api/users/login`                  | Autenticación y generación de token JWT   |
| `GET`      | `/api/reservations/availability`    | Disponibilidad horaria de una instalación |
| `POST`     | `/api/reservations/{id}/cancel`     | Cancelar una reserva                      |
| `GET`      | `/api/installations/active`         | Obtener instalaciones activas             |
| `PUT`      | `/api/installations/{id}`           | Actualizar una instalación                |
| `DELETE`   | `/api/installations/{id}`           | Eliminar una instalación                  |
| `DELETE`   | `/api/blocks/{id}`                  | Eliminar un bloqueo                       |

---

## 📸 Capturas de pantalla

> *Ver `documentacionSaelices.pdf` y `Presentacion.pptx` incluidos en el repositorio*

---

## 📄 Documentación

- [`documentacionSaelices.pdf`](./documentacionSaelices.pdf) — Memoria técnica completa: arquitectura, base de datos, pruebas y decisiones de diseño
- [`Puesta_en_funcionamiento.pdf`](./Puesta_en_funcionamiento.pdf) — Guía de instalación y despliegue paso a paso
- [`Presentacion.pptx`](./Presentacion.pptx) — Presentación del proyecto

---

## 🔮 Posibles mejoras futuras

- Envío de emails de confirmación de reserva
- Notificaciones y recordatorios automáticos
- Panel de estadísticas con gráficas de ocupación
- Autenticación de doble factor (2FA)
- App móvil nativa para Android e iOS
- Integración con pasarelas de pago
- Escalabilidad hacia arquitectura de microservicios

---

## 👨‍💻 Autor

**Diego Saelices Saelices**
- GitHub: [@Diegosaelices](https://github.com/Diegosaelices)
- LinkedIn: *(añadir enlace)*

---

## 📝 Licencia

Proyecto desarrollado como Trabajo de Fin de Ciclo del Grado Superior en Desarrollo de Aplicaciones Web (DAW) — Diciembre 2025.
