/**
 * Utility to compute edit window fields for anamnesis records.
 * Used by all save/insert flows to set saved_at + edit_window_until consistently.
 */

const EDIT_WINDOW_MINUTES = 15;

export function getEditWindowFields() {
  const now = new Date();
  const editWindowUntil = new Date(now.getTime() + EDIT_WINDOW_MINUTES * 60 * 1000);
  return {
    saved_at: now.toISOString(),
    edit_window_until: editWindowUntil.toISOString(),
  };
}
