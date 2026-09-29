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
    
    // Get the URL
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    // Create or modify options
    let options = args[1] || {};
    
    // Handle Headers object or plain object
    if (!options.headers) {
      options.headers = {};
    }
    
    // Convert Headers object to plain object if needed
    if (options.headers instanceof Headers) {
      const plainHeaders = {};
      options.headers.forEach((value, key) => {
        plainHeaders[key] = value;
      });
      options.headers = plainHeaders;
    }
    
    // Add authorization header if not already present
    if (!options.headers['Authorization'] && !options.headers['authorization']) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    
    // Call original fetch
    return originalFetch.call(this, url, options);
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
