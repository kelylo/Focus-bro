(function () {
  var endpoint = localStorage.getItem('focusbro.mcp.endpoint') || '';
  var cfg = window.FOCUS_BRO_SUPABASE;

  function auth() {
    return window.FocusBroAuth && window.FocusBroAuth.getState().session;
  }

  function showDiagnostics(items) {
    document.getElementById('diagnostics').innerHTML = items.map(function (item) {
      return '<span class="diagnostic">' + (item.ok ? '✅ ' : '⚠️ ') + item.label + ' — ' + item.detail + '</span>';
    }).join('');
  }

  function testEndpoint() {
    if (!endpoint) {
      showDiagnostics([{ ok: false, label: 'Worker endpoint', detail: 'Save the HTTPS /mcp URL first.' }]);
      return;
    }
    var base = endpoint.replace(/\/mcp\/?$/, '');
    showDiagnostics([{ ok: false, label: 'Testing', detail: 'Checking health and OAuth discovery...' }]);
    Promise.all([
      fetch(base + '/health'),
      fetch(base + '/.well-known/oauth-protected-resource'),
      fetch(base + '/.well-known/oauth-authorization-server')
    ]).then(function (responses) {
      return Promise.all(responses.map(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { response: response, data: data };
        });
      }));
    }).then(function (results) {
      var health = results[0];
      var resource = results[1];
      var oauth = results[2];
      showDiagnostics([
        { ok: health.response.ok, label: 'Worker health', detail: health.response.ok ? 'Reachable' : 'HTTP ' + health.response.status },
        { ok: resource.response.ok, label: 'Protected-resource discovery', detail: resource.response.ok ? 'Available' : 'HTTP ' + resource.response.status },
        { ok: oauth.response.ok, label: 'OAuth authorization metadata', detail: oauth.response.ok ? 'Published; provider authorization still requires live endpoints' : 'HTTP ' + oauth.response.status },
        { ok: false, label: 'Provider connection', detail: 'Not ready until /oauth/authorize and /oauth/token stop returning 501.' }
      ]);
    }).catch(function () {
      showDiagnostics([{ ok: false, label: 'Worker endpoint', detail: 'Could not reach the endpoint. Check HTTPS, deployment, and CORS/network access.' }]);
    });
  }

  function request(path, options) {
    var session = auth();
    if (!session) return Promise.reject(new Error('Sign in to manage AI connections.'));
    options = options || {};
    options.headers = Object.assign({
      apikey: cfg.publishableKey,
      Authorization: 'Bearer ' + session.access_token,
      'Content-Type': 'application/json'
    }, options.headers || {});
    return fetch(cfg.url + path, options).then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (error) {}
        if (!response.ok) throw new Error(data.message || 'Connection request failed.');
        return data;
      });
    });
  }

  function loadGrants() {
    request('/rest/v1/mcp_grants?select=id,provider,status,scopes,created_at,revoked_at&order=created_at.desc')
      .then(function (grants) {
        var list = document.getElementById('grant-list');
        ['chatgpt', 'claude'].forEach(function (provider) {
          var active = grants.filter(function (grant) {
            return grant.provider === provider && grant.status === 'active';
          });
          document.getElementById(provider + '-status').textContent = active.length ? 'Connected' : 'Not connected';
        });
        if (!grants.length) {
          list.innerHTML = '<p class="muted">No providers are connected.</p>';
          return;
        }
        list.innerHTML = grants.map(function (grant) {
          return '<div class="grant-row"><div><strong>' + grant.provider + '</strong><br><span class="muted">' +
            (grant.status === 'active' ? 'Connected' : 'Disconnected') + ' · ' + (grant.scopes || []).join(', ') +
            '</span></div>' + (grant.status === 'active' ? '<button type="button" data-revoke="' + grant.id + '">Revoke</button>' : '') + '</div>';
        }).join('');
        list.querySelectorAll('[data-revoke]').forEach(function (button) {
          button.onclick = function () {
            button.disabled = true;
            request('/rest/v1/mcp_grants?id=eq.' + encodeURIComponent(button.dataset.revoke), {
              method: 'PATCH',
              headers: { Prefer: 'return=minimal' },
              body: JSON.stringify({ status: 'revoked', revoked_at: new Date().toISOString() })
            }).then(loadGrants).catch(function (error) {
              button.disabled = false;
              list.insertAdjacentHTML('beforeend', '<p class="muted">' + error.message + '</p>');
            });
          };
        });
      }).catch(function (error) {
        document.getElementById('grant-list').innerHTML = '<p class="muted">' + error.message + '</p>';
      });
  }

  function copyEndpoint(button) {
    if (!endpoint) {
      showSetup('This connection is not available yet', [
        'Focus Bro still needs its secure connection service to be configured.',
        'This is an app setup task, not something you should solve with a Supabase URL or API key.',
        'Please try again after the connection service has been enabled.'
      ], 'No connection link is available yet.');
      return;
    }
    var done = function () {
      var old = button.textContent;
      button.textContent = 'Copied ✓';
      setTimeout(function () { button.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(endpoint).then(done).catch(function () { window.prompt('Copy this MCP endpoint:', endpoint); });
    } else {
      window.prompt('Copy this MCP endpoint:', endpoint);
    }
  }

  document.getElementById('mcp-endpoint').value = endpoint;
  function showSetup(title, steps, message) {
    document.getElementById('setup-title').textContent = title;
    document.getElementById('setup-steps').innerHTML = steps.map(function (step) {
      return '<li>' + step + '</li>';
    }).join('');
    document.getElementById('setup-message').textContent = message || '';
    document.getElementById('setup-actions').innerHTML = endpoint
      ? '<button type="button" class="copy-endpoint" id="setup-copy">Copy connection link</button>'
      : '';
    var copy = document.getElementById('setup-copy');
    if (copy) copy.onclick = function () { copyEndpoint(copy); };
    document.getElementById('setup-box').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  document.getElementById('save-endpoint').onclick = function () {
    var value = document.getElementById('mcp-endpoint').value.trim().replace(/\/+$/, '');
    if (!/^https:\/\//i.test(value) || !/\/mcp$/i.test(value)) {
      showDiagnostics([{ ok: false, label: 'Worker endpoint', detail: 'Use an HTTPS URL ending in /mcp.' }]);
      return;
    }
    endpoint = value;
    localStorage.setItem('focusbro.mcp.endpoint', endpoint);
    testEndpoint();
  };
  document.querySelectorAll('.connect-card .copy-endpoint').forEach(function (button) {
    button.onclick = function () { copyEndpoint(button); };
  });
  document.querySelectorAll('[data-provider]').forEach(function (button) {
    button.onclick = function () {
      var provider = button.dataset.provider;
      var pretty = provider === 'claude' ? 'Claude' : 'ChatGPT';
      if (!endpoint) {
        showSetup(pretty + ' connection', [
          'Focus Bro is checking whether its secure connection service is ready.',
          'There is no connection link configured for this app yet.',
          'You do not need to enter a password, API key, or Supabase URL.'
        ], 'The app owner must enable the connection service before ' + pretty + ' can connect.');
        return;
      }
      showSetup(pretty + ' connection', [
        'Your Focus Bro connection link is ready.',
        'Copy the link below and add it as a connector in ' + pretty + '.',
        'Sign in to Focus Bro when the provider asks for permission.'
      ], 'The provider connection authorization is not enabled on this deployment yet.');
    };
  });
  document.getElementById('test-connection').onclick = testEndpoint;
  if (window.FocusBroAuth) {
    FocusBroAuth.onReady(function () { if (auth()) loadGrants(); });
  }
  if (endpoint) testEndpoint();
}());
