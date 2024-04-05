# Specify the base image
FROM node:18-slim
RUN apt-get update && apt-get install -y git
# Set the working directory
WORKDIR /app

# Expose port 3000
EXPOSE 3000

# Start the application
CMD yarn run start
