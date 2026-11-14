// Renderiza los manuales a PDF con encabezado (gato + Space Cat) y pie con número de página.
const path = require('path');
const fs = require('fs');
const puppeteer = require(path.join(
  'C:', 'Users', 'A2024', 'amoblador3d', 'documentacion', 'herramientas', 'node_modules', 'puppeteer'
));

const DIR = __dirname;
const OUT = path.join(DIR, '..', 'public', 'descargas');
const catB64 = fs.readFileSync(path.join(DIR, 'cat_negro.png')).toString('base64');

const docs = [
  { html: 'instalacion.html', pdf: 'Space_Cat_Manual_de_Instalacion.pdf', titulo: 'Manual de instalación', codigo: 'SC-MI-01' },
  { html: 'usuario.html',     pdf: 'Space_Cat_Manual_de_Usuario.pdf',     titulo: 'Manual de usuario',     codigo: 'SC-MU-01' },
];

(async () => {
  const exe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({ headless: 'new', executablePath: exe, args: ['--no-sandbox'] });
  for (const d of docs) {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(DIR, d.html).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    const header = `
      <div style="width:100%; font-family: Georgia, serif; font-size:8px; color:#000;
                  padding:0 1.8cm; margin-top:.4cm; display:flex; align-items:center; gap:6px;
                  border-bottom:1px solid #000; padding-bottom:3px;">
        <img src="data:image/png;base64,${catB64}" style="height:14px;">
        <span style="font-weight:bold; letter-spacing:.5px;">SPACE CAT</span>
      </div>`;
    const footer = `
      <div style="width:100%; font-family: Georgia, serif; font-size:8px; color:#333;
                  padding:0 1.8cm; margin-bottom:.3cm; display:flex; justify-content:space-between;
                  border-top:1px solid #999; padding-top:3px;">
        <span>${d.codigo} · ${d.titulo}</span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
      </div>`;

    await page.pdf({
      path: path.join(OUT, d.pdf),
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: header,
      footerTemplate: footer,
      margin: { top: '2.2cm', bottom: '1.8cm', left: '1.8cm', right: '1.8cm' },
    });
    console.log('OK ->', d.pdf);
    await page.close();
  }
  await browser.close();
})();
