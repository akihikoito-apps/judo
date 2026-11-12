/* v315: Android 実機（moto g06）2回目で出た3件の見張り。

   (1) 選手の購読画面に「解約は iPhone の設定から」と出ていた。
       原因は applyPlatformWording() を呼ぶ applyI18n() が、どこからも呼ばれていなかったこと。
       v309 で書いてから一度も動いていない死にコードだった。
       「関数がある」だけのテストでは通ってしまうので、ここでは「呼ばれているか」を見る。

   (2) 「道場に送る」「予定表を送る」で共有シートが出ず、黙ってコピーに落ちていた。
       Android の WebView には navigator.share が無い。テキストの共有は
       すべて shareTextOrFalse() を通し、その中でネイティブの共有シートへ渡す。

   (3) シェア画像が、ものすごく遅い。base64 の文字列でネイティブへ渡すため、
       1080x1350 の PNG（写真入りで3MB超）だと渡すだけで何秒もかかる。
       Android だけ JPEG にし、プレビュー中に base64 まで作り置きする。

   使い方： node tests/android-share.test.js
           node tests/android-share.test.js --mutate=boot  … 起動時の呼び出しを戻す（失敗するのが正しい）
           node tests/android-share.test.js --mutate=text  … 共有をnavigator.shareに戻す（失敗するのが正しい）
           node tests/android-share.test.js --mutate=jpeg  … 画像をPNGに戻す（失敗するのが正しい）
           node tests/android-share.test.js --mutate=bkset … 設定の案内の目印を1つ外す（失敗するのが正しい）
   build.js の最後からも run() が呼ばれる。 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const BOOT = "  startI18nObserver();\n  applyI18n();";
const TEXT_CALL = 'await shareTextOrFalse(';
const MIME = "function shareImgMime(){ return isAndroidApp()?'image/jpeg':'image/png'; }";

function run(src, opts) {
  opts = opts || {};
  const say = (m) => { if (!opts.quiet) console.log(m); };
  let pass = 0, fail = 0;
  const ok = (cond, label) => {
    if (cond) { pass++; return; }
    fail++;
    if (!opts.silent) console.error('  NG: ' + label);
  };

  let index = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // わざと壊す（build.js がこれで「テストが効いているか」を確かめる）
  if (opts.mutate === 'boot') {
    if (index.indexOf(BOOT) < 0) throw new Error('mutate=boot の置き換え先が見つかりません');
    index = index.replace(BOOT, '  startI18nObserver();\n  runI18nScan();');
  }
  if (opts.mutate === 'text') {
    if (index.indexOf(TEXT_CALL) < 0) throw new Error('mutate=text の置き換え先が見つかりません');
    index = index.split(TEXT_CALL).join('await navigator.share(');
  }
  if (opts.mutate === 'bkset') {
    if (index.indexOf('id="bkSetHow"') < 0) throw new Error('mutate=bkset の置き換え先が見つかりません');
    index = index.replace('id="bkSetHow"', '');   // 3行のうち1行だけ目印を外す
  }
  if (opts.mutate === 'jpeg') {
    if (index.indexOf(MIME) < 0) throw new Error('mutate=jpeg の置き換え先が見つかりません');
    index = index.replace(MIME, "function shareImgMime(){ return 'image/png'; }");
  }

  // ───── (1) 端末ごとの言い換えが、実際に呼ばれているか ─────
  ok(index.indexOf('function applyPlatformWording()') >= 0, '言い換えの関数がある');
  ok(index.indexOf('function applyI18n(){applyPlatformWording();runI18nScan();}') >= 0,
     'applyI18n() が言い換え→走査の順で呼ぶ');
  ok(index.indexOf(BOOT) >= 0, '起動時に applyI18n() を呼ぶ（runI18nScan() だけでは言い換えが当たらない）');
  // 言語を切り替えたあとも当たること
  const sl = index.indexOf('function setLang(L){');
  const slEnd = index.indexOf('\n}', sl);
  const slBody = sl < 0 ? '' : index.slice(sl, slEnd);
  ok(slBody.indexOf('applyI18n();') >= 0, '言語を切り替えたときも applyI18n() を呼ぶ');

  // 選手の購読画面は JS で描き直さないので、言い換えで入れ替えるほかない
  ok(index.indexOf("const pw=document.getElementById('paywallTerms'); if(pw)pw.textContent=payTermsText('auto');") >= 0,
     '選手の購読画面の解約の案内を入れ替える');
  ok(index.indexOf('id="paywallTerms"') >= 0, '選手の購読画面に目印の id がある');

  /* v316: Codex の点検。設定 →「データの保存・共有」の案内は、v309 の言い換えが
     届いていなかった（初回案内にしか id が無かった）。社長が実機で押すのはこの画面。 */
  for (const id of ['bkSetTitle', 'bkSetBody', 'bkSetHow']) {
    ok(index.indexOf('id="' + id + '"') >= 0, '設定の保存案内に目印がある: ' + id);
    ok(index.indexOf("document.getElementById('" + id + "')") >= 0,
       '設定の保存案内を Android で言い換える: ' + id);
  }
  ok(index.indexOf("if(st)st.textContent='📍 保存先は「Google ドライブ」がおすすめです';") >= 0,
     'Android に「iCloud Drive がおすすめ」と出さない');
  ok(index.indexOf("  '📍 保存先は「Google ドライブ」がおすすめです':{en:") >= 0,
     'その見出しの英仏葡の訳がある');
  // 言い換えの対象になっていない「iPhone」「iCloud」が、設定の保存案内に残っていないか
  const bk = index.slice(index.indexOf('<div class="bk-where">'), index.indexOf('<div class="bk-where">') + 900);
  ok(bk.indexOf('id="bkSetTitle"') >= 0 && bk.indexOf('id="bkSetBody"') >= 0 && bk.indexOf('id="bkSetHow"') >= 0,
     'iPhone 向けの3行すべてに目印がついている（1つでも漏れると Android にそのまま出る）');

  /* v316: Codex の点検。QR が1枚のときだけ、ネイティブの共有シートを通っていなかった。 */
  ok(index.indexOf("const nf=await nativeFileShare(bs[0],'match-qr.png','image/png','My柔道 試合結果');") >= 0,
     '道場に送る（QR画像1枚）もネイティブの共有シートを通る');

  // ───── (2) テキストの共有は、すべてネイティブを通る ─────
  ok(index.indexOf('async function shareTextOrFalse(text,title)') >= 0, 'テキスト共有の入口がある');
  ok(index.indexOf("if(nf==='ok'||nf==='cancel')return true;") >= 0,
     '本人がやめたときはコピーに進まない（勝手にコピーしない）');

  // shareTextOrFalse の中以外に、生の navigator.share({text ...}) が残っていないこと。
  // 1か所でも残っていると、そこだけ Android で共有シートが出ない。
  const bare = index.split('\n')
    .map((l, i) => [i + 1, l])
    .filter(([, l]) => /navigator\.share\(\{\s*text/.test(l))
    .filter(([, l]) => l.indexOf('return true;') < 0);   // 入口の中の1行だけは許す
  ok(bare.length === 0,
     'テキストの共有が shareTextOrFalse を通らない箇所がある: ' + bare.map(([n]) => n).join(','));

  // 落ちていた2か所が、実際に入口を通っていること
  ok(index.indexOf("if(await shareTextOrFalse(text,'My柔道 試合結果'))return;") >= 0, '道場に送る（試合結果）が通る');
  ok(index.indexOf("if(!await shareTextOrFalse(text,'My柔道 予定'))ssCopy(text);") >= 0, '予定表を送る（リンク）が通る');
  ok(index.indexOf("if(await shareTextOrFalse(r.text,'My柔道 予定'))return;") >= 0, '予定表を送る（テキスト）が通る');

  // ブリッジ側にテキストの口があること（生成元と、生成済みの2アプリ）
  const gen = fs.readFileSync(path.join(ROOT, 'native', 'build-www.js'), 'utf8');
  ok(gen.indexOf('window.__nativeFile={ share:share, text:shareText };') >= 0, 'ブリッジが text を出している');
  ok(gen.indexOf("if(platform()!=='android')return;") >= 0,
     'ブリッジは Android だけ（iPhone の共有の道を変えない）');
  for (const app of ['office', 'player']) {
    const f = path.join(ROOT, 'native', app, 'www', 'nativefile.js');
    if (!fs.existsSync(f)) continue;            // www 未生成のときは飛ばす
    const code = fs.readFileSync(f, 'utf8');
    ok(code.indexOf('text:shareText') >= 0, app + ': 生成された nativefile.js に text がある');
  }

  // ───── (3) シェア画像を軽くする ─────
  ok(index.indexOf(MIME) >= 0, 'Android のシェア画像は JPEG（PNG だと橋に渡すだけで何秒もかかる）');
  ok(index.indexOf("(ev.title||ev.name||'memory')+(isAndroidApp()?'.jpg':'.png')") >= 0,
     'ファイル名の拡張子も中身に合わせる');
  ok(index.indexOf("x.fillStyle='#fff'; x.fillRect(0,0,o.width,o.height); x.drawImage(cv,0,0);") >= 0,
     'JPEG は透明を扱えないので白で塗ってから書き出す');
  ok(index.indexOf("if(b&&isAndroidApp())blobToBase64(b,shareImgMime()).then(") >= 0,
     'プレビュー中に base64 まで作り置きする（押してからの待ちを消す）');
  ok(index.indexOf("const pre=(b===rkShareBlob&&rkShareB64)?rkShareB64:'';") >= 0,
     '作り置きが今の絵のものか確かめてから使う（古い絵を送らない）');
  ok(index.indexOf("const b64=b64pre||await blobToBase64(data,mime);") >= 0,
     '作り置きがなければ、これまでどおりその場で作る');
  ok(index.indexOf("  '画像を準備しています…':{en:") >= 0, '待たせるときの一言が辞書にある');

  // iPhone 側は 1つも変えない
  ok(index.indexOf("if(!isAndroidApp()){ cv.toBlob(b=>cb(b),'image/png'); return; }") >= 0,
     'iPhone と Web版は これまでどおり PNG');

  say('  android-share: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['boot', 'text', 'jpeg', 'bkset'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
