import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type SearchFocusOpenMode = "detail" | "focus" | "preview" | "readonly";

export interface SearchFocusTarget {
  /** Result type from useProntuarioGlobalSearch */
  type: string;
  /** Tab key to which we navigated */
  tabKey: string;
  /** Source database table for the record */
  sourceTable: string;
  /** Primary record id inside that table */
  sourceRecordId: string;
  /** Optional appointment context */
  appointmentId?: string | null;
  /** Convenience – same as sourceRecordId */
  highlightId: string;
  /** UI hint for how the record should be opened */
  openMode: SearchFocusOpenMode;
}

interface SearchFocusContextValue {
  focus: SearchFocusTarget | null;
  setFocus: (target: SearchFocusTarget | null) => void;
  clearFocus: () => void;
  /** Helper that components can call to know if a given record is the focused one */
  isFocused: (sourceTable: string, recordId: string) => boolean;
}

export const SearchFocusContext = createContext<SearchFocusContextValue | null>(null);

export function SearchFocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocusState] = useState<SearchFocusTarget | null>(null);

  const setFocus = useCallback((target: SearchFocusTarget | null) => {
    setFocusState(target);
  }, []);

  const clearFocus = useCallback(() => setFocusState(null), []);

  const isFocused = useCallback(
    (sourceTable: string, recordId: string) => {
      if (!focus) return false;
      return focus.sourceTable === sourceTable && focus.sourceRecordId === recordId;
    },
    [focus]
  );

  const value = useMemo<SearchFocusContextValue>(
    () => ({ focus, setFocus, clearFocus, isFocused }),
    [focus, setFocus, clearFocus, isFocused]
  );

  return <SearchFocusContext.Provider value={value}>{children}</SearchFocusContext.Provider>;
}

export function useSearchFocus(): SearchFocusContextValue {
  const ctx = useContext(SearchFocusContext);
  if (!ctx) {
    // Allow consumption outside of provider as a no-op (keeps blocks portable)
    return {
      focus: null,
      setFocus: () => {},
      clearFocus: () => {},
      isFocused: () => false,
    };
  }
  return ctx;
}

/**
 * Scrolls into view + temporarily highlights the element bound to the given
 * record when it matches the current search focus.
 *
 * Usage in a list item:
 *   const ref = useSearchFocusScroll("clinical_evolutions", evolution.id);
 *   <div ref={ref} data-search-record-id={evolution.id} className={...}>
 */
export function useSearchFocusScroll(sourceTable: string, recordId: string | null | undefined) {
  const { focus } = useSearchFocus();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!recordId) return;
    if (!focus) return;
    if (focus.sourceTable !== sourceTable) return;
    if (focus.sourceRecordId !== recordId) return;
    const el = ref.current;
    if (!el) return;

    // Defer to next paint so the tab content is mounted.
    const t = setTimeout(() => {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        el.scrollIntoView();
      }
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-md", "transition-shadow");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2500);
    }, 100);

    return () => clearTimeout(t);
  }, [focus, sourceTable, recordId]);

  return ref as React.MutableRefObject<any>;
}
