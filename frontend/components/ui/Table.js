import Spinner from "./Spinner";

/** Class for list-table header cells, so every table looks the same. */
export const TH_CLASS = "px-5 py-3 text-left text-xs font-medium text-slate-500";

/** Footer row under a list table: a summary on the left, a spinner while refreshing. */
export function TableFooter({ loading, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
      <span>{children}</span>
      {loading && <Spinner label="Updating" className="h-3.5 w-3.5" />}
    </div>
  );
}
