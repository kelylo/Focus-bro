import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { currentUser, getState, type SupabaseEnv } from '../services/supabase';

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
    'Legacy whole-state replacement is disabled. Use the narrowly scoped write tools instead.',
    {},
    async () => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          saved: false,
          error: 'whole_state_write_disabled',
          message: 'Use create_task, update_task, create_note, update_note, create_flashcard, save_study_session, or update_goal.'
        })
      }]
    })
  );
}
