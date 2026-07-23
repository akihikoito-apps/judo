/* My道場 ビルドスクリプト（1ソース→2ビルド）
   マスターの index.html（APP_EDITION='suite'）から、個人専用アプリ personal.html を生成する。
   使い方： index.html / sw.js を編集して版を上げたあと、リポジトリ直下で `node build.js` を実行。
   将来: 事務専用ビルド office.html もここで生成できる（必要になったら追加）。 */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function build(edition, outFile, opts) {
  opts = opts || {};
  if (src.indexOf("const APP_EDITION='suite'") < 0) { console.error('APP_EDITION マーカーが見つかりません'); process.exit(2); }
  let p = src.replace("const APP_EDITION='suite'", "const APP_EDITION='" + edition + "'");
  // 派生ビルドは Web プレビュー時にマスター(index.html)の Service Worker と干渉させない
  if (opts.disableSW) {
    const swLine = "if(!('serviceWorker' in navigator))return;";
    if (p.indexOf(swLine) >= 0) p = p.replace(swLine, "return; /* " + edition + "-preview: SW無効 */ " + swLine);
  }
  fs.writeFileSync(path.join(ROOT, outFile), p, 'utf8');
  console.log('generated', outFile, '(' + edition + ')', p.length, 'bytes');
}

// 個人専用アプリ（Webプレビュー：SWは無効化してマスターと干渉させない）
build('personal', 'personal.html', { disableSW: true });

console.log('done. suite=index.html はマスター（APP_EDITION=suite のまま）。');
