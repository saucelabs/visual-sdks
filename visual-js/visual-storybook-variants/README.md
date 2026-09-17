# Storybook Addon Storybook Visual Variants

![Visual variants example grid](https://docs.saucelabs.com/img/sauce-visual/visual-variants.png)

Display multiple variations of a component automatically in a grid.

## Getting Started

1. Install the Visual Variants plugin:

```shell
npm i -D @saucelabs/storybook-variants
```

2. Append the plugin to your storybook configuration file `main.ts|js` in the `addons` config property:

```typescript
import type { StorybookConfig } from "@storybook/react-vite";
const config: StorybookConfig = {
  // ... Your other storybook properties
  addons: [
    // ... Your other addons
    "@saucelabs/storybook-variants",
  ],
};
export default config;
```

3. Enable it globally or on a per-story basis

4. Start / restart / rebuild storybook

## Usage

> **NOTE:** This is best used with smaller components combined with the [centered layout](https://storybook.js.org/docs/configure/story-layout) ( `layout: "centered"` ), however, it can also be used with larger components if the grid is adjusted to account for size / layout.

Features can be enabled/disabled and customized on a global, component, or per story basis using Storybook's [parameters](https://storybook.js.org/docs/writing-stories/parameters) API with the `variants` key. Variants are disabled globally by default, and generally are recommended to enable on a per-story basis. Once enabled, you can use the new toolbar icon to toggle the display of variants while viewing a story.

To enable variants, add the `variants` key with an object configured using the options available below:

`variants`

- `enable` (`boolean | undefined`) - Whether variant output should be enabled for this story. Will inherit from a parent / global config if set higher in the tree. When enabled, the toolbar button can still be used to toggle the variants on / off while developing.
- `include` (`string[] | undefined`) - A list of prop names that we should use to generate variants. If omitted, we will use all compatible props -- booleans, or anything that generates 'options', such as enums, selects, controls, etc. While this covers _most_ scenarios, it may be overwhelming and generate too many options in a grid. Recommended to use a select few which generate the visual differences you're looking to cover (color, size, focus, disabled variants).
- `exclude` (`string[] | undefined`) - A list of prop names that we should exclude from variant generation. Can be used if you would like to generate for all available props and omit only a select few.
- `wrapperProps` (`HTMLAttributes<HTMLDivElement> | undefined`) - Additional props to place / override on the wrapper / container element in the grid. Can be used to customize inline styles or adjust the CSS grid templates -- for example by using a style override to use only a single column of items: `{ style: { gridTemplateColumns: 'repeat(1, 1fr)' } }`.
- `itemProps` (`HTMLAttributes<HTMLDivElement> | undefined`) - Additional props to place / override on the child elements in the grid.

### Example Configuration:

```typescript
const meta: Meta<typeof Button> = {
    title: "Example/Button",
    component: Button,
    parameters: {
        // Centers the component on screen. Useful for small components & helps make the grid more 
        // visually appealing.
        layout: 'centered',

        variants: {
            // Enable variants for this story. Can still be toggled off via the toolbar.
            enable: true,
            // Include only the `size` and `primary` props.
            include: ['size', 'primary'],
        },
    },
};
```

## Development

This addon is independent of `visual-storybook`, which is a separate integration for
Storybook's test-runner. They share no code.

This package pins Storybook 7, while the rest of `visual-js` is on Storybook 10. npm
nests the two versions, so a workspace install resolves both. Upgrading this package to
Storybook 10 is tracked separately.

Build the addon, then start the local Storybook that consumes it:

```sh
npm run build --workspace visual-storybook-variants
npm run storybook --workspace visual-storybook-variants
```

`npm start` runs both together with the build in watch mode. The local Storybook loads the
addon from `dist/` via `.storybook/local-preset.js`, so a build must run first.
