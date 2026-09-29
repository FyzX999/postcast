// Auth check and token management
(function() {
  const token = localStorage.getItem('auth_token');
  
  // If no token, redirect to login
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  // Verify token on page load
  fetch('/api/verify', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(r => r.json())
  .then(data => {
    if (!data.valid) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login.html';
    }
  })
  .catch(() => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login.html';
  });
  
  // Add auth header to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[1]) {
      args[1].headers = args[1].headers || {};
      args[1].headers['Authorization'] = 'Bearer ' + token;
    } else {
      args[1] = {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
    }
    return originalFetch.apply(this, args);
  };
  
  // Add logout functionality
  window.logout = function() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      }).finally(() => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login.html';
      });
    } else {
      localStorage.removeItem('auth_token');
      window.location.href = '/login.html';
    }
  };
  
  // Add logout button to header once DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'theme-toggle';
      logoutBtn.innerHTML = '🚪';
      logoutBtn.title = 'Logout';
      logoutBtn.onclick = window.logout;
      headerActions.appendChild(logoutBtn);
    }
  });
})();
