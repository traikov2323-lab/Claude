// Сглобява сайта за Netlify в dist/: пълен HTML документ с PWA тагове, скриптове, иконки, manifest и service worker.
// Употреба: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist, { recursive: true });

const page = readFileSync(join(root, 'index.html'), 'utf8');
// Всичко преди SVG спрайта (title, meta, шрифтове, стилове) отива в <head>
const cut = page.indexOf('<svg width="0"');
const headPart = page.slice(0, cut);
const bodyPart = page.slice(cut);

const html = `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Модулия">
<meta property="og:title" content="Модулия — кухни по мярка">
<meta property="og:description" content="Проектирай кухня в 3D, виж цената веднага и изпрати заявка към цех.">
<meta property="og:image" content="/icons/icon-512.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${headPart.trim()}
</head>
<body>
${bodyPart.trim()}
</body>
</html>
`;
const build = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 12);
// версия към всеки скрипт: след обновяване браузърът и service worker-ът зареждат новите файлове
writeFileSync(join(dist, 'index.html'), html.replace(/src="js\/([a-z0-9]+)\.js"/g, `src="js/$1.js?v=${build}"`));
cpSync(join(root, 'js'), join(dist, 'js'), { recursive: true });
cpSync(join(root, 'pwa', 'icons'), join(dist, 'icons'), { recursive: true });
cpSync(join(root, 'pwa', 'img'), join(dist, 'img'), { recursive: true });
cpSync(join(root, 'pwa', 'manifest.webmanifest'), join(dist, 'manifest.webmanifest'));
writeFileSync(join(dist, 'sw.js'), readFileSync(join(root, 'pwa', 'sw.js'), 'utf8').replace('__BUILD__', build).replace(/'\/js\/([a-z0-9]+)\.js'/g, `'/js/$1.js?v=${build}'`));
writeFileSync(
  join(dist, '_headers'),
  `/sw.js
  Cache-Control: no-cache
/manifest.webmanifest
  Content-Type: application/manifest+json
/js/*
  Cache-Control: public, max-age=0, must-revalidate
`
);
console.log('dist готов:', build);
