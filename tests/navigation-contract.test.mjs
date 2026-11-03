// VWEB.DEV Connect navigation contract tests.
// Run with: node --test tests/navigation-contract.test.mjs
// No npm install or paid dependencies required.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const app = source('assets/app.js');
const mobile = source('assets/mobile-app.js');
const sw = source('sw.js');
const html = source('index.html');
const routes = ['home','daily','studios','academy','network','pc','apps','dashboard','convert','tools','qr','ai','play','offers','community','account'];
test('every top-level route has a mounted page', () => {
 for (const id of routes) assert.match(html, new RegExp('id="page-' + id + '"'), id);
});
test('main router supports direct paths without hijacking tool details', () => {
 assert.match(app, /function navigateTopLevel\(key\)/);
 assert.match(app, /location\.origin/);
 assert.match(app, /target\.pathname\.match/);
 assert.match(app, /event\.defaultPrevented/);
 assert.match(app, /connect:routechange/);
});
test('mobile shell listens for custom route transitions', () => {
 assert.match(mobile, /addEventListener\('connect:routechange',updateScreen\)/);
 assert.match(mobile, /history\.back\(\)/);
});
test('PWA offline fallback covers all top-level routes', () => {
 const expression = sw.match(/const appRoute=(.+?)\.test\(pathname\);/);
 assert.ok(expression, 'service worker includes appRoute regexp');
 const pattern = Function('return ' + expression[1])();
 for (const route of routes) assert.ok(pattern.test('/'+route), route);
 assert.ok(pattern.test('/windows/license-diagnostics'));
 assert.equal(pattern.test('/unrelated'),false);
});
test('new release precaches reliability center and has a versioned cache', () => {
 assert.match(sw,/vweb-connect-static-v134/);
 assert.match(sw,/connect-integrity-v133\.js/);
 assert.match(sw,/connect-integrity-v133\.css/);
});
