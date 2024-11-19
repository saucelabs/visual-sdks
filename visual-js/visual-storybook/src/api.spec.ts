import { augmentStoryName } from './api';
import { expect } from '@jest/globals';
import { StoryContext } from './types';

describe('augmentStoryName', () => {
  const context: StoryContext = {
    id: 'test-id',
    name: 'Button',
    title: 'Example/Button',
  };

  it('should prefix a value', () => {
    const augmented = augmentStoryName(context, {
      prefix: 'prefix ',
    });
    expect(augmented).toEqual({
      ...context,
      name: 'prefix Button',
    });
  });

  it('should postfix a value', () => {
    const augmented = augmentStoryName(context, {
      postfix: ' postfix',
    });
    expect(augmented).toEqual({
      ...context,
      name: 'Button postfix',
    });
  });

  it('should allow supplying a custom name', () => {
    const augmented = augmentStoryName(context, {
      name: 'custom name',
    });
    expect(augmented).toEqual({
      ...context,
      name: 'custom name',
    });
  });
});
