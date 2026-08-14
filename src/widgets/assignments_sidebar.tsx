import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../assignments_sidebar.css';

/**
 * The presentational half is kept free of `usePlugin()` so it can be rendered
 * outside a PluginProvider (Storybook, a plain harness, tests).
 */
export const AssignmentsRow = ({ onClick }: { onClick: () => void }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    title="Open Severn Planner"
    className="assignments-row rn-clr-content-primary"
  >
    <svg
      className="assignments-row__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
    <span className="assignments-row__label">Assignments</span>
  </div>
);

export const AssignmentsSidebar = () => {
  const plugin = usePlugin();
  return <AssignmentsRow onClick={() => plugin.window.openWidgetInPane('assignments_pane')} />;
};

renderWidget(AssignmentsSidebar);
