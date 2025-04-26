# Razzbeary

## Descrizione
Razzbeary è un'applicazione web che permette agli utenti di scoprire, valutare e organizzare la propria libreria di film preferiti. L'app offre funzionalità per aggiungere film manualmente o tramite l'API di TMDB, valutarli e gestire una collezione personale.

## Tech Stack
- **Backend**: Node.js con Express.js
- **Frontend**: EJS per il rendering delle viste
- **Database**: File JSON locali per la persistenza dei dati
- **Autenticazione**: JWT (JSON Web Token)
- **Stile**: CSS personalizzato con supporto responsive
- **API Esterne**: Integrazione con The Movie Database (TMDB)
- **PWA**: Supporto per Progressive Web App con manifest e service worker

## Installazione
1. Clona il repository
   ```bash
   git clone https://github.com/tuoUsername/Razzbeary.git
   cd Razzbeary
   ```

2. Installa le dipendenze
   ```bash
   npm install
   ```

3. Crea un file `.env` nella root del progetto
   ```
   ENVIRONMENT=development
   PORT=8004
   USERNAME=dev
   PASSWORD=dev
   SECRET_KEY=secret
   TMBD_READ_ACCESS_TOKEN=il_tuo_token_tmdb
   ```

4. Avvia l'applicazione in modalità sviluppo
   ```bash
   npm run dev
   ```

## Deployment
1. **Metodo Standard**:
   ```bash
   ./deploy.sh "Messaggio di commit"
   ```
   Questo script aggiunge, committa e pusha le modifiche al repository Git, quindi aggiorna l'applicazione sul server tramite SSH e la riavvia con PM2.

2. **Alternativa con Docker** (configurazione presente ma non utilizzata):
   ```bash
   docker build -t razzbeary-app .
   docker run -p 8004:8004 --env-file .env razzbeary-app
   ```

L'applicazione sarà accessibile all'indirizzo specificato nella configurazione (default: http://localhost:8004).
