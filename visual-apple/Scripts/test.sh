#!/bin/bash
# Run a source-SPM or XCFramework consumer using the tests in its Xcode scheme.
set -euo pipefail
export LC_ALL=C

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

simulator_diagnostics() {
  local output_dir=$1
  xcrun simctl list runtimes > "$output_dir/simulator-runtimes.log" 2>&1 || true
  xcrun simctl list devices available > "$output_dir/simulator-devices.log" 2>&1 || true
}

select_simulator() {
  local output_dir=$1 platform=$2 device_prefix=$3
  shift 3
  local attempt attempt_log udid=''
  local max_attempts=6 retry_delay=5

  simulator_diagnostics "$output_dir"
  for ((attempt = 1; attempt <= max_attempts; attempt++)); do
    attempt_log="$output_dir/destinations-attempt-$attempt.log"
    if xcodebuild "$@" -showdestinations > "$attempt_log" 2>&1; then
      # Use Xcode's eligible destinations.
      udid=$(awk -v platform="$platform" -v prefix="$device_prefix" \
        -v requested="${SIMULATOR_UDID:-}" '
        /Available destinations/ { available=1; next }
        /Ineligible destinations/ { available=0 }
        available && /\{/ {
          p=""; id=""; name=""
          count=split($0, fields, ",")
          for (i=1; i<=count; i++) {
            field=fields[i]
            sub(/^[[:space:]{]+/, "", field)
            sub(/[[:space:]}]+$/, "", field)
            if (field ~ /^platform:/) { sub(/^platform:[[:space:]]*/, "", field); p=field }
            if (field ~ /^id:/) { sub(/^id:[[:space:]]*/, "", field); id=field }
            if (field ~ /^name:/) { sub(/^name:[[:space:]]*/, "", field); name=field }
          }
          if (!found && p==platform && index(name,prefix)==1 && length(id)==36 &&
              id ~ /^[0-9A-Fa-f-]+$/ && (requested=="" || requested==id)) {
            print id
            found=1
          }
        }' "$attempt_log") || fail 'Could not read simulator destinations.'
    fi
    cp "$attempt_log" "$output_dir/destinations.log" || fail 'Could not save destinations.'
    if [[ -n "$udid" ]]; then
      printf '%s\n' "$udid"
      return
    fi
    if [[ $attempt -lt $max_attempts ]]; then
      printf 'No eligible %s simulator on attempt %s/%s; retrying in %s seconds.\n' \
        "$device_prefix" "$attempt" "$max_attempts" "$retry_delay" >&2
      sleep "$retry_delay" || return $?
    fi
  done

  simulator_diagnostics "$output_dir"
  cat "$output_dir/destinations.log" "$output_dir/simulator-runtimes.log" \
    "$output_dir/simulator-devices.log" >&2
  fail "No eligible $device_prefix simulator. Check the selected Xcode, runtimes, and SIMULATOR_UDID."
}

summary_value() {
  plutil -extract "$2" raw -o - "$1" || fail "Cannot read '$2' from $1."
}

validate_results() {
  local summary=$1 result total passed failed skipped count
  result=$(summary_value "$summary" result)
  total=$(summary_value "$summary" totalTestCount)
  passed=$(summary_value "$summary" passedTests)
  failed=$(summary_value "$summary" failedTests)
  skipped=$(summary_value "$summary" skippedTests)

  for count in "$total" "$passed" "$failed" "$skipped"; do
    [[ $count =~ ^(0|[1-9][0-9]*)$ ]] || fail "Invalid test metrics in $summary."
  done
  [[ $total != 0 ]] || fail 'No tests were executed.'
  [[ $result == Passed && $passed == "$total" && $failed == 0 && $skipped == 0 ]] ||
    fail "$result: $passed/$total passed, $failed failed, $skipped skipped."

  printf 'Passed: %s tests; no failures or skips.\n' "$total"
}

# Select the existing consumer project and device family.
[[ $# -eq 2 ]] || fail 'Usage: Scripts/test.sh {source|binary} {iphone|ipad|tvos|macos}'
distribution=$1
family=$2
case "$distribution" in
  source) project=Source ;;
  binary) project=Binary ;;
  *) fail "Unknown distribution: $distribution" ;;
esac
case "$family" in
  iphone)
    scheme=iOS
    platform='iOS Simulator'
    device_prefix=iPhone
    ;;
  ipad)
    scheme=iOS
    platform='iOS Simulator'
    device_prefix=iPad
    ;;
  tvos)
    scheme=tvOS
    platform='tvOS Simulator'
    device_prefix='Apple TV'
    ;;
  macos)
    scheme=macOS
    platform=macOS
    ;;
  *) fail "Unknown device family: $family" ;;
