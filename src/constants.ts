// Kept out of `src/widgets/` so importing it doesn't pull `declareIndexPlugin`
// into the other widget bundles.
export const PLANNER_URL_SETTING = 'planner-url';
export const OPEN_IN_SETTING = 'open-in';
export const OPEN_IN_PANE = 'pane';
export const OPEN_IN_FLOATING = 'floating';
export const DEFAULT_PLANNER_URL = 'https://severnplanner.edgeone.app';
export const PANE_WIDGET = 'assignments_pane';

// `widgetTabIcon` takes an image URL. A data URI keeps the icon working
// offline and avoids depending on the plugin's served root, which resolves
// against RemNote's origin rather than the plugin's.
export const TAB_ICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="#8a9099" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>`
  );
