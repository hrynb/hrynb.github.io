'use strict';

// Run before the stylesheet so a saved theme is applied before the first paint.
(() => {
  const root = document.documentElement;
  const storageKey = 'hrynb-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const validPreference = value => value === 'light' || value === 'dark' ? value : null;
  let preference = null;
  try { preference = validPreference(window.localStorage.getItem(storageKey)); } catch { /* The toggle also works when browser storage is unavailable. */ }

  function applyTheme() {
    const theme = preference || (systemTheme.matches ? 'dark' : 'light');
    const changed = root.dataset.theme !== theme;
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#101214' : '#ffffff';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
    });
    if (changed) window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  function initializeToggle() {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { window.localStorage.setItem(storageKey, preference); } catch { /* Keep the in-memory preference for this page. */ }
        applyTheme();
      });
    });
    applyTheme();
    root.dataset.themeReady = 'true';
  }

  applyTheme();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeToggle, { once: true });
  else initializeToggle();
  systemTheme.addEventListener('change', () => { if (!preference) applyTheme(); });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = validPreference(event.newValue);
    applyTheme();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { preference = validPreference(window.localStorage.getItem(storageKey)); } catch { /* Preserve the in-memory preference. */ }
    applyTheme();
  });
})();
