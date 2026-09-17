import type {
  PartialStoryFn as StoryFunction,
  Renderer,
  StoryContext,
} from '@storybook/types';
import { useGlobals, useMemo } from '@storybook/preview-api';
import { PARAM_KEY } from './constants';
import cartesian from 'cartesian';
import React, { HTMLAttributes } from 'react';
import { sortBy } from 'lodash';

export const withGlobals = (
  StoryFn: StoryFunction<Renderer>,
  context: StoryContext<Renderer>,
) => {
  const [globals] = useGlobals();
  const isVariantsEnabled = globals[PARAM_KEY];
  // Is the addon being used in the docs panel
  const isInDocs = context.viewMode === 'docs';

  const variants: {
    enable?: boolean;
    include?: string[];
    exclude?: string[];
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    itemProps?: HTMLAttributes<HTMLDivElement>;
  } = context.parameters.variants ?? {};

  const { typeArray, keyLength } = useMemo(() => {
    const exclude = variants?.exclude ?? [];
    const allKeys = Object.keys(context.argTypes);
    const include = (variants?.include ?? allKeys ?? []).filter(
      (key) => !exclude.includes(key),
    );
    const keyObj: Record<string, string[]> = Object.fromEntries(
      include
        .map((key) => {
          const argType = context.argTypes[key];
          let values = [];

          if (!argType) {
            return [key, values];
          }

          if (argType.options) {
            values = argType.options;
          } else if (argType.type?.name === 'boolean') {
            values = [true, false];
          }

          return [key, values];
        })
        .filter(([, values]) => {
          return values.length > 0;
        }),
    );

    let maxValueLength = 0;
    const generatedKeys = Object.entries(keyObj)
      .sort(([, aVals], [, bVals]) => {
        maxValueLength = Math.max(maxValueLength, aVals.length, bVals.length);
        if (aVals.length === bVals.length) {
          return 0;
        }
        return aVals.length > bVals.length ? -1 : 1;
      })
      .map(([key]) => key);
    const cartesianArray = sortBy(cartesian(keyObj) as any[], generatedKeys);
    const keyLength = cartesianArray.length / (maxValueLength || 1);

    return {
      typeArray: cartesianArray,
      keyLength: keyLength,
    };
  }, [context.argTypes, variants]);

  if (isInDocs || !isVariantsEnabled || !variants?.enable || keyLength === 0) {
    return StoryFn();
  }

  const { wrapperProps, itemProps } = variants;

  return (
    <div
      {...wrapperProps}
      style={{
        display: 'grid',
        gap: 16,
        gridAutoFlow: 'row',
        gridTemplateColumns: `repeat(${keyLength}, 1fr)`,
        justifyItems: 'center',
        alignItems: 'center',
        ...wrapperProps?.style,
      }}
    >
      {typeArray.map((args, index) => (
        <div key={index} {...itemProps}>
          {StoryFn({
            args: {
              ...context.args,
              ...args,
            },
          })}
        </div>
      ))}
    </div>
  );
};
