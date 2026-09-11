import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import sharp from 'sharp';
const root = fileURLToPath(new URL('../../', import.meta.url));
const art = resolve(root, 'public/art');
const output = resolve(root, 'public');
const entries = JSON.parse(await readFile(resolve(art, 'manifest.json'), 'utf8'));
const asset = id => resolve(art, entries.find(item => item.id === id).file);
await mkdir(resolve(output, 'og'), { recursive: true });
for (const [size, filename] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icone-192.png'], [512, 'icone-512.png']]) {
  await sharp(resolve(root, 'artwork/originals/dino-cabecalho.png')).resize(size, size).png().toFile(resolve(output, filename));
}
for (const id of ['home', 'manifesto', 'calculadora', 'jornada']) {
  await sharp(asset(`social-${id}`)).png().toFile(resolve(output, `og/og-${id}.png`));
}
await sharp(asset('social-home')).webp({ quality: 90 }).toFile(resolve(output, 'og-impostossauro.webp'));
const cards = entries.map(({ id, file, status, bytes, alt }) => `<figure><a href="../public/art/${file}"><img src="../public/art/${file}" alt="${alt['pt-BR']}" loading="lazy"></a><figcaption>${id}<small>${(bytes / 1000).toFixed(1)} KB · ${status === 'ready' ? 'Nova arte' : 'Versão anterior — nova arte pendente'}</small></figcaption></figure>`).join('');
await writeFile(resolve(root, 'artwork/catalogo.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nova arte — Impostossauro</title><style>body{margin:0;padding:32px;background:#151035;color:#faf3de;font:16px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}figure{margin:0;border-radius:20px;overflow:hidden;background:#251b51}img{width:100%;aspect-ratio:3/2;object-fit:contain;display:block}figcaption{padding:16px}small{display:block;color:#b7aad7}</style><h1>Impostossauro — nova arte</h1><p>Ilustrações geradas e revisadas. Clique para abrir cada arte em tamanho completo.</p><main>${cards}</main></html>`);
console.log('Ícones, cartões sociais e catálogo exportados.');
