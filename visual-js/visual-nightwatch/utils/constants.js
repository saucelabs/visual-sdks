const VISUAL_BUILD_ID_KEY = 'SAUCE_VISUAL_BUILD_ID';
const VISUAL_SKIP = 'SAUCE_VISUAL_SKIP';
// The const can't be name `PKG_VERSION` as `PKG_VERSION` string is replaced by current version in the build process (and will break it)
const PKG_VER = 'PKG_VERSION';

const skipMode = function () {
  return !!process.env[VISUAL_SKIP];
};

module.exports = {
  PKG_VER,
  VISUAL_BUILD_ID_KEY,
  VISUAL_SKIP,
  skipMode,
};
