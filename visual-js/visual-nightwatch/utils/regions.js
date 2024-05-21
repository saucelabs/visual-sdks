/**
 * Processes a given reference to either resolve it to a CSS selector using a page object in Nightwatch
 * or returns the reference as is if it's a direct selector.
 *
 * @param {string} ref - The reference to be processed, which can be a page object reference or a CSS selector.
 * @returns {string} The CSS selector or the original reference if it's already a selector.
 */

function processReference(ref) {
  if (typeof ref === 'string' && ref.startsWith('@')) {
    console.log(
      `Ignoring page object reference: '${ref}'. Please use the 'pageObjectName.elements.${ref.slice(
        1,
      )}.selector' annotation.`,
    );
    return null;
  }

  return ref;
}

/**
 * Converts a list of element selectors into their corresponding bounding rectangles on the client side.
 *
 * @param {string[]} elementSelectors - An array of CSS selectors.
 * @returns {object[]} An array of objects representing the bounding rectangles of the elements.
 */
function clientSideIgnoreRegionsFromElements(elementSelectors) {
  if (!Array.isArray(elementSelectors)) {
    elementSelectors = [elementSelectors];
  }

  const elementToBoundingRect = (e) => {
    const clientRect = document.querySelector(e).getBoundingClientRect();
    return {
      height: clientRect.height,
      width: clientRect.width,
      x: clientRect.x,
      y: clientRect.y,
    };
  };
  return elementSelectors.map(elementToBoundingRect);
}

/**
 * Validates an object to ensure it represents a valid region with numeric properties and an optional name.
 *
 * @param {object} obj - The object representing a region, expected to have numeric 'width', 'height', 'x', 'y',
 *                       and an optional 'name' property.
 * @returns {object} The original object if it is valid.
 * @throws {Error} If the object does not conform to the expected structure for a region.
 */

function validateIgnoreRegion(obj) {
  const validKeys = ['width', 'height', 'x', 'y', 'name'];
  const integerKeys = ['width', 'height', 'x', 'y'];

  for (const key of validKeys) {
    if (integerKeys.includes(key) && typeof obj[key] !== 'number') {
      throw new Error(`Invalid type for ${key}, expected number`);
    }
  }

  if (obj.hasOwnProperty('name') && typeof obj['name'] !== 'string') {
    throw new Error(`Invalid type for name, expected string`);
  }

  return obj;
}

/**
 * Splits an array of mixed types (selectors, objects) into two separate arrays: one for element selectors
 * and another for region objects.
 *
 * @param {Array<string|object>} a - An array containing either CSS selectors or objects representing regions.
 * @returns {{elementSelectors: string[], regions: object[]}} An object containing two arrays: 'elementSelectors'
 *                                                            and 'regions'.
 * @throws {Error} If an element in the array is not a valid selector or a valid region object.
 */

function splitIgnorables(a) {
  let elementSelectors = [];
  const regions = [];

  for (const item of a) {
    if (Array.isArray(item)) {
      if (!item.every((elem) => typeof elem === 'string')) {
        throw new Error(
          `Array contains non-string values: ${JSON.stringify(item)}`,
        );
      }
      elementSelectors = elementSelectors.concat(item);
    } else if (typeof item === 'string') {
      elementSelectors.push(item);
    } else {
      try {
        const region = validateIgnoreRegion(item);
        regions.push(region);
      } catch (e) {
        throw new Error(
          `Invalid region object: ${JSON.stringify(item)} - Error: ${
            e.message
          }`,
        );
      }
    }
  }
  return { elementSelectors, regions };
}

/**
 * Converts a list of element selectors into their corresponding bounding rectangles using the Nightwatch browser context.
 *
 * @param {string[]} elementSelectors - An array of CSS selectors.
 * @returns {Promise<object[]>} A promise that resolves to an array of objects representing the bounding rectangles
 *                              of the elements.
 * @throws {Error} If the number of returned regions does not match the number of selectors.
 */
async function nightwatchIgnoreRegions(elementSelectors) {
  // @TODO:
  // For some reason, the following line is not working when you pass
  // an array of selectors. It works fine when you pass a single selector.
  // With the array, it returns an array of one element
  // const ignoreRegions = await browser.executeScript(
  //   clientSideIgnoreRegionsFromElements,
  //   elementSelectors,
  // );
  //
  // Workaround
  const scriptPromises = elementSelectors.map((selector) =>
    browser.executeScript(clientSideIgnoreRegionsFromElements, selector),
  );
  const ignoreRegions = (await Promise.all(scriptPromises)).flatMap(
    (innerArray) => innerArray,
  );

  if (ignoreRegions.length !== elementSelectors.length) {
    throw new Error(
      'Internal error while getting the bounding rect for elementSelectors',
    );
  }

  for (let i = 0; i < ignoreRegions.length; i++) {
    const r = ignoreRegions[i];
    const e = elementSelectors[i];
    r.name = e.toString();
  }

  return ignoreRegions;
}

/**
 * Parses the ignore options, which can be an array of strings, objects, or mixed, and processes each entry.
 * Page object references are resolved to their corresponding selectors.
 *
 * @param {Array<string|object|Array>} ignoreOptions - An array of ignore options, which can include CSS selectors,
 *                                                     objects, or other arrays.
 * @returns {Array} An array of processed ignore options, with page object references resolved to selectors.
 */
function parseIgnoreOptions(ignoreOptions) {
  return ignoreOptions.flatMap((ref) => {
    if (Array.isArray(ref)) {
      return ref
        .map((element) => processReference(element))
        .filter((processedRef) => processedRef !== null);
    }
    const processedRef = processReference(ref);

    return processedRef !== null ? [processedRef] : [];
  });
}

/**
 * Processes an array of 'ignorables' (selectors and/or regions) and converts them into a standardized format
 * suitable for ignoring regions in visual tests.
 *
 * @param {Array<string|object>} ignorables - An array of elements to ignore, which can be CSS selectors or
 *                                            region objects.
 * @returns {Promise<object[]>} A promise that resolves to an array of region objects in a standardized format
 *                              for ignoring in visual tests.
 */
async function toIgnoreRegionIn(ignorables) {
  const awaitedIgnorables = await Promise.all(ignorables);
  const { elementSelectors, regions } = splitIgnorables(awaitedIgnorables);
  const regionsFromElements = await nightwatchIgnoreRegions(elementSelectors);

  return [...regions, ...regionsFromElements]
    .map((r) => ({
      name: r.name ?? null,
      x: Math.round(r.x),
      y: Math.round(r.y),
      width: Math.round(r.width),
      height: Math.round(r.height),
    }))
    .filter((r) => 0 < r.width * r.height);
}

module.exports = {
  parseIgnoreOptions,
  toIgnoreRegionIn,
};
