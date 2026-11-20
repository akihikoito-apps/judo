/* v326: プライバシーポリシーの「版ごとの出し分け」の見張り。

   なぜ要るのか：
     1つの index.html から 事務用（office）と 選手用（personal）を作っている。
     ところが、ポリシーには事務用にしか無い機能の説明が入っている。
       ・予定表をLINEで送る機能（LIFF）……呼び出し口は予定タブの「予定を共有」だけ。
         予定タブは PERSONAL_HIDDEN に入っているので、選手用からはたどり着けない。
       ・起動時のパスコードロック……lockRequired() は personal のとき必ず false。
     これをそのまま選手用に載せると、「このアプリがやらないこと」を書いたポリシーになる。
     社長から 2026-11-21 に指摘を受けた（選手用で予定表をLINEへ送ることはない）。

   ここで見張る「壊れたら気づけないこと」：
     (1) <!--ED:OFFICE--> … <!--/ED:OFFICE--> の囲みが合っていること。
     (2) 選手用に、事務用だけの説明が残らないこと。
     (3) 事務用からは消えていないこと（消しすぎの逆向きの事故）。
     (4) 両方に要る説明（共有・書き出し、リンクを開いたとき、合言葉）は残ること。
     (5) 前提そのもの——選手用から予定を共有する道が無いこと。
         ここが変わったら、ポリシーの出し分けを見直さないといけない。

   使い方： node tests/policy-edition.test.js
           node tests/policy-edition.test.js --mutate=nostrip     … 囲みを消す（失敗するのが正しい）
           node tests/policy-edition.test.js --mutate=unbalanced  … 閉じを1つ消す（失敗するのが正しい）
           node tests/policy-edition.test.js --mutate=sched       … 選手用でも予定タブを出す（失敗するのが正しい）
*/
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const OPEN = '<!--ED:OFFICE-->', CLOSE = '<!--/ED:OFFICE-->';

/* build.js と同じ規則。片方だけ直す事故を防ぐため、ここでも同じ形で書く。 */
function strip(src, edition) {
  return (edition === 'personal')
    ? src.replace(/<!--ED:OFFICE-->[\s\S]*?<!--\/ED:OFFICE-->/g, '')
    : src.split(OPEN).join('').split(CLOSE).join('');
}

/* 事務用だけの説明。選手用に残っていてはいけない。 */
const OFFICE_ONLY = [
  '3-2. 予定表をLINEで送る機能',
  '仕組み（LIFF）を通じてメッセージが送られます',
  'チャネルID',
  '広告の最適化を含む目的での利用',
  'パスコードロック機能を提供します',
];

/* どちらの版にも要る説明。 */
const BOTH = [
  'サブスクリプション管理（RevenueCat, Inc.／米国）',
  '共有・書き出し',
  '予定表のリンクを開いたとき',
  '予定表の合言葉',
  'iCloud バックアップ',
];

function run(src, opts) {
  opts = opts || {};
  const say = (m) => { if (!opts.quiet) console.log(m); };
  let pass = 0, fail = 0;
  const ok = (cond, label) => {
    if (cond) { pass++; } else { fail++; if (!opts.silent) console.error('  NG: ' + label); }
  };

  let index = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  if (opts.mutate === 'nostrip') index = index.split(OPEN).join('').split(CLOSE).join('');
  if (opts.mutate === 'unbalanced') index = index.replace(CLOSE, '');
  if (opts.mutate === 'sched') index = index.replace("['att','money','list','sched']", "['att','money','list']");

  /* (1) 囲みが合っている ------------------------------------------------- */
  const nOpen = index.split(OPEN).length - 1, nClose = index.split(CLOSE).length - 1;
  ok(nOpen >= 4 && nOpen === nClose, '事務用だけの囲みが4組以上あり、開きと閉じの数が合っている');

  const forPlayer = strip(index, 'personal');
  const forOffice = strip(index, 'office');

  ok(forPlayer.indexOf('ED:OFFICE') < 0 && forOffice.indexOf('ED:OFFICE') < 0,
     '生成後に印が残らない');

  /* (2)(3) 出し分けができている ----------------------------------------- */
  OFFICE_ONLY.forEach((w) => {
    ok(forPlayer.indexOf(w) < 0, '選手用に残っていない：' + w);
    ok(forOffice.indexOf(w) >= 0, '事務用には残っている：' + w);
  });

  /* (4) 共通の説明は消していない ---------------------------------------- */
  BOTH.forEach((w) => {
    ok(forPlayer.indexOf(w) >= 0, '選手用にも残っている：' + w);
    ok(forOffice.indexOf(w) >= 0, '事務用にも残っている：' + w);
  });

  /* 記号（ア）（イ）…に戻っていないこと。版で項目が1つ減るため番号が飛ぶ。 */
  ok(index.indexOf('（イ）予定表をLINEで送る機能') < 0,
     '第4章の経路一覧は記号ではなく中黒で並べている');

  /* (5) 前提：選手用から予定を共有する道が無い -------------------------- */
  ok(/const PERSONAL_HIDDEN=\[[^\]]*'sched'[^\]]*\]/.test(index),
     '個人モードでは予定タブを隠している（PERSONAL_HIDDEN に sched）');
  ok(index.split('onclick="openSchedShare()"').length - 1 === 1,
     '予定を共有する入口は1か所だけ');
  const navIdx = index.indexOf('onclick="openSchedShare()"');
  const schedIdx = index.indexOf('<section id="screen-sched"');
  ok(schedIdx >= 0 && navIdx > schedIdx && navIdx - schedIdx < 2000,
     'その入口は予定タブ（screen-sched）の中にある');
  ok(index.indexOf('function liffShareReady()') >= 0 &&
     index.split('LIFF_SHARE_ID').length - 1 <= 6,
     'LIFF を使うのは予定表を送る道だけ');

  /* 前提：選手用でパスコードロックは働かない --------------------------- */
  ok(index.indexOf("return mode!=='personal';") >= 0,
     'lockRequired() は個人モードで false（選手用ではロックしない）');

  /* 生成済みファイルも実際にそうなっているか（build.js が規則を無視していないか） */
  const gen = [['personal.html', forPlayer], ['office.html', forOffice]];
  gen.forEach(([f, expected]) => {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) return;   // まだ生成していないときは見ない
    const g = fs.readFileSync(p, 'utf8');
    ok(g.indexOf('ED:OFFICE') < 0, f + ' に印が残っていない');
    OFFICE_ONLY.forEach((w) => {
      ok((g.indexOf(w) >= 0) === (expected.indexOf(w) >= 0),
         f + ' の出し分けが規則どおり：' + w);
    });
  });

  say('  policy-edition: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['nostrip', 'unbalanced', 'sched'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
