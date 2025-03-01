# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Build arguments for environment variables
ARG REDDIT_CLIENT_ID_1
ARG REDDIT_CLIENT_SECRET_1
ARG REDDIT_CLIENT_ID_2
ARG REDDIT_CLIENT_SECRET_2
ARG REDDIT_USERNAME
ARG REDDIT_PASSWORD
ARG GEMINI_API_KEY

# Set environment variables from build arguments
ENV REDDIT_CLIENT_ID_1=$REDDIT_CLIENT_ID_1 \
    REDDIT_CLIENT_SECRET_1=$REDDIT_CLIENT_SECRET_1 \
    REDDIT_CLIENT_ID_2=$REDDIT_CLIENT_ID_2 \
    REDDIT_CLIENT_SECRET_2=$REDDIT_CLIENT_SECRET_2 \
    REDDIT_USERNAME=$REDDIT_USERNAME \
    REDDIT_PASSWORD=$REDDIT_PASSWORD \
    GEMINI_API_KEY=$GEMINI_API_KEY \
    NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Determine the main file to run
# Você pode substituir 'app.js' pelo nome correto do seu arquivo principal
CMD ["node", "index.js"] 