const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch();
  const p=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
  await p.goto('http://localhost:5173/admin/login',{waitUntil:'networkidle'}); await p.waitForTimeout(1800);
  await p.fill('#admin-email','admin@karja.id'); await p.fill('input[type=password]','karjaAdmin2026!');
  await p.click('button[type=submit]'); await p.waitForURL(u=>u.pathname.startsWith('/admin/')&&!u.pathname.endsWith('/admin/login'),{timeout:15000});
  await p.goto('http://localhost:5173/admin/products',{waitUntil:'networkidle'}); await p.waitForTimeout(3000);
  // hard refresh, ukur segera (500ms) untuk mendeteksi mock flash
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForTimeout(500);
  const early=await p.textContent('body');
  const mockEarly=/Aplikasi|Kelas Online|Ebook|Konsultasi Karir|Design System/.test(early);
  await p.waitForTimeout(3000);
  const late=await p.textContent('body');
  console.log('mock muncul saat loading (harusnya tidak)?', mockEarly);
  console.log('data DB tampil (Template Rapor)?', /Template Rapor Bulanan/.test(late));
  await b.close();
})();
