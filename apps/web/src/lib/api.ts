const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  let res = await fetch(`${getApiUrl()}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  
  if (
    res.status === 401 &&
    typeof window !== 'undefined' &&
    path !== '/auth/login' &&
    path !== '/auth/refresh'
  ) {
    // Attempt silent refresh using HttpOnly refresh token
    try {
      const refreshRes = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        // Retry original request on successful token rotation
        res = await fetch(`${getApiUrl()}${path}`, {
          credentials: 'include',
          ...options,
          headers,
        });
      } else {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (err) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
  return res;
};
