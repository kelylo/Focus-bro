/*
 * Storage contract for the static pages.
 *
 * The implementation remains in src/auth/auth.js. Keeping this contract
 * documented here prevents new modules from writing directly to localStorage
 * and bypassing account sync.
 */
const SYNC_STORAGE_KEYS = Object.freeze([
  'lockin.v1',
  'lockin.selftaught.v1',
  'lockin.selftaught.v2',
  'focusbro.feynman.v1',
  'focusbro.feynman.v2',
  'focusbro.feynman.game.v3',
  'focusbro.game.v1',
  'focusbro.mindmap.v1',
  'focusbro.timetable.v1',
  'focusbro.unified.timetable.v2',
  'focusbro.timetable.tasks.v1',
  'focusbro.techniques.v1'
]);

if (typeof module !== 'undefined') {
  module.exports = { SYNC_STORAGE_KEYS };
}
