/* v309 の保存・共有ブリッジ（native の office/player それぞれの www/nativefile.js）。
   Android の WebView には navigator.share（ファイル）が無く、Capacitor は <a download> も
   受け取らないため、バックアップ・アーカイブ前バックアップ・退避データ・シェア画像の4つが
   Android のアプリ版では一つも保存できなかった。その肩代わりをするのがこのブリッジ。

   いちばん大事なのは「iPhone の動きを1つも変えていない」こと＝Android 以外では
   window.__nativeFile を作らないこと。作ってしまうと iPhone の共有シートの道が丸ごと変わる。

   使い方： node tests/native-file.test.js
           node tests/native-file.test.js --mutate=guard  … Android 判定を外す（失敗するのが正しい）
           node tests/native-file.test.js --mutate=cancel … 中止の見分けを潰す（失敗するのが正しい）
   build.js の最後からも run() が呼ばれる。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

// nativefile.js を node の中で動かす
function boot(source, platform, plugins) {
  const win = { Capacitor: { getPlatform: () => platform, Plugins: plugins || {} } };
  const ctx = { window: win, console: { log() {} } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(source, ctx, { filename: 'nativefile.js' });
  return win;
}

// Capacitor のプラグインの代役。何を渡されたかを記録する
function stubs(opts) {
  opts = opts || {};
  const calls = { write: [], del: [], share: [] };
  const Filesystem = {
    writeFile(o) {
      calls.write.push(o);
      return opts.writeFail ? Promise.reject(new Error('disk full'))
                            : Promise.resolve({ uri: 'file:///cache/' + o.path });
    },
    deleteFile(o) { calls.del.push(o); return Promise.resolve(); },
  };
  const Share = {
    share(o) {
      calls.share.push(o);
      return opts.shareErr ? Promise.reject(new Error(opts.shareErr)) : Promise.resolve();
    },
  };
  return { calls, plugins: { Filesystem, Share } };
}

function bridgeSource(app, mutate) {
  const file = path.join(ROOT, 'native', app, 'www', 'nativefile.js');
  if (!fs.existsSync(file)) return null;
  let code = fs.readFileSync(file, 'utf8');

  // わざと壊す（build.js がこれで「テストが効いているか」を確かめる）
  if (mutate === 'guard') {
    if (code.indexOf("if(platform()!=='android')return;") < 0) throw new Error('mutate=guard の置き換え先が見つかりません');
    code = code.replace("if(platform()!=='android')return;", ';');
  }
  if (mutate === 'cancel') {
    if (code.indexOf('return /cancel|abort|dismiss/i.test(m);') < 0) throw new Error('mutate=cancel の置き換え先が見つかりません');
    code = code.replace('return /cancel|abort|dismiss/i.test(m);', 'return false;');
  }
  return code;
}

async function run(src, opts) {
  opts = opts || {};
  const say = opts.silent ? () => {} : (m) => console.log(m);
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; if (!opts.quiet) say('  ok   ' + m); } else { fail++; say('  FAIL ' + m); } };

  const index = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  for (const app of ['office', 'player']) {
    let code;
    try { code = bridgeSource(app, opts.mutate); }
    catch (e) { fail++; say('  FAIL ' + app + ': ' + e.message); continue; }
    if (!code) { fail++; say('  FAIL ' + app + ': nativefile.js がない（先に native/build-www.js を走らせる）'); continue; }

    // (1) iPhone と Web版には一切ぶら下がらない（ここが崩れると iPhone の保存の道が変わる）
    ok(!boot(code, 'ios', stubs().plugins).__nativeFile, app + ' iPhone: window.__nativeFile を作らない');
    ok(!boot(code, 'web', stubs().plugins).__nativeFile, app + ' Web版: window.__nativeFile を作らない');

    // (2) Android では使える
    const s1 = stubs();
    const w = boot(code, 'android', s1.plugins);
    ok(!!(w.__nativeFile && w.__nativeFile.share), app + ' Android: window.__nativeFile.share ができる');
    if (!(w.__nativeFile && w.__nativeFile.share)) continue;

    // (3) キャッシュに書いて、その場所を共有シートに渡す
    const r1 = await w.__nativeFile.share({ name: 'judo_backup.json', base64: 'eyJhIjoxfQ==', title: 'バックアップ' });
    ok(r1 === 'ok', app + ': 渡せたら ok を返す（返り値 ' + r1 + '）');
    ok(s1.calls.write.length === 1 && s1.calls.write[0].directory === 'CACHE', app + ': キャッシュに書く');
    ok(s1.calls.share.length === 1 && s1.calls.share[0].url === 'file:///cache/judo_backup.json', app + ': 書いた場所を共有シートに渡す');

    // (4) ファイル名に使えない文字は落とす（シェア画像の名前は大会名から作られる）
    const s2 = stubs();
    const w2 = boot(code, 'android', s2.plugins);
    await w2.__nativeFile.share({ name: '市民大会/第1回:決勝*.png', base64: 'AA==' });
    ok(s2.calls.write.length === 1 && !/[\\/:*?"<>|]/.test(s2.calls.write[0].path), app + ': 使えない文字を落とす（' + s2.calls.write[0].path + '）');

    // (5) 一時ファイルは次に呼ばれたときに消す（渡す前に消すと受け取り側が読めない）
    const s3 = stubs();
    const w3 = boot(code, 'android', s3.plugins);
    await w3.__nativeFile.share({ name: 'a.json', base64: 'AA==' });
    ok(s3.calls.del.length === 0, app + ': 1回目は何も消さない');
    await w3.__nativeFile.share({ name: 'b.json', base64: 'AA==' });
    ok(s3.calls.del.length === 1 && s3.calls.del[0].path === 'a.json', app + ': 2回目に前回の一時ファイルを消す');

    // (6) 本人が共有シートを閉じただけ＝失敗ではない（保存済みにも失敗にもしない）
    const s4 = stubs({ shareErr: 'Share canceled' });
    const r4 = await boot(code, 'android', s4.plugins).__nativeFile.share({ name: 'a.json', base64: 'AA==' });
    ok(r4 === 'cancel', app + ': 本人がやめたら cancel を返す（返り値 ' + r4 + '）');

    // (7) 本当に駄目だったときは fail（呼び出し側がエラーを出せる）
    const s5 = stubs({ shareErr: 'No activity found to handle Intent' });
    const r5 = await boot(code, 'android', s5.plugins).__nativeFile.share({ name: 'a.json', base64: 'AA==' });
    ok(r5 === 'fail', app + ': 渡せなかったら fail を返す（返り値 ' + r5 + '）');

    const s6 = stubs({ writeFail: true });
    const r6 = await boot(code, 'android', s6.plugins).__nativeFile.share({ name: 'a.json', base64: 'AA==' });
    ok(r6 === 'fail', app + ': 書き込みに失敗したら fail を返す（返り値 ' + r6 + '）');

    const r7 = await boot(code, 'android', {}).__nativeFile.share({ name: 'a.json', base64: 'AA==' });
    ok(r7 === 'fail', app + ': プラグインが無ければ fail を返す（落ちない）');
  }

  // (8) アプリ本体の4か所がブリッジを通ること（1つでも抜けると、そこだけ Android で保存できない）
  [
    ["const nf=await nativeFileShare(json,fname,'application/json','My柔道 バックアップ');", 'バックアップの書き出し'],
    ["const nf=await nativeFileShare(json,fname,'application/json','My柔道 アーカイブ前バックアップ');", 'アーカイブ前のバックアップ'],
    ["const nf=await nativeFileShare(raw,fname,'text/plain','My柔道 退避データ');", '退避データの書き出し'],
    ["const nf=await nativeFileShare(b,shareFileName(),shareImgMime(),'My柔道','#柔道 #My柔道',pre);", 'メモリーのシェア画像'],
  ].forEach(([needle, label]) => ok(index.indexOf(needle) >= 0, 'ブリッジを通る: ' + label));

  // (9) 保存先の案内は端末で言い換える（Android に「このiPhone内」と出さない）
  ok(index.indexOf('function backupDestAsk()') >= 0, '保存先の案内を端末で切り替える関数がある');
  ok(index.indexOf("  '保存先は端末の外（Google ドライブなど）になっていますか？「このデバイス内」だと、端末が壊れた時にバックアップも一緒に失われます。':{en:") >= 0,
     'Android 用の案内が辞書にある（英仏葡で日本語のまま出ない）');

  say('  native-file: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['guard', 'cancel'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  run(null, { mutate: m }).then((good) => process.exit(good ? 0 : 1));
}
