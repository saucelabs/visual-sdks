#!/bin/bash

if [ "${BASH_VERSINFO[0]}" -lt 5 ];then
  echo "Bash5 is required" > /dev/stderr
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found. Please install jq to run this script."
    exit 1
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
declare -A FILE_MAP
FILE_MAP=(
    ["@saucelabs/visual"]="visual/src/api.ts"
    ["@saucelabs/cypress-visual-plugin"]="visual-cypress/src/index.ts"
    ["@saucelabs/nightwatch-sauce-visual-service"]="visual-nightwatch/src/utils/constants.ts"
    ["@saucelabs/visual-storybook"]="visual-storybook/src/api.ts"
    ["@saucelabs/wdio-sauce-visual-service"]="visual-wdio/src/SauceVisualService.ts"
    # Add more mappings as needed
)

# Read releases from the JSON file
releases=$(jq -c '.releases[]' "$JSON_FILE")

# Iterate over each release
for release in $releases; do
    # Extract name and version
    release_name=$(echo "$release" | jq -r '.name')
    version=$(echo "$release" | jq -r '.newVersion')

    # Get the corresponding filename from the mapping
    filename=${FILE_MAP[$release_name]}

    # Check if the filename exists
    if [ -n "$filename" ] && [ -f "$filename" ]; then
        # Replace the version placeholder in the file
        sed -i '' "s/PKG_VERSION/$version/g" "$filename"
        echo "Updated $filename with version $version"
    else
        echo "File for release $release_name not found"
    fi
done
