// main.js – BlackMart Online App enhancements

document.addEventListener('DOMContentLoaded', () => {
  // Mark the active nav link based on current path
  const currentPath = location.pathname;
  document.querySelectorAll('nav a, a').forEach(link => {
    try {
      const url = new URL(link.href, location.origin);
      if (url.pathname !== '/' && currentPath.startsWith(url.pathname)) {
        link.setAttribute('aria-current', 'page');
        link.style.fontWeight = '700';
      }
    } catch (_) {}
  });
});
