/**
 * Đối chiếu các câu đang gọi qua t() với từ điển tiếng Anh.
 *
 *   node fe/scripts/check-translations.mjs          # liệt kê câu thiếu bản dịch
 *   node fe/scripts/check-translations.mjs --all    # in luôn toàn bộ khoá đang dùng
 *
 * Chạy sau mỗi lần thêm chữ mới lên giao diện. Thiếu bản dịch không làm vỡ giao diện
 * (câu đó hiện tiếng Việt) nên nếu không kiểm tra thì rất dễ để sót.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : [];
  });
}

/** Mọi chuỗi truyền trực tiếp vào t('...'). Khoá động (biến) không lấy được ở đây. */
function collectKeys() {
  const keys = new Set();

  for (const file of walk(SRC)) {
    if (file.includes(`${join('shared', 'i18n')}`)) continue;
    const source = readFileSync(file, 'utf8');

    for (const match of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      keys.add(match[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));
    }
  }

  return [...keys].sort((a, b) => a.localeCompare(b, 'vi'));
}

const dictionarySource = readFileSync(join(SRC, 'shared', 'i18n', 'en.ts'), 'utf8');
const keys = collectKeys();
const missing = keys.filter((key) => {
  const escaped = key.replace(/'/g, "\\'").replace(/\n/g, '\\n');
  return !dictionarySource.includes(`'${escaped}':`);
});

if (process.argv.includes('--all')) {
  console.log(keys.map((key) => `  '${key.replace(/'/g, "\\'").replace(/\n/g, '\\n')}': '',`).join('\n'));
}

console.log(`\nĐang dùng ${keys.length} câu, thiếu bản dịch: ${missing.length}`);
for (const key of missing) console.log(`  · ${key}`);

process.exitCode = missing.length > 0 ? 1 : 0;
