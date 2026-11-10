const { currentUser } = require('../auth/supabase');
const stateService = require('../services/state');

const tools = [
  {
    name: 'get_focus_bro_state',
    description: 'Read the authenticated Focus Bro account state, including lessons, tasks, timetable, reflections, and progress.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'save_focus_bro_state',
    description: 'Replace the authenticated Focus Bro account state with the supplied JSON object.',
    inputSchema: {
      type: 'object',
      properties: { state: { type: 'object', description: 'The complete Focus Bro state document.' } },
      required: ['state']
    }
  }
];

async function call(name, arguments_) {
  const user = await currentUser();
  if (name === 'get_focus_bro_state') return stateService.getState(user.id);
  if (name === 'save_focus_bro_state') {
    if (!arguments_ || !arguments_.state || typeof arguments_.state !== 'object' || Array.isArray(arguments_.state)) {
      throw new Error('state must be a JSON object.');
    }
    return stateService.saveState(user.id, arguments_.state);
  }
  throw new Error('Unknown tool: ' + name);
}

module.exports = { tools, call };
