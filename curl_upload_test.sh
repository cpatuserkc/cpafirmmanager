#!/bin/bash

# Test script for uploading tax return PDF via curl

echo "=== Tax Return Upload Test ==="
echo

# Check if PDF file is provided as argument
if [ $# -eq 0 ]; then
    echo "Usage: $0 <path_to_pdf_file>"
    echo "Example: $0 ./tax_return_2023.pdf"
    exit 1
fi

PDF_FILE="$1"

# Check if file exists
if [ ! -f "$PDF_FILE" ]; then
    echo "Error: File '$PDF_FILE' not found."
    exit 1
fi

echo "📁 Processing file: $PDF_FILE"
echo "📊 File size: $(du -h "$PDF_FILE" | cut -f1)"
echo

# Convert PDF to base64
echo "🔄 Converting PDF to base64..."
BASE64_DATA=$(base64 -w 0 "$PDF_FILE")

# Create JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "fileData": "data:application/pdf;base64,$BASE64_DATA",
  "filename": "$(basename "$PDF_FILE")",
  "clientId": 1,
  "firmId": 2,
  "clientName": "Test Client - $(date '+%Y-%m-%d')",
  "taxYear": 2024
}
EOF
)

echo "🚀 Uploading to tax return processor..."
echo

# Upload to server
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  http://localhost:5000/api/tax-return/upload)

# Check if response is JSON
if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
    echo "✅ Upload Response:"
    echo "$RESPONSE" | jq .
    
    # Extract organizer ID if successful
    ORGANIZER_ID=$(echo "$RESPONSE" | jq -r '.organizer.id // empty')
    
    if [ ! -z "$ORGANIZER_ID" ]; then
        echo
        echo "📋 Generated Organizer ID: $ORGANIZER_ID"
        echo
        echo "🔽 Downloading customized tax organizer..."
        
        # Download the generated organizer
        curl -s -o "Tax_Organizer_$ORGANIZER_ID.md" \
             http://localhost:5000/api/tax-return/organizer/$ORGANIZER_ID/enhanced
        
        if [ -f "Tax_Organizer_$ORGANIZER_ID.md" ]; then
            echo "✅ Tax organizer saved as: Tax_Organizer_$ORGANIZER_ID.md"
            echo
            echo "📄 Preview of generated organizer:"
            echo "=================================="
            head -20 "Tax_Organizer_$ORGANIZER_ID.md"
            echo "..."
            echo "=================================="
            echo
            echo "🎯 Next Steps:"
            echo "1. Review the full organizer: Tax_Organizer_$ORGANIZER_ID.md"
            echo "2. Send to client with specific vendor information"
            echo "3. Track document collection progress"
            echo "4. Begin tax preparation when documents are collected"
        else
            echo "❌ Failed to download organizer"
        fi
    fi
else
    echo "❌ Upload failed or invalid response:"
    echo "$RESPONSE"
fi

echo
echo "=== Test Complete ==="