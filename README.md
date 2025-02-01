# CleanFlix

CleanFlix è un'applicazione web che consente agli utenti di scoprire, valutare e organizzare la loro libreria di film preferiti in modo semplice e intuitivo. Il progetto è sviluppato e mantenuto da **Daniel Rangel** e ospitato su [cleanflix.shrood.app](https://cleanflix.shrood.app).

## Scopo del Progetto

L'obiettivo principale di CleanFlix è offrire una piattaforma user-friendly per:

- **Aggiungere nuovi film** alla propria libreria.
- **Modificare e aggiornare** le informazioni sui film.
- **Valutare i film** e calcolare una media basata sulle recensioni ricevute.
- **Supportare l'accesso offline** tramite PWA (Progressive Web App).
- **Garantire un'esperienza utente fluida** su desktop e dispositivi mobili.

---

## Tecnologie Utilizzate

CleanFlix è costruito utilizzando le seguenti tecnologie:

- **Backend:**

  - [Node.js](https://nodejs.org/) con [Express.js](https://expressjs.com/)
  - Gestione autenticazione con [JWT](https://jwt.io/)
  - Gestione file JSON come database locale
  - Middleware per la gestione dei cookie e parsing dei dati

- **Frontend:**

  - [EJS](https://ejs.co/) per il rendering delle viste
  - [Bootstrap](https://getbootstrap.com/) per il design responsive
  - JavaScript per l'interazione dinamica con l'utente (e.g. anteprima immagini)

- **Progressive Web App (PWA):**

  - Manifest JSON per la configurazione dell'app installabile
  - Service Worker per la cache e l'accesso offline

- **Containerizzazione:**
  - [Docker](https://www.docker.com/) per semplificare la distribuzione e il deployment
  - Docker Compose per gestire facilmente i servizi locali

---

## Installazione e Configurazione

### 1. Clona il repository

```bash
git clone https://github.com/danielrangel/cleanflix.git
cd cleanflix
```

### 2. Configura le variabili d'ambiente

Crea un file .env nella root del progetto e aggiungi le seguenti variabili:

plaintext
Copy
Edit
ENVIRONMENT=development
PORT=3000
USERNAME=dev
PASSWORD=dev
SECRET_KEY=secret

### 3. Docker

docker build -t cleanflix-app .
docker run -p 8004:8004 --env-file .env cleanflix-app

version: '3.8'

Esecuzione con Docker Compose (Opzionale)
services:
cleanflix:
build: .
ports: - "3000:3000"
env_file: - .env
volumes: - .:/app - /app/node_modules
restart: unless-stopped

docker-compose up --build

## Struttura del Progetto

cleanflix/
│-- public/
│ ├── css/ # Fogli di stile CSS
│ ├── js/ # File JavaScript lato client
│ ├── cleanflix.webp # Immagine usata per favicon e social media
│ ├── manifest.json # Configurazione PWA
│ ├── service-worker.js # Service worker per caching offline
│
│-- views/
│ ├── index.ejs # Home page
│ ├── new.ejs # Aggiunta di film
│ ├── edit.ejs # Modifica film
│ ├── partials/ # Componenti riutilizzabili (header, footer, nav)
│
│-- .env # Variabili d'ambiente
│-- Dockerfile # Configurazione Docker
│-- docker-compose.yml # Configurazione Docker Compose
│-- app.js # Server Node.js con Express
│-- package.json # Dipendenze e script
│-- movies.json # Database locale per i film
│-- README.md # Documentazione del progetto

# TODO

- Dockerize it

# BUGS

- Quando un film viene aggiunto, il modal di informazione dil film non viene aggiornato
