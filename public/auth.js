// Auth check and token management
(function() {
  // Skip auth check if we're on the login page
  if (window.location.pathname === '/login' || window.location.pathname === '/login.html') {
    return;
  }

  const token = localStorage.getItem('auth_token');
  
  // If no token, redirect to login
  if (!token) {
    window.location.href = '/login';
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
      window.location.href = '/login';
    }
  })
  .catch(() => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  });
  
  // Add auth header to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return originalFetch.apply(this, args);
    }
    
    if (args[1]) {
      args[1].headers = args[1].headers || {};
      if (!args[1].headers['Authorization']) {
        args[1].headers['Authorization'] = 'Bearer ' + token;
      }
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
        window.location.href = '/login';
      });
    } else {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
