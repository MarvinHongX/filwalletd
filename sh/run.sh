#!/bin/bash

cd ..

# Load the .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found. Please make sure it exists in the directory."
    exit 1
fi

nohup node index.js >> filwalletd.log 2>&1 &

echo "Server is running in the background with PID: $!"


