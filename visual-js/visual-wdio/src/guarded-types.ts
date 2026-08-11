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
 * A chainable reports `elementId` as a promise of the id, where a resolved
 * element reports the id itself. Nothing else in either shape is a reliable
 * discriminator: the chainable proxy answers to every symbol and to both
 * `getElement` and `getElements`, so a `$()` chainable and a `$$()` one look
 * identical from the outside.
 */
const isChainableElement = (value: unknown): value is ChainablePromiseElement =>
  !isWdioElement(value) &&
  typeof (value as ChainablePromiseElement | undefined)?.getElement ===
    'function';

/**
 * WebdriverIO 9 dropped `then` from the types of the chainables that `$()` and
 * `$$()` return. They do still resolve when awaited, but the type system no
 * longer says so, so unwrapping one that way costs a cast and leans on an
 * implementation detail. Reading `elementId` off the chainable avoids both: it
 * is declared as `Promise<string>`, and the single `await` below covers that,
 * a plain element, and a promise of one without asserting anything.
 */
export function resolveElementId(element: WdioElementLike): Promise<string>;
export function resolveElementId(
  element: WdioElementLike | undefined,
): Promise<string | undefined>;
export async function resolveElementId(
  element: WdioElementLike | undefined,
): Promise<string | undefined> {
  if (!element) return undefined;
  if (isChainableElement(element)) return element.elementId;
  return (await element).elementId;
}

/**
 * Unlike the id lookups above, this has to produce whole elements — callers
 * read `selector` off the result too — and it takes single elements and lists
 * alike, which the chainables cannot be told apart to unwrap individually. So
 * this one does await the chainable, which resolves it at runtime, and states
 * the resulting type that TypeScript cannot infer.
 */
export const awaitIgnorable = async (
  ignorable: Ignorable | Promise<RegionIn>,
): Promise<ResolvedIgnorable> => (await ignorable) as ResolvedIgnorable;
