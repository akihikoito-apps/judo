/* 大会のお知らせの帯（v312）。
   いちばん知りたい「あと何日」を白い札に抜き出して大きくした。そのぶん、文が
   丸ごと1つではなくなったので、文を1つで訳す走査（PATTERNS）が使えなくなっている。
   訳は cdTexts() が言語ごとに組み立てる。ここが抜けると、英語・フランス語・
   ポルトガル語の利用者に日本語のまま出てしまう（前はパターンで訳せていた）。

   語順そのものが言語で違うのが要点：
     日本語  〇〇まで ／ あと 9日
     英語    〇〇     ／ in  9 days
     フランス語 〇〇   ／      J-9      （「あと」に当たる語を置かない）

   並びも見る。事務アプリの帯は v312 でカレンダーの下へ移した（選手アプリと同じ）。
   上に何本も積むと、操作するところが押し下げられて見づらくなるため。

   使い方： node tests/countdown.test.js
           node tests/countdown.test.js --mutate=lang  … フランス語の組み立てを潰す（失敗が正しい）
           node tests/countdown.test.js --mutate=order … 帯をカレンダーの上に戻す（失敗が正しい）
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

function load(html, lang, mutate) {
  let code = ['cdTexts', 'cdHtml'].map((n) => extractFn(html, n)).join('\n');

  // わざと壊す（build.js がこれで「テストが効いているか」を確かめる）
  if (mutate === 'lang') {
    if (code.indexOf("big:'J-'+days") < 0) throw new Error('mutate=lang の置き換え先が見つかりません');
    code = code.replace("big:'J-'+days", "big:days+'日'");
  }

  // tr は「予定名を訳す」だけの役。ここでは素通しで足りる（名前は道場が自由に付ける）
  const ctx = { LANG: lang, tr: (s) => s, esc: (s) => String(s), console: { log() {} } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'countdown' });
  return ctx;
}

function run(src, opts) {
  opts = opts || {};
  const say = opts.silent ? () => {} : (m) => console.log(m);
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; if (!opts.quiet) say('  ok   ' + m); } else { fail++; say('  FAIL ' + m); } };

  const html = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // ---- (1) 4言語とも、日数が数字として必ず出る（色だけに頼らない）----
  const want = {
    ja: { lead: '市民大会まで', pre: 'あと', big: '9日' },
    en: { lead: '市民大会', pre: 'in', big: '9 days' },
    fr: { lead: '市民大会', pre: '', big: 'J-9' },
    pt: { lead: '市民大会', pre: 'em', big: '9 dias' },
  };
  Object.keys(want).forEach((L) => {
    let t;
    try { t = load(html, L, opts.mutate).cdTexts('市民大会', 9); }
    catch (e) { fail++; say('  FAIL ' + L + ': ' + e.message); return; }
    const w = want[L];
    ok(t.lead === w.lead, L + ': 左の文は「' + w.lead + '」（' + t.lead + '）');
    ok(t.pre === w.pre, L + ': 札の小さい字は「' + (w.pre || '無し') + '」（' + (t.pre || '無し') + '）');
    ok(t.big === w.big, L + ': 札の大きい字は「' + w.big + '」（' + t.big + '）');
    ok(/9/.test(t.big), L + ': 日数が数字で読める');
    ok(t.today === false, L + ': きょう扱いにしない');
  });

  // ---- (2) 1日は単数形（英語・ポルトガル語で days/dias のままにしない）----
  ok(load(html, 'en', opts.mutate).cdTexts('X', 1).big === '1 day', 'en: あと1日は day（複数形にしない）');
  ok(load(html, 'pt', opts.mutate).cdTexts('X', 1).big === '1 dia', 'pt: あと1日は dia（複数形にしない）');
  ok(load(html, 'ja', opts.mutate).cdTexts('X', 1).big === '1日', 'ja: あと1日');

  // ---- (3) 当日は日数ではなく「きょう」。4言語とも日本語のまま出さない ----
  ['ja', 'en', 'fr', 'pt'].forEach((L) => {
    const t = load(html, L, opts.mutate).cdTexts('市民大会', 0);
    ok(t.today === true, L + ': 当日は today 扱い');
    ok(!/\d/.test(t.big), L + ': 当日に日数を出さない（' + t.big + '）');
    if (L !== 'ja') ok(!/きょう/.test(t.big), L + ': 当日の字が日本語のままでない（' + t.big + '）');
  });
  ok(load(html, 'ja', opts.mutate).cdTexts('市民大会', 0).lead === '市民大会は', 'ja: 当日は「〇〇は」');

  // ---- (4) 組み立てた帯の形 ----
  const h = load(html, 'ja', opts.mutate).cdHtml('#c0392b', '市民大会', 9, '2026-11-19', 'ofOpenDay');
  ok(h.indexOf('class="gw-cd"') >= 0, '帯のクラスは gw-cd のまま（他の指定が効く）');
  ok(h.indexOf('ofOpenDay(\'2026-11-19\')') >= 0, '押すとその日が開く');
  ok(h.indexOf('<use href="#cdMark"/>') >= 0, '左の印を使う');
  ok(h.indexOf('class="cd-day"') >= 0 && h.indexOf('class="cd-n"') >= 0, '日数の札がある');
  ok(h.indexOf('style="color:#c0392b"') >= 0, '札の字は予定の色（白地に白を出さない）');
  const ht = load(html, 'ja', opts.mutate).cdHtml('#c0392b', '市民大会', 0, '2026-11-19', 'gwOpenDay');
  ok(ht.indexOf('cd-day cd-today') >= 0, '当日は札を小さめの字にする目印が付く');
  ok(ht.indexOf('cd-pre') < 0, '当日は「あと」を出さない');

  // ---- (5) 事務の帯はカレンダーの下（選手と同じ並び）----
  let page = html;
  if (opts.mutate === 'order') {
    const cd = '  <div id="schedCountdown"></div>\n';
    if (page.indexOf(cd) < 0) throw new Error('mutate=order の置き換え先が見つかりません');
    page = page.replace(cd, '').replace('  <div class="gw-cal" id="schedCalWrap"', cd + '  <div class="gw-cal" id="schedCalWrap"');
  }
  const iCal = page.indexOf('id="schedCalWrap"');
  const iCd = page.indexOf('id="schedCountdown"');
  ok(iCal >= 0 && iCd >= 0, '事務の予定画面にカレンダーとお知らせがある');
  ok(iCd > iCal, '事務のお知らせはカレンダーの下にある（選手と同じ並び）');
  const iGwCal = page.indexOf('id="gwGrid"');
  const iGwCd = page.indexOf('id="gwCountdown"');
  ok(iGwCd > iGwCal, '選手のお知らせもカレンダーの下のまま');

  // ---- (6) 効かなくなった訳が残っていないか ----
  ok(html.indexOf('まで あと${days}日！！') < 0, '文を丸ごと作る古い書き方が残っていない');
  ok(html.indexOf('days until ') < 0, '当たらなくなった PATTERNS が残っていない');

  // ---- (7) 言語を切り替えたら描き直す（走査では追従できないため）----
  ok(/function setLang[\s\S]{0,600}renderSchedCountdown\(\)/.test(html), '言語切替で事務の帯を描き直す');
  ok(/function setLang[\s\S]{0,600}renderGwCountdown\(\)/.test(html), '言語切替で選手の帯を描き直す');

  say('  countdown: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['lang', 'order'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
