import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
});

const sessionData = {
  state: {
    nodes: [
      { id: 'role-1', type: 'block', position: { x: 60, y: 60 }, data: { type: 'role', label: 'Role', content: "Tu es un expert en rédaction technique, spécialisé dans la documentation API.", description: "Définit la persona" } },
      { id: 'ctx-1', type: 'block', position: { x: 360, y: 60 }, data: { type: 'context', label: 'Context', content: "Projet : API REST pour une app de gestion de tâches.", description: 'Fournit le contexte' } },
      { id: 'obj-1', type: 'block', position: { x: 660, y: 60 }, data: { type: 'objective', label: 'Objective', content: "Rédige une doc claire pour l'endpoint POST /tasks.", description: "Objectif" } },
      { id: 'con-1', type: 'block', position: { x: 60, y: 260 }, data: { type: 'constraints', label: 'Constraints', content: "Max 500 mots. Pas de jargon.", description: 'Contraintes' } },
    ],
    edges: [
      { id: 'e1', source: 'role-1', target: 'ctx-1', animated: true },
      { id: 'e2', source: 'ctx-1', target: 'obj-1', animated: true },
    ],
    rawPrompt: "Écris une documentation pour l'endpoint POST /tasks de mon API REST.",
    compiledPrompt: null
  },
  version: 0
};

// Desktop screenshot
const pageD = await browser.newPage();
await pageD.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await pageD.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
await pageD.evaluate((data) => { localStorage.setItem('flompt-session', JSON.stringify(data)); }, sessionData);
await pageD.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await pageD.screenshot({ path: '/tmp/flompt-desktop.png' });
console.log('Desktop OK');

// Mobile screenshot (iPhone 14 Pro)
const pageM = await browser.newPage();
await pageM.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await pageM.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
await pageM.evaluate((data) => { localStorage.setItem('flompt-session', JSON.stringify(data)); }, sessionData);
await pageM.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await pageM.screenshot({ path: '/tmp/flompt-mobile-canvas.png' });
console.log('Mobile canvas OK');

// Mobile — tab "input"
await pageM.evaluate(() => {
  const btns = document.querySelectorAll('.tab-btn');
  btns[0]?.click();
});
await new Promise(r => setTimeout(r, 400));
await pageM.screenshot({ path: '/tmp/flompt-mobile-input.png' });
console.log('Mobile input OK');

// Tablet screenshot
const pageT = await browser.newPage();
await pageT.setViewport({ width: 900, height: 700, deviceScaleFactor: 2 });
await pageT.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });
await pageT.evaluate((data) => { localStorage.setItem('flompt-session', JSON.stringify(data)); }, sessionData);
await pageT.reload({ waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await pageT.screenshot({ path: '/tmp/flompt-tablet.png' });
console.log('Tablet OK');

await browser.close();
