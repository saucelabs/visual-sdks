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
 * Anything that resolves to a single element: an element, a promise of one, or
 * the chainable that `$()` returns in WebdriverIO 9.
 */
export type WdioElementLike =
  | WdioElement
  | Promise<WdioElement>
  | ChainablePromiseElement;

/**
 * Anything that resolves to a list of elements: elements, a promise of them, or
 * the chainable that `$$()` returns in WebdriverIO 9.
 */
export type WdioElementsLike =
  | WdioElement[]
  | Promise<WdioElement[]>
  | ChainablePromiseArray;

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

/**
 * WebdriverIO 9 chainables still resolve when awaited, but `then` was dropped
 * from their types, so awaiting one leaves TypeScript with the chainable rather
 * than the element it produces. These helpers bridge that gap; awaiting an
 * element or a promise of one is unchanged, so they stay v8-compatible.
 */
export const resolveElement = async (
  element: WdioElementLike,
): Promise<WdioElement> => (await element) as WdioElement;

export const resolveElementId = async (
  element: WdioElementLike | undefined,
): Promise<string | undefined> =>
  element ? (await resolveElement(element)).elementId : undefined;

export const awaitIgnorable = async (
  ignorable: Ignorable | Promise<RegionIn>,
): Promise<ResolvedIgnorable> => (await ignorable) as ResolvedIgnorable;
