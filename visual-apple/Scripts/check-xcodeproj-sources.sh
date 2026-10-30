#!/bin/bash
# SwiftPM finds new source files by itself, but SauceVisual.xcodeproj lists them by hand, and the XCFramework
# is built from the project. Fails if a file in Sources/SauceVisual is missing from any framework target.
set -euo pipefail
export LC_ALL=C

root=$(cd "$(dirname "$0")/.." && pwd -P)
project="$root/SauceVisual.xcodeproj/project.pbxproj"
targets=3 # SauceVisual-iOS, SauceVisual-tvOS, SauceVisual-macOS

missing=0
while IFS= read -r source; do
  path=${source#"$root/"}
  file_ref=$(grep -B2 "\"path\" = \"$path\";" "$project" | awk 'NR == 1 { print $1 }' || true)
  if [[ -z $file_ref ]]; then
    printf 'error: %s is not in SauceVisual.xcodeproj.\n' "$path" >&2
    missing=1
    continue
  fi
  builds=$(grep -c "\"fileRef\" = $file_ref;" "$project" || true)
  if [[ $builds -ne $targets ]]; then
    printf 'error: %s is built by %s of the %s framework targets.\n' "$path" "$builds" "$targets" >&2
    missing=1
  fi
done < <(find "$root/Sources/SauceVisual" -name '*.swift' | sort)

[[ $missing -eq 0 ]] || exit 1
printf 'Every Sources/SauceVisual file is in all %s framework targets.\n' "$targets"
