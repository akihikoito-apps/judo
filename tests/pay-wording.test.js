/* 課金まわりの文言（v313）。

   Android の利用者に「解約は iPhone の『設定 › サブスクリプション』から」と案内していた。
   Google Play の審査で落ちる理由になるうえ、読んだ人がそのとおりにしても解約できない。
   v312 の大会のお知らせと同じで、文は丸ごと2通り用意して選ぶ。
   「iPhoneの設定」の部分だけ差し替える作りにすると、語順の違う言語で組み立て直せない。

   ここで守りたいのは2つ。
     (1) Android では必ず Google Play の案内が出ること（iPhone と書かないこと）
     (2) 新しく足した日本語の文に、英・仏・葡の訳が全部あること
         ——訳が無いと、その言語の利用者に日本語のまま出る（v312 で踏んだのと同じ穴）

   使い方： node tests/pay-wording.test.js
           node tests/pay-wording.test.js --mutate=store … ストアの出し分けを潰す（失敗が正しい）
           node tests/pay-wording.test.js --mutate=tr    … 訳を1つ消す（失敗が正しい）
   build.js の最後からも run() が呼ばれる。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

// 「function 名前(」から対応する } までを取り出す（中括弧の数だけを数える）
function extractFn(src, name) {
  const head = '\nfunction ' + name + '(';
  const i = src.indexOf(head);
  if (i < 0) throw new Error('index.html に function ' + name + ' が見つかりません');
  const open = src.indexOf('{', i);
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(i + 1, j + 1); }
  }
  throw new Error('function ' + name + ' の終わりが見つかりません');
}

// 辞書の1項目を取り出す。
// DICT 全体を中括弧の数で切り出そうとすると、訳文の中に「{」を含むものがあって
// 途中で閉じたことになってしまう。ここでは「その日本語の文で始まる行」だけを見る。
function entryFor(src, ja) {
  const key = "'" + ja + "':{";
  const i = src.indexOf(key);
  if (i < 0) return null;
  const j = src.indexOf('},\n', i);
  if (j < 0) return null;
  return src.slice(i + key.length, j);
}

function load(html, android, mutate) {
  let code = ['payTermsText', 'priceUnknownText'].map((n) => extractFn(html, n)).join('\n');

  if (mutate === 'store') {
    if (code.indexOf('isAndroidApp()?G:A') < 0) throw new Error('mutate=store の置き換え先が見つかりません');
    code = code.replace('isAndroidApp()?G:A', 'A');
  }

  // T は「日本語の文をそのまま返す」役にする。訳があるかは DICT 側で別に見る
  const ctx = { isAndroidApp: () => android, T: (s) => s, console: { log() {} } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'pay-wording' });
  return ctx;
}

// わざと訳を1つ消す（build.js が「テストが効いているか」を確かめるため）
function dropOneTranslation(html) {
  const key = "  'サブスクリプションは年ごとに自動更新されます。解約はいつでも Google Play の「お支払いと定期購入」から行えます。':{";
  const i = html.indexOf(key);
  if (i < 0) throw new Error('mutate=tr の置き換え先が見つかりません');
  const end = html.indexOf('},\n', i);
  return html.slice(0, i) + html.slice(end + 3);
}

const KINDS = ['unknown', 'yes', 'none', 'auto'];

function run(src, opts) {
  opts = opts || {};
  const say = opts.silent ? () => {} : (m) => console.log(m);
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; if (!opts.quiet) say('  ok   ' + m); } else { fail++; say('  FAIL ' + m); } };

  let html = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (opts.mutate === 'tr') html = dropOneTranslation(html);

  let ios, and;
  try {
    ios = load(html, false, opts.mutate);
    and = load(html, true, opts.mutate);
  } catch (e) { say('  FAIL 読み込み: ' + e.message); return false; }

  // ---- (1) Android では Google Play の案内。iPhone と書かない ----
  KINDS.forEach((k) => {
    const a = and.payTermsText(k);
    ok(a.indexOf('Google Play') >= 0, 'Android/' + k + ': Google Play の案内が出る');
    ok(a.indexOf('iPhone') < 0, 'Android/' + k + ': iPhone と書かない');
    ok(a.indexOf('解約') >= 0, 'Android/' + k + ': 解約のしかたを書く');
  });
  ok(and.priceUnknownText().indexOf('Google Play') >= 0, 'Android: 価格が取れないときも Google Play');
  ok(and.priceUnknownText().indexOf('App Store') < 0, 'Android: App Store と書かない');

  // ---- (2) iPhone 側はこれまでどおり ----
  KINDS.forEach((k) => {
    const i = ios.payTermsText(k);
    ok(i.indexOf('iPhone') >= 0, 'iPhone/' + k + ': これまでどおり iPhone の案内');
    ok(i.indexOf('Google Play') < 0, 'iPhone/' + k + ': Google Play と書かない');
  });
  ok(ios.priceUnknownText().indexOf('App Store') >= 0, 'iPhone: 価格が取れないときは App Store');

  // ---- (3) 4つの種類がそれぞれ別の文であること（取り違えの検出）----
  const set = new Set(KINDS.map((k) => and.payTermsText(k)));
  ok(set.size === KINDS.length, '4つの場面でそれぞれ別の文が出る（' + set.size + '/4）');

  // ---- (4) 新しい日本語の文に英・仏・葡の訳が全部あること ----
  //      ここが抜けると、その言語の利用者に日本語のまま出る
  const needTr = KINDS.map((k) => and.payTermsText(k)).concat([and.priceUnknownText()]);
  needTr.forEach((ja) => {
    const e = entryFor(html, ja);
    const head = ja.slice(0, 14) + '…';
    ok(!!e, '訳がある: ' + head);
    if (e) ['en', 'fr', 'pt'].forEach((L) => {
      const m = new RegExp(L + ":'([^']+)'").exec(e);
      ok(!!m && !/[ぁ-んァ-ン一-龥]/.test(m[1]),
        '  ' + L + ' の訳が日本語のままでない: ' + head);
    });
  });

  // ---- (5) 呼び出し側が関数を通っているか（直書きが残っていないか）----
  ok(!/T\('[^']*iPhoneの「設定/.test(html), '解約の案内を T() に直書きしている箇所が残っていない');
  ok(html.indexOf('id="paywallTerms"') >= 0, '選手の購読画面に書き換え先の id がある');
  ok(/function applyPlatformWording[\s\S]{0,800}payTermsText\('auto'\)/.test(html),
    '画面を開いたときに選手側を書き換える');
  ok(/function applyPlatformWording[\s\S]{0,800}payTermsText\('unknown'\)/.test(html),
    '画面を開いたときに事務側を書き換える');

  // ---- (6) アプリ内の規約・プライバシーがストア両方に触れている ----
  ok(html.indexOf('Android では Google Play ストアの「お支払いと定期購入」') >= 0,
    'アプリ内の規約に Android の解約先が書いてある');
  ok(!/購入・課金・更新は Apple（App Store）を通じて/.test(html),
    '規約の「Apple だけ」という書き方が残っていない');
  ok(!/課金・サブスクリプションは Apple（App Store）を通じて/.test(html),
    'プライバシーの「Apple だけ」という書き方が残っていない');

  say('  pay-wording: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['store', 'tr'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
