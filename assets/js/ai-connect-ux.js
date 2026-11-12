(function () {
  function show(title, steps, message) {
    document.getElementById('setup-title').textContent = title;
    document.getElementById('setup-steps').innerHTML = steps.map(function (step) {
      return '<li>' + step + '</li>';
    }).join('');
    document.getElementById('setup-message').textContent = message;
    document.getElementById('setup-box').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.querySelectorAll('[data-provider]').forEach(function (button) {
    button.onclick = function () {
      var provider = button.dataset.provider === 'claude' ? 'Claude' : 'ChatGPT';
      var endpoint = localStorage.getItem('focusbro.mcp.endpoint');
      if (endpoint) {
        show(provider + ' connection', [
          'Your secure connection link is ready.',
          'Copy it below and add it as a connector in ' + provider + '.',
          'Sign in to Focus Bro when the provider asks for permission.'
        ], 'Provider authorization is not enabled on this deployment yet.');
        return;
      }
      show(provider + ' connection', [
        'Focus Bro checks the secure connection service first.',
        'If it is ready, you will get a connection link to copy.',
        'If it is not ready, the app tells you clearly and no external page is opened.'
      ], 'This deployment does not currently have a connection service configured. No action is required from you.');
    };
  });

  document.querySelectorAll('.connect-card .copy-endpoint').forEach(function (button) {
    button.onclick = function () {
      var endpoint = localStorage.getItem('focusbro.mcp.endpoint');
      if (endpoint) {
        navigator.clipboard.writeText(endpoint).then(function () {
          button.textContent = 'Copied ✓';
          setTimeout(function () { button.textContent = 'Copy connection link'; }, 1600);
        }).catch(function () { window.prompt('Copy this connection link:', endpoint); });
        return;
      }
      show('Connection link', [
        'A connection link is supplied automatically when the Focus Bro connection service is enabled.',
        'There is no link available in this deployment yet.',
        'You should not enter a Supabase URL, password, or API key.'
      ], 'The app owner must enable the secure connection service before this can be copied.');
    };
  });
}());
