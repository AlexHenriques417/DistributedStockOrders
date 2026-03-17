# Usa uma imagem leve do Node.js
FROM node:20-alpine

# Define a pasta de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências (incluindo as de desenvolvimento para o build)
RUN npm install

# Copia o restante do código fonte
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build

# Expõe a porta (será mapeada no docker-compose)
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "run", "start"]