esac

# Keep each run isolated and retain its logs even when a command fails.
[[ $(uname -s) == Darwin ]] || fail 'A Mac with full Xcode is required.'
root=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$root"
[[ ! -L build ]] || fail 'Refusing a symlinked build directory.'
mkdir -p build
run=$(mktemp -d "$root/build/test-$distribution-$family.XXXXXXXX")
trap 'status=$?; printf "Results and logs: %s\n" "$run"; exit "$status"' EXIT

xcodebuild -version > "$run/toolchain.log"
xcode_version=$(sed -n 's/^Xcode //p' "$run/toolchain.log")
xcode_major=${xcode_version%%.*}
[[ $xcode_major =~ ^[0-9]+$ ]] || fail 'Unrecognized Xcode version.'
[[ $xcode_major -ge 26 ]] || fail 'Select Xcode 26 or newer.'
xcrun swift --version >> "$run/toolchain.log"
cat "$run/toolchain.log"
if [[ $distribution == binary ]]; then
  [[ -d dist/SauceVisual.xcframework ]] || fail 'Build or unpack dist/SauceVisual.xcframework first.'
fi

build_args=(
  -project "$root/Tests/Integration/$project.xcodeproj"
  -scheme "Consumer-$scheme"
  -derivedDataPath "$run/DerivedData"
  CODE_SIGNING_ALLOWED=NO
)
# Simulator tests don't inherit this shell. xcodebuild passes TEST_RUNNER_<NAME> to them as <NAME>,
# so forward each SAUCE_* variable (for example from CI secrets) unless a TEST_RUNNER_ value is already set.
for name in SAUCE_USERNAME SAUCE_ACCESS_KEY SAUCE_REGION SAUCE_VISUAL_BUILD_NAME SAUCE_VISUAL_PROJECT \
    SAUCE_VISUAL_BRANCH SAUCE_VISUAL_DEFAULT_BRANCH SAUCE_VISUAL_CUSTOM_ID SAUCE_VISUAL_BUILD_ID; do
  runner_name="TEST_RUNNER_$name"
  if [[ -z ${!runner_name:-} && -n ${!name:-} ]]; then
    export "$runner_name=${!name}"
  fi
done
if [[ $family == macos ]]; then
  destination="platform=macOS,arch=$(uname -m)"
else
  udid=$(select_simulator "$run" "$platform" "$device_prefix" "${build_args[@]}")
  destination="platform=$platform,id=$udid"
fi

# pipefail preserves xcodebuild failures.
printf 'Distribution: %s; destination: %s\n' "$distribution" "$destination" | tee "$run/destination.log"
xcodebuild "${build_args[@]}" test \
  -configuration Debug \
  -destination "$destination" \
  -destination-timeout 180 \
  -parallel-testing-enabled NO \
  -test-timeouts-enabled YES \
  -default-test-execution-time-allowance 120 \
  -maximum-test-execution-time-allowance 120 \
  -resultBundlePath "$run/TestResults.xcresult" 2>&1 | tee "$run/tests.log"

# Validate the structured result.
xcrun xcresulttool get test-results summary \
  --path "$run/TestResults.xcresult" --compact > "$run/results.json"
validate_results "$run/results.json"
