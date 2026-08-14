import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import { useEffect, useState } from 'react';
import { PANE_WIDGET } from '../constants';

/**
 * Deliberately loud while we work out how RemNote renders this location: if a
 * solid indigo block with white text appears in the sidebar, this widget
 * mounted. If a plain icon appears instead, RemNote is drawing its own
 * placeholder and this code never ran. Toned down once that's settled.
 *
 * All styling is inline - the production build extracts CSS to `[name].css`,
 * which the template's HTML shim never injects, so installed builds load no
 * stylesheet at all.
 */

const describe = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

export const AssignmentsLauncher = ({
  open,
  error,
}: {
  open: () => void;
  error?: string;
}) => (
  <div style={{ padding: 6 }}>
    <button
      type="button"
      onClick={open}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        boxSizing: 'border-box',
        padding: '8px 10px',
        borderRadius: 6,
        border: 'none',
        background: '#5b5bd6',
        color: '#ffffff',
        font: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 16, height: 16, flexShrink: 0 }}
        aria-hidden="true"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
      <span>Assignments</span>
    </button>
    {error && (
      <div style={{ marginTop: 6, fontSize: 12, color: '#ff8f8f' }}>Couldn't open: {error}</div>
    )}
  </div>
);

export const AssignmentsSidebar = () => {
  const plugin = usePlugin();
  const [error, setError] = useState<string | undefined>();

  // Announce that this widget mounted at all. The pane is NOT opened here:
  // RemNote may mount sidebar tabs at launch, and auto-opening would throw the
  // planner in your face on every start.
  useEffect(() => {
    plugin.app.toast('Assignments widget mounted');
  }, []);

  const open = async () => {
    try {
      await plugin.window.openWidgetInPane(PANE_WIDGET);
      setError(undefined);
    } catch (e) {
      setError(describe(e));
      await plugin.app.toast('Assignments: could not open - ' + describe(e));
    }
  };

  return <AssignmentsLauncher open={open} error={error} />;
};

renderWidget(AssignmentsSidebar);
