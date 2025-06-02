[![Discord](https://img.shields.io/discord/1347133593578766369.svg?label=Discord&logo=discord&color=5865F2&logoColor=white)](https://discord.gg/52PQ2mbWQD) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/stefanwerfling/figtree)

# Figtree - Server Core
Is a package for the Config/DB/Logging and many other useful classes and utils for the quick implementation of a backend server or raw server.

## Implementation

- [x] Schemas declaration && validation (VTS)
- [x] Load environment variables (example for use over docker compose)
- [x] Config loading (json file)
- [x] Logging (Winston)
- [x] DB loading and handling (MariaDB, InfluxDB, Redis)
  - [ ] History (For data change)
- [x] Process handling
- [x] Server TCP Raw
- [x] HTTP/s Server and handling (Express.js, rateLimit, helmet, cookieParser, session parser, self-temporary cert generation)
  - [x] Swagger UI Route and auto generation description from the schemas
  - [x] Unix HTTP Server (for intern communication)
  - [x] File Upload helper
  - [x] AsyncLocalStorage for Context
- [x] Service Manager (for initialized services or schedule)
- [x] Backend Main
- [x] Provider handler
- [x] Plugin Manager/Loader
- [ ] Crypto Managment
  - [x] Pem Helper/Parser
  - [x] Certificate generator (node-forge)

## Installation

You can install Figtree via npm:

```bash
npm install git+https://github.com/stefanwerfling/figtree.git
```

### TypeScript Users
If you're using TypeScript, it is highly recommended to install the necessary types. 

```bash
npm install --save-dev \
  @types/express \
  @types/express-session \
  @types/async-exit-hook \
  @types/cookie-parser \
  @types/uuid \
  @types/node \
  git+https://github.com/stefanwerfling/node-forge-types.git
```

## Used

### Appropriate user interface
To build a suitable interface for the API, the framework [Bambooo](https://github.com/stefanwerfling/bambooo) can be used.

### Routes and Swagger
Using schemas as route registered on the HTTP server can be automatically generated (for OpenAPI) for the Swagger UI API. The process consists of defining the schema, registering the route, and its types. Generics ensure that all types are correct in the route handle. Data that does not match the schema is automatically returned with an error. This reduces the development process and allows the focus to be on functionality.

<table>
    <tr>
        <td>
            <img src="doc/images/route_schema_body.png" alt="Login page" width="150px" />
        </td>
        <td>
⟶
        </td>
        <td>
            <img src="doc/images/route_register.png" alt="Login page" width="150px" />
        </td>
        <td>
⟶
        </td>
        <td>
            <img src="doc/images/route_handle.png" alt="Login page" width="150px" />
        </td>
        <td>
⟶
        </td>
        <td>
            <img src="doc/images/route_swagger_api.png" alt="Login page" width="150px" />
        </td>
    </tr>
</table>

### Reverse proxy
The framework is designed to be used in production behind a reverse proxy. For local development (some functions require HTTPS in the browser), a local certificate for HTTPS is already issued.

It's best to use [FlyingFish](https://github.com/stefanwerfling/flyingfish), NPM, or Nginx directly.

### Where is the framework already used

* [Project PuppeteerCast](https://github.com/stefanwerfling/puppeteercast)
  * PuppeteerCast is a system that converts web browser content into live video streams accessible via HTTP endpoints. The system uses headless browser automation to navigate and interact with web pages, captures the visual and audio output, encodes it into streaming formats, and serves it through multiple API interfaces compatible with various client applications.
  * The core transformation process involves running a web browser in a virtual display environment, capturing both screen content and audio output, and encoding this media into transport streams that can be consumed by streaming clients, TV applications, and media players.

<hr>

* Coming soon [FlyingFish](https://github.com/stefanwerfling/flyingfish)
  * FlyingFish is a reverse proxy manager with own WebUI, DNS server, SSH server, DynDNS, UPNP support, Lets Encrypt and much more.

<hr>

* Coming soon [MWPA](https://github.com/M-E-E-R-e-V/mwpa)
  * MWPA provides the acquisition of scientific observational data, an easy-to-use user interface for viewing, confirming and reviewing the data. This includes the backend for data collection, the frontend and a mobile phone app for snycronization. The recorded ones relate to mammals and their observations. The aim is to record the observations cleanly and quickly. For this purpose, the old data is processed again and imported.