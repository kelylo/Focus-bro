import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getUserState, type SupabaseEnv } from '../services/supabase';

const querySchema = { query: z.string().trim().max(120).optional() };
const limitSchema = { limit: z.number().int().min(1).max(50).optional() };
const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function limit(value: number | undefined): number {
  return value || 25;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function output(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}

function timetable(state: JsonRecord): JsonRecord {
  return record(state['focusbro.unified.timetable.v2'] || state['focusbro.timetable.v1']);
}

function tasks(state: JsonRecord): JsonRecord[] {
  return array(state['focusbro.timetable.tasks.v1']).filter(item => item && typeof item === 'object') as JsonRecord[];
}

function videos(state: JsonRecord): JsonRecord {
  return record(state['lockin.v1']);
}

export function registerReadTools(server: McpServer, env: SupabaseEnv, token: string): void {
  const read = async () => (await getUserState(env, token)).state;

  server.tool('get_tasks', 'Read the authenticated user’s saved study tasks.', limitSchema, async (args) => {
    const items = tasks(await read()).slice(0, limit(args.limit));
    return output({ tasks: items });
  });
  server.tool('get_timetable', 'Read the authenticated user’s saved timetable by day.', { day: z.string().trim().max(20).optional() }, async (args) => {
    const data = timetable(await read());
    const requested = args.day?.toUpperCase();
    return output({ timetable: requested ? { [requested]: data[requested] || [] } : data });
  });
  server.tool('get_subjects', 'List distinct subjects present in the authenticated user’s timetable.', {}, async () => {
    const data = timetable(await read());
    const subjects = new Set<string>();
    Object.values(data).forEach(day => array(day).forEach(item => {
      const subject = text(record(item).subject);
      if (subject) subjects.add(subject);
    }));
    return output({ subjects: [...subjects].sort() });
  });
  server.tool('get_subject_notes', 'Read notes attached to saved lesson videos, optionally filtered by text.', querySchema, async (args) => {
    const data = videos(await read());
    const query = args.query?.toLowerCase();
    const notes = array(data.vids).flatMap(video => {
      const item = record(video);
      return array(item.notes).map(note => ({ video: text(item.title), note: record(note) }));
    }).filter(item => !query || JSON.stringify(item).toLowerCase().includes(query));
    return output({ notes: notes.slice(0, 50) });
  });
  server.tool('get_video_progress', 'Read saved lesson video progress and checkpoints.', limitSchema, async (args) => {
    const items = array(videos(await read()).vids).map(item => {
      const video = record(item);
      return { title: video.title || '', position: video.pos || 0, duration: video.dur || 0, notes: array(video.notes).length };
    });
    return output({ videos: items.slice(0, limit(args.limit)) });
  });
  server.tool('search_learning_resources', 'Search the user’s saved lesson titles and notes. This does not search the public internet.', querySchema, async (args) => {
    const query = (args.query || '').toLowerCase();
    if (!query) return output({ resources: [] });
    const resources = array(videos(await read()).vids).map(item => record(item)).filter(item => JSON.stringify(item).toLowerCase().includes(query)).map(item => ({
      title: item.title || '', url: item.url || '', notes: array(item.notes).length
    }));
    return output({ resources: resources.slice(0, 25) });
  });
  server.tool('get_study_progress', 'Read recorded Focus Bro progress and XP without inventing missing metrics.', {}, async () => {
    const state = await read();
    const game = record(state['focusbro.game.v1']);
    const feynman = record(state['focusbro.feynman.game.v3']);
    const techniques = record(state['focusbro.techniques.v1']);
    const completedTechniques = Object.values(techniques).filter(Boolean).length;
    return output({ xp: typeof game.xp === 'number' ? game.xp : null, awards: Object.keys(record(game.awards)).length, feynmanLevel: feynman.currentLevel || null, completedTechniques });
  });
  server.tool('get_today_overview', 'Read today’s timetable entries and saved tasks.', {}, async () => {
    const state = await read();
    const day = dayNames[new Date().getDay()];
    return output({ day, classes: array(timetable(state)[day]), tasks: tasks(state).slice(0, 25) });
  });
  server.tool('get_upcoming_deadlines', 'Read saved tasks that contain a due date; tasks without dates are not treated as deadlines.', limitSchema, async (args) => {
    const items = tasks(await read()).filter(task => task.dueDate || task.deadline || task.date).slice(0, limit(args.limit));
    return output({ deadlines: items });
  });
  server.tool('get_weekly_report', 'Summarize available saved records for the current week without fabricating activity.', {}, async () => {
    const state = await read();
    const lessonCount = array(videos(state).vids).length;
    const taskCount = tasks(state).length;
    const noteCount = array(videos(state).vids).reduce((total, item) => total + array(record(item).notes).length, 0);
    return output({ available: { savedLessons: lessonCount, savedTasks: taskCount, savedNotes: noteCount }, limitation: 'The current schema does not record dated study sessions, so weekly activity totals are unavailable.' });
  });
  server.tool('identify_neglected_subjects', 'Identify timetable subjects with no saved lesson title or note match; this is a heuristic, not a performance judgment.', {}, async () => {
    const state = await read();
    const subjects = new Set<string>();
    Object.values(timetable(state)).forEach(day => array(day).forEach(item => { const subject = text(record(item).subject); if (subject) subjects.add(subject); }));
    const saved = JSON.stringify(videos(state)).toLowerCase();
    return output({ subjectsWithoutSavedLessonMatch: [...subjects].filter(subject => !saved.includes(subject.toLowerCase())) });
  });
}
