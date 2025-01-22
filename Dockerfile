# Usa l'immagine di Node.js LTS come base
FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /app

# Copia i file di configurazione prima per sfruttare la cache Docker
COPY package.json package-lock.json ./

# Installa le dipendenze
RUN npm install --only=production

# Copia tutti i file della tua app nella directory di lavoro del container
COPY . . 

# Verifica che il file app.js sia stato copiato correttamente
RUN ls -la /app

# Espone la porta specificata (cambia se necessario)
EXPOSE 8004

# Comando per avviare l'applicazione
CMD ["node", "app.js"]
