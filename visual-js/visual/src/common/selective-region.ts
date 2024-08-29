import {
  DiffingOptionsIn,
  Rect,
  RegionIn,
} from '../graphql/__generated__/graphql';

export type SelectiveRegionOptions =
  | { enableOnly: Array<keyof DiffingOptionsIn>; disableOnly?: never }
  | { enableOnly?: never; disableOnly: Array<keyof DiffingOptionsIn> };

export type SelectiveRegion = Omit<RegionIn, 'diffingOptions'> &
  SelectiveRegionOptions;

export type VisualRegion<E> = {
  element: E;
} & SelectiveRegionOptions;

export async function selectiveRegionsToRegionIn<E>(
  regions: VisualRegion<E>[],
  fn: (region: E) => Promise<Rect[]>,
): Promise<RegionIn[]> {
  const awaited = await Promise.all(
    regions.map(async (region: VisualRegion<E>): Promise<RegionIn[]> => {
      const resolved = await fn(region.element);
      return resolved.map((rect) => ({
        ...rect,
        diffingOptions: selectiveRegionOptionsToDiffingOptions(region),
      }));
    }),
  );
  return awaited.flatMap((x) => x);
}

export function selectiveRegionsToRegionInSync<E>(
  regions: VisualRegion<E>[],
  fn: (region: E) => Rect[],
): RegionIn[] {
  let result;
  selectiveRegionsToRegionIn(regions, (r) => Promise.resolve(fn(r))).then(
    (r) => {
      result = r;
    },
  );
  if (result === undefined) throw new Error('internal logic error');
  return result;
}

export function selectiveRegionOptionsToDiffingOptions(
  opt: SelectiveRegionOptions,
): DiffingOptionsIn {
  if ('enableOnly' in opt && opt.enableOnly) {
    const diffingOptions: DiffingOptionsIn = {
      content: false,
      dimensions: false,
      position: false,
      structure: false,
      style: false,
      visual: false,
    };
    for (const key of opt.enableOnly) diffingOptions[key] = true;
    return diffingOptions;
  } else {
    const diffingOptions: DiffingOptionsIn = {
      content: true,
      dimensions: true,
      position: true,
      structure: true,
      style: true,
      visual: true,
    };
    for (const key of opt.disableOnly) diffingOptions[key] = false;
    return diffingOptions;
  }
}

export function selectiveRegionToRegionIn(
  input: SelectiveRegion[],
): Array<RegionIn> {
  return input.map((opt) => {
    const { x, y, width, height } = opt;
    return {
      x,
      y,
      width,
      height,
      diffingOptions: selectiveRegionOptionsToDiffingOptions(opt),
    };
  });
}
