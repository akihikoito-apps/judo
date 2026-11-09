/* デモ表示（購入前にお試しで中身を見せるモード）のデータが、アプリ本体の決まりと
   食い違っていないかを見る。2026-11-09 に moto g06 の実機確認で見つかった2件が元。

   見つかった食い違い（どちらもデモのデータ側の間違い。実データでは起きない）：
   (1) 月謝額を s.fee に入れていたが、アプリが読むのは s.feeAmount。
       そのため「未納」の表示額（登録額＝3,000円）と「支払済」の表示額（記録額＝2,000円）が
       食い違い、受領ボタンを押すたびに金額が 2,000⇄3,000 と入れ替わって見えた。
   (2) 段位を "3級"（英数字）にしていたが、既定の選択肢は "三級"（漢数字）。
       renderRankPick は知らない値を消さずに余分なボタンとして足す作りなので、
       「よく使う設定に入れていないのに 3級 が出る」状態になった。

   使い方： node tests/demo-data.test.js
           node tests/demo-data.test.js --mutate=fee   … (1) をわざと元に戻す（失敗するのが正しい）
           node tests/demo-data.test.js --mutate=rank  … (2) をわざと元に戻す（失敗するのが正しい）
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

const FNS = ['todayStr', 'demoSampleDB', 'studentFee', 'ranksAll'];

function load(html, mutate) {
  let code = FNS.map((n) => extractFn(html, n)).join('\n');

  // わざと壊す（build.js がこれで「テストが効いているか」を確かめる）
  if (mutate === 'fee') {
    if (code.indexOf('feeAmount:(c[0]') < 0) throw new Error('mutate=fee の置き換え先が見つかりません');
    code = code.replace('feeAmount:(c[0]', 'fee:(c[0]').replace('fees[ym][s.id]=s.feeAmount', 'fees[ym][s.id]=s.fee');
  }
  if (mutate === 'rank') {
    if (code.indexOf('"三級"') < 0) throw new Error('mutate=rank の置き換え先が見つかりません');
    code = code.replace('"三級"', '"3級"');
  }

  // DB は studentFee（全体の月謝額）と ranksAll（段位の既定）が見るだけ。
  // ranks を置かないことで、既定の選択肢が返るようにしている。
  const ctx = { DB: { feeAmount: 3000 }, console: { log() {} } };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'demo-data' });
  return ctx;
}

function run(src, opts) {
  opts = opts || {};
  const say = opts.silent ? () => {} : (m) => console.log(m);
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; if (!opts.quiet) say('  ok   ' + m); } else { fail++; say('  FAIL ' + m); } };

  const html = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let ctx;
  try { ctx = load(html, opts.mutate); }
  catch (e) { say('  FAIL 読み込み: ' + e.message); return false; }

  const db = ctx.demoSampleDB();
  const ym = ctx.todayStr().slice(0, 7);
  const ranks = ctx.ranksAll();

  ok(Array.isArray(db.students) && db.students.length === 16, '仲間が16人いる');

  // (1) 月謝：記録額と登録額が一致していないと、受領ボタンを押すたびに金額が入れ替わって見える
  let noAmount = 0, legacy = 0;
  db.students.forEach((s) => {
    if (!(s.feeAmount > 0)) noAmount++;
    if (s.fee !== undefined) legacy++;
  });
  ok(noAmount === 0, 'どの仲間にも feeAmount が入っている（入れ忘れ ' + noAmount + '人）');
  ok(legacy === 0, '古い名前の fee を持っていない（' + legacy + '人）');

  const paid = (db.fees && db.fees[ym]) || {};
  const sids = Object.keys(paid);
  ok(sids.length > 0, '今月の支払い記録がある');
  let mismatch = 0;
  sids.forEach((sid) => {
    const s = db.students.find((x) => x.id === sid);
    if (!s || paid[sid] !== ctx.studentFee(s)) mismatch++;
  });
  ok(mismatch === 0, '支払済の記録額が登録額と一致する＝押しても金額が動かない（食い違い ' + mismatch + '件）');

  // (2) 段位：既定の選択肢に無い値だと、余分なボタンが勝手に増えて見える
  const unknown = [];
  db.students.forEach((s) => { if (s.rank && ranks.indexOf(s.rank) < 0 && unknown.indexOf(s.rank) < 0) unknown.push(s.rank); });
  ok(unknown.length === 0, '段位がすべて既定の選択肢にある（知らない値: ' + (unknown.join('・') || 'なし') + '）');

  say('  demo-data: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['fee', 'rank'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
