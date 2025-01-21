# Usa l'immagine di Node.js LTS come base
FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file di configurazione necessari prima per sfruttare la cache Docker
COPY package.json package-lock.json ./

# Installa le dipendenze
RUN npm install --only=production

# Copia tutto il contenuto della tua app nella directory di lavoro del container
COPY . .

# Espone la porta specificata nel file .env o la porta 3000 di default
EXPOSE ${PORT}

# Comando per avviare l'applicazione
CMD ["node", "app.js"]
