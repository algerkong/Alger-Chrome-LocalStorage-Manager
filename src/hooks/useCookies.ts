import { useCallback } from 'react';
import { CookieItem } from '../types';

export function useCookies() {
  const fetchAll = useCallback(async (url: string): Promise<CookieItem[]> => {
    const cookies = await chrome.cookies.getAll({ url });
    return cookies.map(c => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expirationDate ? Math.floor(c.expirationDate) : null,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite as CookieItem['sameSite'],
      size: new Blob([c.name + '=' + c.value]).size,
    }));
  }, []);

  const setCookie = useCallback(async (url: string, cookie: CookieItem) => {
    const details: chrome.cookies.SetDetails = {
      url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite === 'unspecified' ? undefined : cookie.sameSite as chrome.cookies.SameSiteStatus,
    };
    if (cookie.expires !== null) {
      details.expirationDate = cookie.expires;
    }
    await chrome.cookies.set(details);
  }, []);

  const removeCookie = useCallback(async (url: string, name: string) => {
    await chrome.cookies.remove({ url, name });
  }, []);

  const removeCookies = useCallback(async (url: string, names: string[]) => {
    await Promise.all(names.map(name => chrome.cookies.remove({ url, name })));
  }, []);

  return { fetchAll, setCookie, removeCookie, removeCookies };
}
