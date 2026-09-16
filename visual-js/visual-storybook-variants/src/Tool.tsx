import React, { memo, useCallback } from 'react';
import { useGlobals } from '@storybook/manager-api';
import { IconButton, Icons } from '@storybook/components';
import { PARAM_KEY, TOOL_ID } from './constants';

export const Tool = memo(function MyAddonSelector() {
  const [globals, updateGlobals] = useGlobals();

  const isActive = [true, 'true'].includes(globals[PARAM_KEY]);

  const onToggle = useCallback(() => {
    updateGlobals({
      [PARAM_KEY]: !isActive,
    });
  }, [isActive]);

  return (
    <IconButton
      key={TOOL_ID}
      active={isActive}
      title="Toggle Variants"
      onClick={onToggle}
    >
      <Icons icon="component" />
    </IconButton>
  );
});
