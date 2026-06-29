# DeluxeTags Config Builder

A visual builder for the DeluxeTags Minecraft plugin config.yml, with a live chest-GUI preview.
Design tags with MiniMessage or legacy color codes, arrange them in the menu, preview how locked and
unlocked tags look, generate styled tags, and export a ready to use config.yml.

Built with Vite, React, and TypeScript. Frontend only: everything runs in the browser.

## Features

- Live inventory preview that mirrors the in game tags menu.
- Tag, category, and static item editors with a MiniMessage and legacy color editor.
- MiniMessage and legacy support, including hex, gradients (named or hex, multi stop), and rainbow.
- Per tag lock preview, custom model data, item data value, and a switchable Minecraft texture version.
- Import an existing config.yml (older formats are migrated) and export the full config.
- Tag Generator: styled text presets, themed packs, and random tags.
- Clone, copy and paste, and keyboard shortcuts with undo and redo.

## Getting started

Requires Node 20 or newer.

```
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # type-check and build to dist
npm run preview  # serve the production build
npm test         # run the Vitest suite
npm run coverage # run tests with coverage
npm run lint     # run ESLint
```

## Architecture

- `src/core` Pure, DOM free logic: config normalize, migrate, and serialize; YAML import and export;
  validation; MiniMessage and legacy formatting; the inventory preview builder; icon resolution; and
  the styled editor plain to raw mapping. Fully unit tested and usable from Node.
- `src/state` A typed useReducer and Context store with the CRUD, slot, drag, clone, paste, and
  generator actions, undo and redo history, toasts, and the focused editor and clipboard refs.
- `src/components` The React UI, which reproduces the original design by reusing the CSS in
  `src/styles`. Includes the inventory grid, the context panel editors, the contenteditable styled
  editor, the color helper, the item picker, and the settings, import, and generator modals.
- `src/generators.ts` The Tag Generator logic: style presets, themed packs, and random tags, behind
  a single GeneratedTag shape.
- `src/styles` The original styles.css and app.css, reused unchanged so the design matches 1:1.

The original static site is kept under `static/` for reference during the conversion.

## Extending the Tag Generator

New generators only need to produce `GeneratedTag` values (`{ tag, item?, displayname?, description?,
category? }`). Add a style preset to `STYLE_PRESETS`, a pack to `TAG_PACKS`, or a new generator
function in `src/generators.ts`, then surface it in `GeneratorModal`. A future AI pack can implement
the same shape without touching the rest of the app.

## Deployment

The app is a static single page build. Run `npm run build` and deploy the `dist` folder. It works on
Vercel, Netlify, or Cloudflare Pages with the default Vite settings and a root base path. There is no
backend and no client side routing.
