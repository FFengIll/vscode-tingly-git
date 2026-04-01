#!/bin/bash

# Directory to save the gitignore files
OUTPUT_DIR="gitignore-templates"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Fetching list of available gitignore templates..."

# Get the list of available templates
TEMPLATE_LIST=$(curl -sL https://www.toptal.com/developers/gitignore/api/list)

# Check if curl was successful
if [ $? -ne 0 ] || [ -z "$TEMPLATE_LIST" ]; then
    echo "Error: Failed to fetch template list"
    exit 1
fi

echo "Downloading gitignore templates..."

# Process each line (comma-separated values)
echo "$TEMPLATE_LIST" | while IFS= read -r line; do
    # Skip empty lines
    [ -z "$line" ] && continue
    
    # Get the first template from the comma-separated list
    first_template=$(echo "$line" | cut -d',' -f1)
    
    # Skip if empty
    [ -z "$first_template" ] && continue
    
    # Clean up any whitespace
    first_template=$(echo "$first_template" | xargs)
    
    echo "Downloading: $first_template"
    
    # Download the gitignore template
    curl -sL "https://www.toptal.com/developers/gitignore/api/$first_template" -o "$OUTPUT_DIR/$first_template.gitignore"
    
    # Check if download was successful
    if [ $? -eq 0 ]; then
        echo "  ✓ Saved to $OUTPUT_DIR/$first_template.gitignore"
    else
        echo "  ✗ Failed to download $first_template"
    fi
    
    # Delay to avoid rate limiting (1 second between requests)
    sleep 5
done

echo ""
echo "Done! Templates saved to: $OUTPUT_DIR"
echo "Total templates downloaded: $(ls -1 "$OUTPUT_DIR" | wc -l)"
