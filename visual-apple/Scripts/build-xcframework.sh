#!/bin/bash
# Archive, inspect and zip the five Apple variants. No publishing or signing.
set -euo pipefail
export LC_ALL=C
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }
[[ $# -eq 0 ]] || fail 'Usage: Scripts/build-xcframework.sh'
[[ $(uname -s) == Darwin ]] || fail 'A Mac with full Xcode is required.'
root=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$root"
xcode=$(xcodebuild -version)
swift=$(xcrun swift --version)
xcode_version=$(printf '%s\n' "$xcode" | sed -n 's/^Xcode //p')
xcode_major=${xcode_version%%.*}
[[ $xcode_major =~ ^[0-9]+$ ]] || fail 'Unrecognized Xcode version.'
[[ $xcode_major -ge 26 ]] || fail 'Select Xcode 26 or newer.'
[[ ! -e dist && ! -L dist ]] || fail 'Move or remove the previous dist directory before building; existing outputs are never overwritten.'
[[ ! -L build ]] || fail 'Refusing a symlinked build directory.'
mkdir -p build
work=$(mktemp -d "$root/build/xcframework.XXXXXXXX")
trap 'status=$?; printf "Archive logs: %s\n" "$work"; exit "$status"' EXIT
printf '%s\n%s\n' "$xcode" "$swift" | tee "$work/toolchain.log"
stage="$work/output"
mkdir -p "$stage" "$work/archives"
version=$(sed -n 's/^MARKETING_VERSION = \([0-9][0-9.]*\)$/\1/p' Configuration/SDK.xcconfig)
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail 'Invalid MARKETING_VERSION in Configuration/SDK.xcconfig.'
create=(xcodebuild -create-xcframework)
# variant | scheme suffix | destination | architectures
while IFS='|' read -r label scheme destination architectures; do
  archive="$work/archives/$label.xcarchive"
  xcodebuild archive -project "$root/SauceVisual.xcodeproj" -scheme "SauceVisual-$scheme" \
    -configuration Release -destination "$destination" -archivePath "$archive" \
    -derivedDataPath "$work/DerivedData-$label" ARCHS="$architectures" \
    ONLY_ACTIVE_ARCH=NO SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    CODE_SIGNING_ALLOWED=NO < /dev/null 2>&1 | tee "$work/archive-$label.log"
  framework="$archive/Products/Library/Frameworks/SauceVisual.framework"
  symbols="$archive/dSYMs/SauceVisual.framework.dSYM"
  [[ -d $framework && -d $symbols ]] || fail "Missing framework or dSYM: $label"
  create+=(-framework "$framework" -debug-symbols "$symbols")
done <<'VARIANTS'
ios|iOS|generic/platform=iOS|arm64
ios-simulator|iOS|generic/platform=iOS Simulator|arm64 x86_64
tvos|tvOS|generic/platform=tvOS|arm64
tvos-simulator|tvOS|generic/platform=tvOS Simulator|arm64 x86_64
macos|macOS|generic/platform=macOS|arm64 x86_64
VARIANTS
xcframework="$stage/SauceVisual.xcframework"
"${create[@]}" -output "$xcframework" 2>&1 | tee "$work/create.log"
# All inputs below were generated in this invocation, not supplied by a caller.
# Inspect the manifest AND each architecture's Mach-O metadata and Swift interface.
info="$xcframework/Info.plist"
plist() { plutil -extract "$2" raw -o - "$1"; }
[[ $(plist "$info" XCFrameworkFormatVersion) == 1.0 ]] || fail 'Unexpected XCFramework format.'
seen='|'
for index in 0 1 2 3 4; do
  key="AvailableLibraries.$index"
  platform=$(plist "$info" "$key.SupportedPlatform")
  # plutil may print an error on stdout for an absent key; use exit status instead.
  if ! variant=$(plist "$info" "$key.SupportedPlatformVariant" 2>/dev/null); then variant=''; fi
  case "$platform/$variant" in
    ios/) expected='arm64'; macho=IOS; floor=15.0;;
    ios/simulator) expected='arm64 x86_64'; macho=IOSSIMULATOR; floor=15.0;;
    tvos/) expected='arm64'; macho=TVOS; floor=15.0;;
    tvos/simulator) expected='arm64 x86_64'; macho=TVOSSIMULATOR; floor=15.0;;
    macos/) expected='arm64 x86_64'; macho=MACOS; floor=12.0;;
    *) fail "Unexpected variant: $platform/$variant";;
  esac
  [[ $seen != *"|$platform/$variant|"* ]] || fail 'Duplicate platform variant.'
  seen="$seen$platform/$variant|"
  identifier=$(plist "$info" "$key.LibraryIdentifier")
  [[ $identifier =~ ^[A-Za-z0-9_-]+$ ]] || fail 'Invalid library identifier.'
  [[ $(plist "$info" "$key.LibraryPath") == SauceVisual.framework ]] || fail 'Wrong library product.'
  framework="$xcframework/$identifier/SauceVisual.framework"
  binary="$framework/SauceVisual"
  archs=$(xcrun lipo -archs "$binary" | awk '{ for (i=1; i<=NF; i++) print $i }' | sort | paste -sd ' ' -)
  [[ $archs == "$expected" ]] || fail "Wrong binary architectures in $identifier: $archs"
  expected_id='@rpath/SauceVisual.framework/SauceVisual'
  if [[ $platform == macos ]]; then expected_id='@rpath/SauceVisual.framework/Versions/A/SauceVisual'; fi
  for arch in $expected; do
    xcrun otool -arch "$arch" -hv "$binary" > "$work/$identifier-$arch-header.log"
    grep -Eq '[[:space:]]DYLIB[[:space:]]' "$work/$identifier-$arch-header.log" || fail 'Not a dynamic framework.'
    xcrun vtool -arch "$arch" -show-build "$binary" > "$work/$identifier-$arch-build.log"
    actual_platform=$(awk '$1=="platform" {print $2}' "$work/$identifier-$arch-build.log")
    minimum=$(awk '$1=="minos" {print $2}' "$work/$identifier-$arch-build.log")
    case "$actual_platform" in
      1) actual_platform=MACOS;; 2) actual_platform=IOS;; 3) actual_platform=TVOS;;
      7) actual_platform=IOSSIMULATOR;; 8) actual_platform=TVOSSIMULATOR;;
    esac
    [[ $actual_platform == "$macho" && ( $minimum == "$floor" || $minimum == "$floor.0" ) ]] || fail "Wrong platform/deployment target: $identifier/$arch"
    xcrun nm -arch "$arch" -gU "$binary" > "$work/$identifier-$arch-symbols.log"
    for name in SLVClient SLVOperation SLVCheckpointReceipt SLVSessionSummary; do
      awk -v symbol="_OBJC_CLASS_\$_$name" '$NF==symbol {found=1} END {exit !found}' \
        "$work/$identifier-$arch-symbols.log" || fail "Missing Objective-C class $name"
    done
    xcrun otool -arch "$arch" -D "$binary" > "$work/$identifier-$arch-install-name.log"
    install_name=$(awk '!/:$/ && NF {print $1}' "$work/$identifier-$arch-install-name.log")
    [[ $install_name == "$expected_id" ]] || fail "Wrong install name: $install_name"
    # Filenames encode architecture AND target platform; Xcode creates one per arch.
    interfaces=("$framework/Modules/SauceVisual.swiftmodule/$arch-"*.swiftinterface)
    [[ -f ${interfaces[0]} ]] || fail "Missing textual interface: $identifier/$arch"
    public_interface=false
    for interface in "${interfaces[@]}"; do
      if [[ $interface != *.private.swiftinterface ]]; then public_interface=true; fi
      ! grep -Eq 'import[[:space:]]+Apollo(API)?([[:space:]]|$)' "$interface" || fail 'Unexpected Apollo dependency.'
    done
    [[ $public_interface == true ]] || fail 'Missing public Swift interface.'
  done
  manifest_archs=$(plutil -extract "$key.SupportedArchitectures" json -o - "$info" | tr -d '[]"[:space:]' | tr ',' '\n' | sort | paste -sd ' ' -)
  [[ $manifest_archs == "$expected" ]] || fail 'Manifest and binary architectures differ.'
  for name in SauceVisual.h SauceVisual-Swift.h; do
    [[ -s $framework/Headers/$name ]] || fail "Missing header: $name"
  done
  header="$framework/Headers/SauceVisual-Swift.h"
  for symbol in SLVClient SLVOperation SLVCheckpointReceipt SLVSessionSummary SLVErrorCode \
      initWithSessionName: maximumCheckpoints: error: recordCheckpointWithName: finishWithCompletion:; do
    grep -Fq -- "$symbol" "$header" || fail "Missing public declaration: $symbol"
  done
  grep -Fq 'framework module SauceVisual' "$framework/Modules/module.modulemap" || fail 'Missing Clang module.'
  privacy="$framework/PrivacyInfo.xcprivacy"
  if [[ ! -f $privacy ]]; then privacy="$framework/Resources/PrivacyInfo.xcprivacy"; fi
  [[ $(plist "$privacy" NSPrivacyTracking) == false ]] || fail 'Unexpected tracking declaration.'
  for privacy_key in NSPrivacyTrackingDomains NSPrivacyCollectedDataTypes NSPrivacyAccessedAPITypes; do
    [[ $(plutil -extract "$privacy_key" json -o - "$privacy" | tr -d '[:space:]') == '[]' ]] || fail 'Unexpected privacy data declaration.'
  done
  debug_path=$(plist "$info" "$key.DebugSymbolsPath")
  [[ $debug_path == dSYMs ]] || fail 'Unexpected debug-symbol directory.'
  xcrun dwarfdump --uuid "$binary" | awk '{print $2, $3}' | sort > "$work/$identifier-binary-uuids.log"
  xcrun dwarfdump --uuid "$xcframework/$identifier/$debug_path/SauceVisual.framework.dSYM" | awk '{print $2, $3}' | sort > "$work/$identifier-symbol-uuids.log"
  [[ -s $work/$identifier-binary-uuids.log ]] || fail 'Missing binary UUIDs.'
  diff -u "$work/$identifier-binary-uuids.log" "$work/$identifier-symbol-uuids.log"
  # Match one dSYM UUID for each binary architecture.
  uuid_archs=$(awk '{print $2}' "$work/$identifier-binary-uuids.log" | tr -d '()' | sort | paste -sd ' ' -)
  [[ $uuid_archs == "$expected" ]] || fail 'Incomplete binary/dSYM architecture coverage.'
  xcrun otool -L "$binary" > "$work/$identifier-dependencies.log"
  awk '/^[[:space:]]+.*\(compatibility version/ {print $1}' "$work/$identifier-dependencies.log" > "$work/$identifier-paths.log"
  while IFS= read -r dependency; do
    case "$dependency" in
      /System/Library/*|/usr/lib/*|@rpath/libswift*|"$expected_id") ;;
      *) fail "Unexpected dynamic dependency: $dependency";;
    esac
  done < "$work/$identifier-paths.log"
done
if plist "$info" AvailableLibraries.5.LibraryIdentifier >/dev/null 2>&1; then fail 'Unexpected sixth variant.'; fi
# Preserve macOS framework symlinks in the distributable ZIP.
archive_name="SauceVisual-$version.xcframework.zip"
ditto -c -k --sequesterRsrc --keepParent "$xcframework" "$stage/$archive_name"
cp LICENSE "$stage/LICENSE"
[[ ! -e $root/dist && ! -L $root/dist ]] || fail 'dist appeared during the build; refusing to overwrite it.'
mv "$stage" "$root/dist"
printf 'Created dist/%s. Run both consumer test distributions before using this artifact.\n' "$archive_name"
