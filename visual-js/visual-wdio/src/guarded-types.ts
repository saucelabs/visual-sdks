import { type } from 'arktype';
import {
  FullPageScreenshotOptions,
  IgnoreSelectorIn,
  makeValidate,
  RegionIn,
} from '@saucelabs/visual';
import type {
  ChainablePromiseArray,
  ChainablePromiseElement,
} from 'webdriverio';

export type WdioElement = WebdriverIO.Element;

/**
 * A single element, or the chainable that `$()` returns in WebdriverIO 9. Both
 * answer to `elementId`: a resolved element reports the id itself, a chainable
 * reports a promise of it. A promise of an element is not accepted — WebdriverIO
 * 9 no longer converts a chainable to an element by awaiting it, so anything
 * holding a promise (`getElement()`, an async page object) awaits it first.
 */
export type WdioElementLike = WdioElement | ChainablePromiseElement;

/**
 * A list of elements, or the chainable that `$$()` returns in WebdriverIO 9.
 * As with {@link WdioElementLike}, a promise of a list is awaited by the caller.
 */
export type WdioElementsLike = WdioElement[] | ChainablePromiseArray;

export type FullPageScreenshotWdioOptions =
  FullPageScreenshotOptions<WdioElementLike>;

const wdioElementType = type({
  elementId: 'string',
  selector: 'string',
});

export const isWdioElement = wdioElementType.allows as (
  x: unknown,
) => x is WdioElement;

export const validateWdioElement = makeValidate(wdioElementType) as (
  x: unknown,
) => WdioElement;

export type Ignorable =
  | WdioElementLike
  | WdioElementsLike
  | RegionIn
  | IgnoreSelectorIn;

/**
 * An {@link Ignorable} once it has been awaited.
 */
export type ResolvedIgnorable =
  | WdioElement
  | WdioElement[]
  | RegionIn
  | IgnoreSelectorIn;
