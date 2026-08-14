# Severn Planner for RemNote

Adds an **Assignments** entry to the RemNote left sidebar. Clicking it opens
[severnplanner.edgeone.app](https://severnplanner.edgeone.app) in a RemNote pane, so
assignments and notes live in the same window.

## Install

**From a build**

1. `npm install`
2. `npm run build` — produces `PluginZip.zip`
3. RemNote → Settings → Plugins → **Build** → upload the zip

**For development**

1. `npm run dev` (serves on port 8080)
2. RemNote → Settings → Plugins → **Build** → *Develop from localhost* → `http://localhost:8080`

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| Severn Planner URL | `https://severnplanner.edgeone.app` | The site loaded in the pane. Point it at a local dev build to test changes. |

## Commands

`Open Assignments` — opens the planner in the focused pane, so it can be bound to a
shortcut or run from the command palette.

## Layout note

RemNote gives every plugin a single fixed slot in the left sidebar; there's no API to
insert a row at a chosen index. The plugin ships a `registerCSS` rule setting
`order: -1` on its sidebar container, which pulls **Assignments** above the built-in
rows. If a future RemNote release changes the sidebar's layout, that rule is the one
thing to adjust — see `src/widgets/index.tsx`.

## Project layout

| File | Role |
| --- | --- |
| `src/widgets/index.tsx` | Registers widgets, the setting, the command, and the ordering CSS |
| `src/widgets/assignments_sidebar.tsx` | The clickable **Assignments** sidebar row |
| `src/widgets/assignments_pane.tsx` | The pane that hosts the planner in an iframe |
