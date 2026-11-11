import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { updateUserState, type SupabaseEnv } from '../services/supabase';

type JsonRecord = Record<string, unknown>;

const id = z.string().trim().min(1).max(100);
const shortText = z.string().trim().min(1).max(500);
const confirmation = z.object({ confirmed: z.boolean().default(false) });

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function list(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as JsonRecord[] : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function response(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}

function confirmationRequired(tool: string, summary: string, identifiers: string[]) {
  return response({
    confirmation_required: true,
    tool,
    required_scope: 'academic.write',
    summary,
    affected_record_ids: identifiers,
    instruction: 'Review this summary and call the same tool again with confirmed=true to apply the change.'
  });
}

function ensureWritesEnabled(env: SupabaseEnv & { MCP_ENABLE_WRITE_TOOLS?: string }) {
  if (env.MCP_ENABLE_WRITE_TOOLS !== 'true') {
    throw new Error('Write tools are disabled until OAuth grant scope enforcement is enabled.');
  }
}

function copyState(state: JsonRecord): JsonRecord {
  return { ...state };
}

export function registerWriteTools(
  server: McpServer,
  env: SupabaseEnv & { MCP_ENABLE_WRITE_TOOLS?: string },
  token: string
): void {
  server.tool(
    'create_task',
    'Create one study task. Requires academic.write and explicit confirmation.',
    {
      title: shortText,
      category: z.enum(['Learn', 'Revision', 'Self-teach', 'Rest']).default('Learn'),
      dueDate: z.string().trim().max(40).optional(),
      idempotencyKey: id,
      ...confirmation.shape
    },
    async (args) => {
      ensureWritesEnabled(env);
      const taskId = `mcp_task_${crypto.randomUUID()}`;
      const task = { id: taskId, title: args.title, category: args.category, done: false, ...(args.dueDate ? { dueDate: args.dueDate } : {}), idempotencyKey: args.idempotencyKey };
      if (!args.confirmed) return confirmationRequired('create_task', `Create task "${args.title}"`, [taskId]);
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const tasks = list(next['focusbro.timetable.tasks.v1']);
        if (!tasks.some(item => item.idempotencyKey === args.idempotencyKey)) tasks.push(task);
        next['focusbro.timetable.tasks.v1'] = tasks;
        return next;
      });
      return response({ saved: true, task });
    }
  );

  server.tool(
    'update_task',
    'Update one user-owned study task. Requires academic.write and explicit confirmation.',
    {
      taskId: id,
      title: shortText.optional(),
      category: z.enum(['Learn', 'Revision', 'Self-teach', 'Rest']).optional(),
      dueDate: z.string().trim().max(40).optional(),
      done: z.boolean().optional(),
      ...confirmation.shape
    },
    async (args) => {
      ensureWritesEnabled(env);
      if (!args.confirmed) return confirmationRequired('update_task', `Update task ${args.taskId}`, [args.taskId]);
      let updated = false;
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const tasks = list(next['focusbro.timetable.tasks.v1']);
        const task = tasks.find(item => item.id === args.taskId);
        if (!task) throw new Error('Task not found.');
        if (args.title !== undefined) task.title = args.title;
        if (args.category !== undefined) task.category = args.category;
        if (args.dueDate !== undefined) task.dueDate = args.dueDate;
        if (args.done !== undefined) task.done = args.done;
        updated = true;
        next['focusbro.timetable.tasks.v1'] = tasks;
        return next;
      });
      return response({ saved: updated, taskId: args.taskId });
    }
  );

  server.tool(
    'create_note',
    'Add a note to one saved lesson video. Requires academic.write and explicit confirmation.',
    { videoId: id, text: z.string().trim().min(1).max(5000), timestamp: z.number().int().min(0).max(86400).default(0), idempotencyKey: id, ...confirmation.shape },
    async (args) => {
      ensureWritesEnabled(env);
      const note = { id: `mcp_note_${crypto.randomUUID()}`, t: args.timestamp, text: args.text, idempotencyKey: args.idempotencyKey, createdAt: new Date().toISOString() };
      if (!args.confirmed) return confirmationRequired('create_note', `Add a note to lesson ${args.videoId}`, [args.videoId, note.id]);
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const lockin = { ...record(next['lockin.v1']) };
        const videos = list(lockin.vids);
        const video = videos.find(item => item.id === args.videoId);
        if (!video) throw new Error('Lesson video not found.');
        const notes = list(video.notes);
        if (!notes.some(item => item.idempotencyKey === args.idempotencyKey)) notes.push(note);
        video.notes = notes;
        lockin.vids = videos;
        next['lockin.v1'] = lockin;
        return next;
      });
      return response({ saved: true, noteId: note.id, videoId: args.videoId });
    }
  );

  server.tool(
    'update_note',
    'Update one note on a saved lesson video. Requires academic.write and explicit confirmation.',
    { videoId: id, noteId: id, text: z.string().trim().min(1).max(5000), timestamp: z.number().int().min(0).max(86400).optional(), ...confirmation.shape },
    async (args) => {
      ensureWritesEnabled(env);
      if (!args.confirmed) return confirmationRequired('update_note', `Update note ${args.noteId} on lesson ${args.videoId}`, [args.videoId, args.noteId]);
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const lockin = { ...record(next['lockin.v1']) };
        const video = list(lockin.vids).find(item => item.id === args.videoId);
        if (!video) throw new Error('Lesson video not found.');
        const note = list(video.notes).find(item => item.id === args.noteId);
        if (!note) throw new Error('Note not found.');
        note.text = args.text;
        if (args.timestamp !== undefined) note.t = args.timestamp;
        next['lockin.v1'] = lockin;
        return next;
      });
      return response({ saved: true, noteId: args.noteId, videoId: args.videoId });
    }
  );

  server.tool(
    'create_flashcard',
    'Save a flashcard in the user’s academic state. Requires academic.write and explicit confirmation.',
    { front: z.string().trim().min(1).max(1000), back: z.string().trim().min(1).max(2000), subject: shortText.optional(), idempotencyKey: id, ...confirmation.shape },
    async (args) => {
      ensureWritesEnabled(env);
      const flashcard = { id: `mcp_card_${crypto.randomUUID()}`, front: args.front, back: args.back, ...(args.subject ? { subject: args.subject } : {}), idempotencyKey: args.idempotencyKey, createdAt: new Date().toISOString() };
      if (!args.confirmed) return confirmationRequired('create_flashcard', 'Save one flashcard', [flashcard.id]);
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const cards = list(next['focusbro.flashcards.v1']);
        if (!cards.some(item => item.idempotencyKey === args.idempotencyKey)) cards.push(flashcard);
        next['focusbro.flashcards.v1'] = cards;
        return next;
      });
      return response({ saved: true, flashcard });
    }
  );

  server.tool(
    'save_study_session',
    'Record a completed study session. Requires academic.write and explicit confirmation.',
    { startedAt: z.string().datetime(), durationMinutes: z.number().int().min(1).max(1440), subject: shortText.optional(), idempotencyKey: id, ...confirmation.shape },
    async (args) => {
      ensureWritesEnabled(env);
      const session = { id: `mcp_session_${crypto.randomUUID()}`, startedAt: args.startedAt, durationMinutes: args.durationMinutes, ...(args.subject ? { subject: args.subject } : {}), idempotencyKey: args.idempotencyKey };
      if (!args.confirmed) return confirmationRequired('save_study_session', 'Record one study session', [session.id]);
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const sessions = list(next['focusbro.study.sessions.v1']);
        if (!sessions.some(item => item.idempotencyKey === args.idempotencyKey)) sessions.push(session);
        next['focusbro.study.sessions.v1'] = sessions.slice(-500);
        return next;
      });
      return response({ saved: true, session });
    }
  );

  server.tool(
    'update_goal',
    'Update the user’s self-taught goal direction. Requires academic.write and explicit confirmation.',
    { goal: shortText, next: shortText.optional(), why: z.string().trim().max(1000).optional(), ...confirmation.shape },
    async (args) => {
      ensureWritesEnabled(env);
      if (!args.confirmed) return confirmationRequired('update_goal', 'Update the Focus Bro learning goal', ['lockin.selftaught.v2']);
      await updateUserState(env, token, state => {
        const next = copyState(state);
        const goal = { ...record(next['lockin.selftaught.v2']), goal: args.goal, ...(args.next !== undefined ? { next: args.next } : {}), ...(args.why !== undefined ? { why: args.why } : {}), updatedAt: new Date().toISOString() };
        next['lockin.selftaught.v2'] = goal;
        return next;
      });
      return response({ saved: true, key: 'lockin.selftaught.v2' });
    }
  );
}
