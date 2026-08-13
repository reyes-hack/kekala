# Usa la imagen oficial de Playwright que incluye Node.js y todas las dependencias del navegador
FROM mcr.microsoft.com/playwright:jammy

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install

# Instala los navegadores de Playwright explícitamente por si acaso
RUN npx playwright install chromium

# Copia el resto del código de la aplicación
COPY . .

# Comando para iniciar la aplicación (ejecuta el CronService definido en package.json)
CMD ["npm", "start"]
