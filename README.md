# Cliente Web de Comunicación Corporativa (React.js)

## Descripción General
Este módulo corresponde al cliente web del sistema de Chat Corporativo desarrollado para el Taller 01. Su objetivo es entregar una interfaz simple, clara y funcional para que los usuarios puedan registrarse, iniciar sesión, acceder a salas y participar en conversaciones en tiempo real desde un navegador.

El desarrollo se realizó con React.js, utilizando una estructura sencilla para facilitar la comprensión del código y su explicación en contexto académico.

## Capa de Presentación
La interfaz fue diseñada bajo una propuesta visual simple basada en la identidad corporativa definida para el taller:

- color principal naranja
- color secundario blanco

Esta decisión busca mantener una apariencia limpia, legible y consistente con la idea de una plataforma de comunicación interna empresarial.

## Funcionalidades
El cliente web incorpora las siguientes funcionalidades principales:

- pantalla de registro de usuario
- pantalla de login
- visualización de datos básicos del usuario autenticado
- creación de salas públicas y privadas
- ingreso a salas privadas mediante nombre y contraseña
- panel de chat interactivo
- carga de historial de mensajes
- envío y recepción de mensajes en tiempo real

La vista principal se organiza como un panel de chat donde el usuario puede seleccionar salas y participar en conversaciones activas.

## Comunicación con el Backend
La aplicación sigue el modelo Cliente-Servidor, consumiendo la API del backend a través de `fetch` para operaciones como:

- registro
- login
- carga de salas
- acceso al historial
- unión a salas

Para la característica de tiempo real se utilizan WebSockets mediante `socket.io-client`. Esto permite generar la propiedad emergente de actualización instantánea de mensajes, ya que varios usuarios conectados a una misma sala observan los cambios sin recargar la interfaz.

## Tecnologías Utilizadas
- React.js
- Vite
- JavaScript
- CSS básico
- fetch
- socket.io-client

## Instalación
Desde la carpeta `frontend-web`, instalar las dependencias:

```bash
npm install
```

## Ejecución Local
Para ejecutar el cliente web localmente en el PC de la universidad:

```bash
npm run dev
```

Luego abrir en el navegador la dirección local entregada por Vite, normalmente:

```text
http://localhost:5173
```

## Requisito de Conectividad
Para que el módulo funcione correctamente, el backend debe estar ejecutándose en `localhost:4000`, ya que el cliente web consume esa dirección para acceder a la API y al canal de comunicación en tiempo real.

## Observación Técnica
El cliente web representa la capa de presentación del sistema, y trabaja de forma interdependiente con el backend para concretar las funcionalidades de autenticación, gestión de salas y comunicación corporativa en tiempo real.
