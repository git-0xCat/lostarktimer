import { Html, Head, Main, NextScript } from 'next/document'

// Pre-hydration script that applies the dark class before React paints,
// preventing the light-mode flash on a dark-mode reload.
const themeInitScript = `(function() {
  try {
    var stored = localStorage.getItem('darkMode');
    var useDark;
    if (stored === null) {
      useDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      useDark = JSON.parse(stored) === true || stored === '"true"' || stored === 'true';
    }
    if (useDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();`

export default function MyDocument() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
