// Game config. To bring the companions ALIVE with AI conversation:
//   1. Get an Anthropic API key (console.anthropic.com)
//   2. Paste it below between the quotes
//   3. Reload the game — companion dialogs gain a free-text chat box with memory.
// Without a key, companions use their scripted dialog. Nothing breaks.
// NOTE: the key lives only in this local file. Don't commit it: add config.js to .gitignore if you fill it in.

window.GAME_CONFIG = {
  anthropicApiKey: '',           // <- paste key here, e.g. 'sk-ant-...'
  aiModel: 'claude-sonnet-4-20250514',
  aiMaxTokens: 300,
  // Field balance: grove/dungeon enemies gain HP as your kill count snowballs
  // (combat kits untouched). Set false for the pure god-walk experience.
  fieldScaling: true,
};
