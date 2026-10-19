#!/bin/bash
# Creates (or reuses) one fixed simulator per device family, so every run reports the same device and
# OS version and snapshots keep matching their baselines. Prints SIMULATOR_UDID_<FAMILY>=<udid> lines,
# and appends them to $GITHUB_ENV in GitHub Actions. Override with PIN_IPHONE, PIN_IPAD, PIN_TVOS,
# PIN_IOS_VERSION, and PIN_TVOS_VERSION.
set -euo pipefail
export LC_ALL=C
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

iphone=${PIN_IPHONE:-iPhone 17}
ipad=${PIN_IPAD:-iPad (A16)}
tvos=${PIN_TVOS:-Apple TV 4K (3rd generation)}
ios_version=${PIN_IOS_VERSION:-26.5}
tvos_version=${PIN_TVOS_VERSION:-26.5}

# On CI the simulator otherwise uses the Mac's keyboard, hides the on-screen one,
# and XCUITest can't type into web fields. Takes effect for simulators booted afterwards.
defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false

runtime_id() {
  local platform=$1 version=$2 setting=$3 id
  id=$(xcrun simctl list runtimes | awk -v want="$platform $version " \
    'index($0, want) == 1 && $0 !~ /unavailable/ { print $NF; exit }')
  if [[ -z $id ]]; then
    xcrun simctl list runtimes >&2
    fail "No $platform $version simulator runtime. Install it, or set $setting."
  fi
  printf '%s\n' "$id"
}

# The SDK reports the simulator's name as the device, so name it exactly after its model.
pin() {
  local family=$1 device=$2 runtime=$3 udid
  udid=$(xcrun simctl list -j devices | /usr/bin/python3 -c '
import json, sys
name, runtime = sys.argv[1], sys.argv[2]
for device in json.load(sys.stdin)["devices"].get(runtime, []):
    if device["name"] == name and device.get("isAvailable", True):
        print(device["udid"]); break' "$device" "$runtime")
  if [[ -z $udid ]]; then
    udid=$(xcrun simctl create "$device" "$device" "$runtime") || fail "Could not create $device on $runtime."
  fi
  printf 'SIMULATOR_UDID_%s=%s\n' "$family" "$udid"
  if [[ -n ${GITHUB_ENV:-} ]]; then
    printf 'SIMULATOR_UDID_%s=%s\n' "$family" "$udid" >> "$GITHUB_ENV"
  fi
}

ios_runtime=$(runtime_id iOS "$ios_version" PIN_IOS_VERSION)
tvos_runtime=$(runtime_id tvOS "$tvos_version" PIN_TVOS_VERSION)
pin IPHONE "$iphone" "$ios_runtime"
pin IPAD "$ipad" "$ios_runtime"
pin TVOS "$tvos" "$tvos_runtime"
