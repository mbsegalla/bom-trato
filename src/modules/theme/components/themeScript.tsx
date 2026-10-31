import Script from 'next/script';

import { THEME_STORAGE_KEY } from '../services/theme.storage';

const script = `
  (function () {
    try {
      var theme = window.localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';

      var dark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    } catch {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  })();
`;

export function ThemeScript() {
  return (
    <Script id="bom-trato-theme" strategy="afterInteractive">
      {script}
    </Script>
  );
}
