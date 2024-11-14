import { type } from 'arktype';
import {
  FullPageScreenshotOptions,
  IgnoreSelectorIn,
  makeValidate,
  RegionIn,
} from '@saucelabs/visual';

export type WdioElement = WebdriverIO.Element;

export type FullPageScreenshotWdioOptions =
  FullPageScreenshotOptions<WdioElement>;

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
  | WdioElement
  | WdioElement[]
  | Promise<WdioElement>
  | Promise<WdioElement[]>
  | RegionIn
  | IgnoreSelectorIn;
