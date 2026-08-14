import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import { useEffect, useState } from 'react';
import { PANE_WIDGET } from '../constants';

/**
 * `LeftSidebar` is a tab strip: RemNote draws the tab from `widgetTabTitle` /
 * `widgetTabIcon`, and mounts this component when the tab is selected. So
 * selecting the tab *is* the click - the pane opens on mount, and this panel is
 * just there to reopen it without switching tabs twice.
 *
 * All styling is inline: the production build extracts CSS to `[name].css`,
 * which the template's HTML shim never injects, so installed builds load no
 * stylesheet at all. `color: inherit` picks up RemNote's own theme colours.
 */

const describe = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

export const AssignmentsLauncher = ({
  open,
  error,
}: {
  open: () => void;
  error?: string;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ padding: 8, color: 'inherit' }}>
      <button
        type="button"
        onClick={open}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 8px',
          borderRadius: 6,
          border: 'none',
          background: hover ? 'rgba(127,127,127,0.16)' : 'transparent',
          color: 'inherit',
          font: 'inherit',
          fontSize: 14,
          lineHeight: '20px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
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
        <span>Open Assignments</span>
      </button>

      <div style={{ padding: '8px 8px 0', fontSize: 12, lineHeight: '17px', opacity: 0.55 }}>
        Opens automatically when you select this tab. Also available from the command palette as
        “Open Assignments”.
      </div>

      {error && (
        <div style={{ margin: '8px 8px 0', fontSize: 12, lineHeight: '17px', color: '#e5484d' }}>
          Couldn't open: {error}
        </div>
      )}
    </div>
  );
};

export const AssignmentsSidebar = () => {
  const plugin = usePlugin();
  const [error, setError] = useState<string | undefined>();

  const open = async () => {
    try {
      await plugin.window.openWidgetInPane(PANE_WIDGET);
      setError(undefined);
    } catch (e) {
      setError(describe(e));
    }
  };

  // Selecting the tab mounts this, so selecting the tab opens the planner.
  useEffect(() => {
    open();
  }, []);

  return <AssignmentsLauncher open={open} error={error} />;
};

renderWidget(AssignmentsSidebar);
