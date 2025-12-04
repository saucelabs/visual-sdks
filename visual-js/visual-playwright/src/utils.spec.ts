import { describe, expect, it } from '@jest/globals';
import { constrainClipToViewport } from './utils';

describe('constrainClipToViewport', () => {
  it('should constrain an element to the viewport when extends out of bounds', () => {
    const result = constrainClipToViewport(
      {
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      },
      { width: 100, height: 100 },
    );

    expect(result).toEqual({
      x: 50,
      y: 50,
      width: 50,
      height: 50,
    });
  });

  it('should constrain an element to the viewport when extends out of bounds negative', () => {
    const result = constrainClipToViewport(
      {
        x: -50,
        y: -50,
        width: 100,
        height: 100,
      },
      { width: 100, height: 100 },
    );

    expect(result).toEqual({
      x: 0,
      y: 0,
      width: 50,
      height: 50,
    });
  });

  it('should not mutate an element that is already in bounds', () => {
    const result = constrainClipToViewport(
      {
        x: 10,
        y: 10,
        width: 50,
        height: 50,
      },
      { width: 100, height: 100 },
    );

    expect(result).toEqual({
      x: 10,
      y: 10,
      width: 50,
      height: 50,
    });
  });

  it('should not change an element in bounds', () => {
    const initial = {
      x: 50,
      y: 50,
      width: 50,
      height: 50,
    };
    const result = constrainClipToViewport(initial, {
      width: 100,
      height: 100,
    });

    expect(result).toEqual(initial);
  });
});
