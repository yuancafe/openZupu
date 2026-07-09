const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production');
  }

  return 'http://localhost:3001/api';
};

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
};

export const setAuthSession = (data: any) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (data?.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  if (data?.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  window.dispatchEvent(new Event('openzupu-auth-change'));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('openzupu-auth-change'));
};

const authHeader = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('access_token');
  return token ? `Bearer ${token}` : null;
};

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  const { skipAuthRedirect, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = authHeader();
  if (token) {
    headers.set('Authorization', token);
  }
  
  let res = await fetch(`${getApiUrl()}${path}`, {
    credentials: 'include',
    ...fetchOptions,
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
        setAuthSession(await refreshRes.json());
        // Retry original request on successful token rotation
        res = await fetch(`${getApiUrl()}${path}`, {
          credentials: 'include',
          ...fetchOptions,
          headers: (() => {
            const retryHeaders = new Headers(headers);
            const retryToken = authHeader();
            if (retryToken) {
              retryHeaders.set('Authorization', retryToken);
            }
            return retryHeaders;
          })(),
        });
      } else {
        clearAuthSession();
        if (!skipAuthRedirect) {
          window.location.href = '/login';
        }
      }
    } catch (err) {
      clearAuthSession();
      if (!skipAuthRedirect) {
        window.location.href = '/login';
      }
    }
  }
  return res;
};
