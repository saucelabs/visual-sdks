import { type, Type } from 'arktype';
import { RegionIn } from '@saucelabs/visual';

const makeValidate =
  <T extends Type<any>>(t: T) =>
  (x: unknown): T['infer'] => {
    const { data, problems } = t(x);
    if (problems) {
      throw new Error(problems.toLocaleString());
    }
    return data;
  };

const ignoreRegionType: Type<RegionIn> = type({
  width: 'integer',
  height: 'integer',
  x: 'integer',
  y: 'integer',
  'name?': '1<=string<=100 | null | undefined',
});
export const isIgnoreRegion = ignoreRegionType.allows;
export const validateIgnoreRegion = makeValidate(ignoreRegionType);
export type IgnoreRegion = typeof ignoreRegionType.infer;

export type WdioElement = WebdriverIO.Element;
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
  | IgnoreRegion;
