import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import { useState } from 'react';
import { PANE_WIDGET } from '../constants';

/**
 * Every style here is inline and every SVG dimension is an attribute, on
 * purpose. The production build extracts CSS to a separate `[name].css` file,
 * but the template's HTML shim only ever injects `[name].js` — so an installed
 * build loads no stylesheet at all. Anything that depends on a CSS file renders
 * unstyled in the real plugin (giant icon, collapsed row, dead click target).
 */

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  boxSizing: 'border-box',
  padding: '4px 8px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: '20px',
  fontFamily: 'inherit',
  color: 'inherit',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

export const AssignmentsRow = ({ onClick }: { onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title="Open Severn Planner"
      style={{ ...row, background: hover ? 'rgba(127,127,127,0.16)' : 'transparent' }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.85 }}
        aria-hidden="true"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Assignments
      </span>
    </button>
  );
};

export const AssignmentsSidebar = () => {
  const plugin = usePlugin();
  return <AssignmentsRow onClick={() => plugin.window.openWidgetInPane(PANE_WIDGET)} />;
};

renderWidget(AssignmentsSidebar);
