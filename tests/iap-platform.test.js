/* 課金ブリッジ（native の office/player それぞれの www/iap.js）が iPhone と Android で正しく切り替わるか。
   v307 で Android 対応を入れたとき、iPhone 側の動きを一つも変えていないことも見る。

   単体で動かすとき:  node tests/iap-platform.test.js
   わざと壊して確かめる: node tests/iap-platform.test.js --mutate=android | --mutate=storekit */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

/* iap.js を node の中で動かし、Purchases プラグインに何が渡されたかを捕まえる。
   configure は init() の中で同期的に呼ばれるので、restore() を待たなくても捕まる。 */
function boot(source, platform) {
  const captured = {};
  const P = {
    configure(opts) { captured.configure = opts; return 'cbid'; },
    restorePurchases() { return Promise.resolve({ customerInfo: { entitlements: { active: {} } } }); },
    getOfferings() { return Promise.resolve({ current: null }); },
    getCustomerInfo() { return Promise.resolve({ customerInfo: { entitlements: { active: {} } } }); },
  };
  const win = { Capacitor: { getPlatform: () => platform, Plugins: { Purchases: P } } };
  const ctx = {
    window: win, console: { log() {} },
    document: { addEventListener() {} }, setTimeout() {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(source, ctx, { filename: 'iap.js' });
  if (win.__iap) win.__iap.restore();        // init() を走らせる（結果は待たない）
  return { iap: win.__iap, captured };
}

function run(src, opts) {
  opts = opts || {};
  const say = opts.silent ? () => {} : (m) => console.log(m);
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; if (!opts.quiet) say('  ok   ' + m); } else { fail++; say('  FAIL ' + m); } };

  const index = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  for (const app of ['office', 'player']) {
    const file = path.join(ROOT, 'native', app, 'www', 'iap.js');
    if (!fs.existsSync(file)) { fail++; say('  FAIL ' + app + ': iap.js がない（先に native/build-www.js を走らせる）'); continue; }
    let code = fs.readFileSync(file, 'utf8');

    // わざと壊す（build.js がこれで「テストが効いているか」を確かめる）
    if (opts.mutate === 'android') code = code.replace('IS_ANDROID?API_KEY_ANDROID:API_KEY_IOS', 'API_KEY_IOS');
    if (opts.mutate === 'storekit') code = code.replace('if(!IS_ANDROID) opts.storeKitVersion', 'if(1) opts.storeKitVersion');

    // (1) iPhone — v306 までと同じであること
    const i = boot(code, 'ios');
    ok(!!i.iap, app + ' iPhone: window.__iap ができる');
    ok(!!i.captured.configure && /^appl_/.test(i.captured.configure.apiKey), app + ' iPhone: Apple の鍵を使う');
    ok(!!i.captured.configure && i.captured.configure.storeKitVersion === 'STOREKIT_2', app + ' iPhone: storeKitVersion を渡す');

    // (2) Android・鍵が仮置きのあいだ — 黙って止まる（落ちない）
    const a = boot(code, 'android');
    ok(!!a.iap, app + ' Android: window.__iap ができる');
    ok(!a.captured.configure, app + ' Android: 仮置きの鍵では configure を呼ばない');

    // (3) Android・鍵が入ったあと（Play 登録後の姿を先に確かめる）
    const g = boot(code.replace('REVENUECAT_ANDROID_PENDING', 'goog_TESTKEY'), 'android');
    ok(!!g.captured.configure && /^goog_/.test(g.captured.configure.apiKey), app + ' Android: Google の鍵を使う');
    ok(!!g.captured.configure && g.captured.configure.storeKitVersion === undefined, app + ' Android: storeKitVersion を渡さない');

    // (4) 文言
    ok(code.indexOf('Google Play側で問題が起きています') >= 0, app + ': Android 用の文言がある');
    ok(code.indexOf('ファミリーリンク') >= 0, app + ': 制限の案内が Android 向けになっている');
    ok(code.indexOf('App Store側で問題が起きています') >= 0, app + ': Apple 用の文言も残っている');
  }

  // (5) 新しい文言が辞書に入っているか（入っていないと英仏葡で日本語のまま出る）
  [
    'Google Play側で問題が起きています。少し時間をおいてもう一度お試しください。',
    'この端末では購入が許可されていません。ファミリーリンクなどの制限をご確認ください。',
    'このご購入は別のGoogleアカウントで使用中です。ご購入時のアカウントでお試しください。',
    'このご購入は別のGoogleアカウントで使用中です。',
    'このGoogleアカウントでのご購入が見つかりませんでした',
  ].forEach((s) => ok(index.indexOf("  '" + s + "':{en:") >= 0, '辞書にある: ' + s.slice(0, 24) + '…'));

  say('  iap-platform: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['android', 'storekit'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
