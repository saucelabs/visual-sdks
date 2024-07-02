#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found. Please install jq to run this script."
    exit
fi

# Check if a JSON file is provided as an argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <json-file>"
    exit 1
fi

JSON_FILE=$1

# Check if the JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "JSON file not found!"
    exit 1
fi

# Define the mapping between release names and filenames
release_names=(
    "@saucelabs/visual" 
    "@saucelabs/cypress-visual-plugin" 
    "@saucelabs/nightwatch-sauce-visual-service" 
    "@saucelabs/visual-storybook" 
    "@saucelabs/wdio-sauce-visual-service"
    # Add more release names as needed
    ) 
file_names=(
    "visual/src/api.ts" 
    "visual-cypress/src/index.ts" 
    "visual-nightwatch/src/utils/constants.ts" 
    "visual-storybook/src/api.ts" 
    "visual-wdio/src/SauceVisualService.ts"
    # Add corresponding filenames
    )

# Read releases from the JSON file
releases=$(jq -c '.releases[]' "$JSON_FILE")

# Iterate over each release
for release in $releases; do
    # Extract name and version
    release_name=$(echo "$release" | jq -r '.name')
    version=$(echo "$release" | jq -r '.newVersion')

    # Find the corresponding filename
    filename=""
    for i in "${!release_names[@]}"; do
        if [ "${release_names[$i]}" = "$release_name" ]; then
            filename=${file_names[$i]}
            break
        fi
    done

    # Check if the filename exists
    if [ -n "$filename" ] && [ -f "$filename" ]; then
        # Replace the version placeholder in the file
        sed -i '' "s/PKG_VERSION/$version/g" "$filename"
        echo "Updated $filename with version $version"
    else
        echo "File for release $release_name not found"
    fi
done
