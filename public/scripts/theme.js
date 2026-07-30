(function() {
  const toggle = document.getElementById('themeToggle');
  
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const saved = localStorage.getItem('theme');
  
  if (!saved && prefersDark.matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
})();
