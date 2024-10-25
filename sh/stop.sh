#!/bin/bash

# Define server URL (localhost and the port used by the server)
SERVER_URL="http://127.0.0.1:3001/shutdown"

# Send a POST request to the /shutdown endpoint
echo "Attempting to shut down the server..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$SERVER_URL" -H "Content-Type: application/json")

echo $response
# Check if the shutdown request was successful
if [ "$response" -eq 200 ]; then
    echo "Shutdown request sent successfully."
else
    echo "Failed to send shutdown request. Server might not be running or is inaccessible."
fi

