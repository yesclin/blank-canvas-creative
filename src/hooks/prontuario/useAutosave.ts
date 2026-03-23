/**
 * useAutosave — Silent, non-intrusive autosave for clinical forms.
 *
 * - 10s debounce of user inactivity before saving
 * - Dirty-state tracking (no save if nothing changed)
 * - Prevents concurrent saves; queues re-save if data changed during save
 * - Never re-renders the full form tree on save
 * - Exposes discrete status for a small header indicator
 */

import { useRef, useCallback, useEffect, useState } from "react";

export type AutosaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface UseAutosaveOptions {
  /** Async function that persists the current data. Return value is ignored. */
  onSave: () => Promise<void>;
  /** Whether the form is in an editable state */
  enabled: boolean;
  /** Debounce delay in ms (default 10 000) */
  debounceMs?: number;
}

export function useAutosave({ onSave, enabled, debounceMs = 10_000 }: UseAutosaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const needsResaveRef = useRef(false);
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Cancel any pending timer
  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Internal save executor — guarded against concurrency
  const executeSave = useCallback(async () => {
    if (isSavingRef.current) {
      needsResaveRef.current = true;
      return;
    }
    isSavingRef.current = true;
    setStatus("saving");

    try {
      await onSave();
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      isSavingRef.current = false;
      // If data changed while we were saving, queue another round
      if (needsResaveRef.current) {
        needsResaveRef.current = false;
        // Small delay to avoid tight loop
        timerRef.current = setTimeout(() => executeSave(), 2000);
      }
    }
  }, [onSave]);

  /**
   * Call this whenever form data changes.
   * It marks the form as dirty and (re)starts the debounce timer.
   */
  const markDirty = useCallback(() => {
    if (!enabled) return;
    setStatus("unsaved");
    cancelPending();
    timerRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);
  }, [enabled, debounceMs, cancelPending, executeSave]);

  /**
   * Immediately persist (e.g. "Salvar rascunho" button).
   * Cancels any pending debounce timer.
   */
  const saveNow = useCallback(async () => {
    cancelPending();
    await executeSave();
  }, [cancelPending, executeSave]);

  // Cleanup on unmount or when disabled
  useEffect(() => {
    if (!enabled) {
      cancelPending();
    }
    return () => cancelPending();
  }, [enabled, cancelPending]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, status]);

  return {
    /** Current autosave status for UI indicator */
    status,
    /** Timestamp of the last successful save */
    lastSavedAt,
    /** Call on every field change — lightweight, just marks dirty + resets timer */
    markDirty,
    /** Force an immediate save (for buttons) */
    saveNow,
    /** Whether there are unsaved changes */
    hasUnsavedChanges: status === "unsaved",
    /** Reset status to idle (e.g. when leaving edit mode) */
    resetStatus: useCallback(() => {
      cancelPending();
      setStatus("idle");
      setLastSavedAt(null);
    }, [cancelPending]),
  };
}
