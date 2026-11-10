import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { currentUser, getState, saveState, type SupabaseEnv } from '../services/supabase';

const stateSchema = z.record(z.string(), z.unknown());

export function registerStateTools(server: McpServer, env: SupabaseEnv, token: string): void {
  server.tool(
    'get_focus_bro_state',
    'Read the authenticated Focus Bro account state, including lessons, tasks, timetable, reflections, and progress.',
    {},
    async () => {
      const user = await currentUser(env, token);
      const rows = await getState(env, token, user.id);
      return { content: [{ type: 'text', text: JSON.stringify(rows[0] || { state: {}, updated_at: null }) }] };
    }
  );
  server.tool(
    'save_focus_bro_state',
    'Replace the authenticated Focus Bro account state. This is a consequential write.',
    { state: stateSchema },
    async (args) => {
      const state = stateSchema.parse(args.state);
      const user = await currentUser(env, token);
      await saveState(env, token, user.id, state);
      return { content: [{ type: 'text', text: JSON.stringify({ saved: true }) }] };
    }
  );
}
