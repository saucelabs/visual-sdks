#!/bin/bash

# Function to bump version based on release type
bump_version() {
    local version=$1
    local release_type=$2

    # Split the version into parts
    IFS='.' read -r -a version_parts <<< "$version"

    # Increment the appropriate part based on release type
    case "$release_type" in
        "major") ((version_parts[0]++)); version_parts[1]=0; version_parts[2]=0;;
        "minor") ((version_parts[1]++)); version_parts[2]=0;;
        "patch") ((version_parts[2]++));;
        *) echo "Invalid release type"; exit 1;;
    esac

    # Join the parts back into a single version string
    new_version="${version_parts[0]}.${version_parts[1]}.${version_parts[2]}"
    echo "$new_version"
}

# Main script starts here

# Parse command line options
while getopts ":c:r:" opt; do
    case $opt in
        c) current_version="$OPTARG";;
        r) release_type="$OPTARG";;
        \?) echo "Invalid option: -$OPTARG" >&2; exit 1;;
        :) echo "Option -$OPTARG requires an argument." >&2; exit 1;;
    esac
done

# Check if current_version and release_type are provided
if [ -z "$current_version" ] || [ -z "$release_type" ]; then
    echo "Usage: $0 -c <currentVersion> -r <releaseType>"
    exit 1
fi

# Bump the version
new_version=$(bump_version "$current_version" "$release_type")

echo "$new_version"
