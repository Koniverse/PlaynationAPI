# Specify the base image
FROM node:18-slim
RUN apt-get update && apt-get install -y git
# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .
COPY .env-docker .env

# Build the application
RUN yarn run build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD yarn run start
