# Secure WebAuthn App - Proyecto Integrador

Este proyecto consiste en un ecosistema web de alta seguridad que implementa autenticación **Passwordless** (sin contraseñas) mediante el estándar **WebAuthn (FIDO2/Passkeys)**. Diseñado bajo el principio de **Seguridad por Diseño** y desplegado mediante contenedores Docker.

**Asignatura:** Software Security and Malware Analysis  
**Integrantes:** Maricela Romero Hernández, Diana Marcela Rojas Guerrero  
**Docente:** Prof. Nicolle Mayol

---

## Estructura del Proyecto

*   **backend/**: Servidor Node.js + Express (Relying Party).
*   **frontend/**: Interfaz de usuario desacoplada (HTML/JS/CSS).
*   **nginx/**: Proxy Inverso con terminación TLS y Hardening de headers.
*   **db/**: Persistencia en PostgreSQL con esquemas de seguridad.
*   **docker-compose.yml**: Orquestador de servicios y aislamiento de redes.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza un stack moderno y seguro para mitigar las debilidades de los sistemas legacy:
*   **Core de Autenticación:** `@simplewebauthn/server` & `@simplewebauthn/browser` (FIDO2/WebAuthn).
*   **Servidor Web:** `Express 5.x` (Node.js) con `Helmet.js` para endurecimiento de headers.
*   **Base de Datos:** `PostgreSQL 16` con persistencia de sesiones mediante `connect-pg-simple`.
*   **Infraestructura:** `Nginx` (Reverse Proxy) y `Docker Compose` para aislamiento de red.
*   **Seguridad:** `CORS`, `Bcrypt` (para utilidades internas) y `UUID v4` para identificadores.

---

## Requisitos Previos

*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.
*   Navegador compatible con WebAuthn (Chrome, Edge, Firefox).

---

## Configuración Inicial (OBLIGATORIO)

Para que el sistema funcione correctamente, siga estos pasos de reconstrucción de entorno seguro:

### 1. Preparar variables de entorno

Cree un archivo .env en la raiz del proyecto y copie lo que esta en el documento del manual de despliegue:


### 2. Generar Certificados SSL Locales

Como los certificados reales están excluidos por seguridad, genere sus propios archivos en la carpeta de Nginx:

# Entrar a la carpeta de certificados
cd nginx/certs

# Generar llave y certificado auto-firmado
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes -subj "/C=XX/ST=State/L=City/O=Company/OU=Unit/CN=localhost"

# Volver a la raíz del proyecto
cd ../..

### Instrucciones de Despliegue

Levante el ecosistema completo con un solo comando:

docker compose up --build

Asegurese de que las tablas de la base de datos este creada (Todo esto en la guia de despliegue)