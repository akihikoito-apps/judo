/* 予定表の「差分モード」（v295）の回帰テスト
   見出しの 月｜YYYY-MM を 月｜YYYY-MM-DD にすると、その分だけを直し、ほかの日は消さない。
   index.html から schedShareParse・schedMatchPlan・schedShareApply・schedSharePatchText を
   取り出して node で動かす。画面には触らない。

   使い方： node tests/sched-patch.test.js              … 全件 ok なら終了コード0
           node tests/sched-patch.test.js --mutate=keep … 「差分では消さない」をわざと外す（失敗するのが正しい）
           node tests/sched-patch.test.js --mutate=ym   … 差分の見分けをわざと壊す（失敗するのが正しい）
   build.js の最後からも run() が呼ばれる。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 「function 名前(」から対応する } までを取り出す
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

const MONTH = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-11', '件数｜3', '--- 予定 ---',
  '04｜稽古｜｜19:00｜錬誠館｜｜｜k1',
  '08｜大会｜県中学生柔道選手権大会｜09:00｜県立武道館 第1会場｜集合8時｜｜m1',
  '18｜稽古｜｜19:00｜錬誠館｜｜｜k2'].join('\n');
const PATCH = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-11-08', '件数｜1', '--- 予定 ---',
  '08｜大会｜県中学生柔道選手権大会｜10:30｜県立武道館 第2会場｜集合9時30分に変更｜｜m1'].join('\n');
const ADD = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-11-25', '件数｜1', '--- 予定 ---',
  '25｜稽古｜｜18:30｜市民体育館｜臨時｜｜k9'].join('\n');

function run(src, opts) {
  opts = opts || {};
  src = src || fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  let code = ['schedShareParse', 'schedMatchPlan', 'schedShareApply', 'schedSharePatchText']
    .map(n => extractFn(src, n)).join('\n');

  // わざと壊して、テストが効いているかを確かめる。
  // 置換が空振りすると「壊していないのに通った」ことになるので、必ず当たったか確かめる。
  const bust = (from, to) => {
    const after = code.replace(from, to);
    if (after === code) throw new Error('わざと壊す置換が当たりませんでした: ' + from);
    code = after;
  };
  if (opts.mutate === 'keep') bust('if(parsed.patch)plan.del.length=0;', '');
  if (opts.mutate === 'ym') bust('if(md){ym=md[1];patchDay=md[2];}else{ym=v;}', 'ym=v;');

  const sandbox = {
    DB: null,
    T: x => x,
    todayStr: () => '2026-10-27',
    save: () => true,
    shareField: v => String(v == null ? '' : v).replace(/[｜\n]/g, ' '),
    shareBytes: s => Buffer.byteLength(String(s), 'utf8'),
    schedShareMembers: () => '',
    bakeSchedMeta: () => { },
    schedSrcMapPrune: () => { },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  let pass = 0, fail = 0;
  const say = m => { if (!opts.quiet) console.log(m); };
  const ok = (c, m) => {
    if (c) { pass++; say('  ok   ' + m); }
    else { fail++; if (!opts.silent) console.log('  NG   ' + m); }
  };
  const fresh = () => {
    sandbox.DB = { schedule: [], schedSrc: {}, schedSrcMap: {}, matchResults: {}, team: '錬誠館' };
    const n = sandbox.schedShareApply(sandbox.schedShareParse(MONTH), '');
    if (n !== 3) throw new Error('下ごしらえに失敗（戻り値 ' + n + '）');
  };

  // 1. いつもの予定表はこれまでどおり
  fresh();
  ok(sandbox.DB.schedule.length === 3, '月まるごとの取り込みで3件そろう');

  // 2. 差分を入れても、ほかの日が消えない（いちばん大事）
  const p = sandbox.schedShareParse(PATCH);
  ok(p.patch === true, '月｜2026-11-08 を差分として読む');
  ok(sandbox.schedShareApply(p, '') === 1, '差分を1件取り込む');
  ok(sandbox.DB.schedule.length === 3, 'ほかの日が消えない（3件のまま）');
  const m1 = sandbox.DB.schedule.find(x => x.srcId === 'm1');
  ok(!!m1 && m1.time === '10:30', '時刻が直る');
  ok(!!m1 && m1.place === '県立武道館 第2会場', '場所が直る');
  ok(!!m1 && /9時30分/.test(m1.note || ''), 'メモが直る');
  ok(sandbox.DB.schedule.filter(x => x.srcId === 'm1').length === 1, '同じ予定が二重に増えない');
  ok(!!sandbox.DB.schedule.find(x => x.srcId === 'k1'), 'ほかの日の中身もそのまま');

  // 3. 差分で新しい予定を足せる
  fresh();
  ok(sandbox.schedShareApply(sandbox.schedShareParse(ADD), '') === 1, '差分で予定を足せる');
  ok(sandbox.DB.schedule.length === 4, '4件に増える');

  // 4. 月まるごとは、これまでどおり「載っていない日」を消す
  fresh();
  const SHRUNK = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-11', '件数｜1', '--- 予定 ---',
    '08｜大会｜県中学生柔道選手権大会｜09:00｜県立武道館 第1会場｜集合8時｜｜m1'].join('\n');
  sandbox.schedShareApply(sandbox.schedShareParse(SHRUNK), '');
  ok(sandbox.DB.schedule.length === 1, '月まるごとなら、載っていない日は消える（差分と区別できている）');

  // 4b. いちど直した予定を、あとからもう一度直す（二重に増えないか）
  fresh();
  sandbox.schedShareApply(sandbox.schedShareParse(PATCH), '');
  const AGAIN = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-11-08', '件数｜1', '--- 予定 ---',
    '08｜大会｜県中学生柔道選手権大会｜13:00｜市民体育館｜集合12時に再変更｜｜m1'].join('\n');
  sandbox.schedShareApply(sandbox.schedShareParse(AGAIN), '');
  ok(sandbox.DB.schedule.length === 3, '二度目の差分でも件数が増えない（3件）');
  const twice = sandbox.DB.schedule.filter(x => x.srcId === 'm1');
  ok(twice.length === 1, '同じ予定が二重にならない');
  ok(twice.length === 1 && twice[0].time === '13:00' && twice[0].place === '市民体育館', '二度目の中身で上書きされる');

  // 4c. 日付そのものが動く（同じ月の中で）
  fresh();
  const MOVE = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-11-15', '件数｜1', '--- 予定 ---',
    '15｜大会｜県中学生柔道選手権大会｜09:00｜県立武道館 第1会場｜日程変更｜｜m1'].join('\n');
  sandbox.schedShareApply(sandbox.schedShareParse(MOVE), '');
  ok(sandbox.DB.schedule.length === 3, '日付が動いても件数は増えない');
  const moved = sandbox.DB.schedule.filter(x => x.srcId === 'm1');
  ok(moved.length === 1 && moved[0].date === '2026-11-15', '予定が11/8から11/15へ動く');

  // 4d. 別の月へ動く
  fresh();
  const MOVE2 = ['【My柔道 予定表】', '送り主｜錬誠館', '月｜2026-12-05', '件数｜1', '--- 予定 ---',
    '05｜大会｜県中学生柔道選手権大会｜09:00｜県立武道館 第1会場｜12月へ延期｜｜m1'].join('\n');
  sandbox.schedShareApply(sandbox.schedShareParse(MOVE2), '');
  const moved2 = sandbox.DB.schedule.filter(x => x.srcId === 'm1');
  ok(moved2.length === 1 && moved2[0].date === '2026-12-05', '月をまたいで動かしても二重にならない');
  ok(sandbox.DB.schedule.length === 3, '11月の稽古はそのまま残る');

  // 5. 古いアプリ（v294まで）に差分が届いても何も消さない
  ok(/^\d{4}-\d{2}$/.test('2026-11') === true, '古いアプリは 2026-11 を受け付ける');
  ok(/^\d{4}-\d{2}$/.test('2026-11-08') === false, '古いアプリは 2026-11-08 を受け付けない（何も消えない）');

  // 6. 送る側が作る文
  fresh();
  const sid = sandbox.DB.schedule.find(x => x.srcId === 'm1').id;
  const t = sandbox.schedSharePatchText(sid);
  ok(!!t && /^月｜2026-11-08$/m.test(t.text), '事務用が差分の文を作れる');
  ok(!!t && t.text.split('\n').length === 6, '6行で収まる');
  ok(!!t && sandbox.schedShareParse(t.text).patch === true, '作った文を読み戻すと差分と分かる');
  ok(sandbox.schedSharePatchText('ないid') === null, '無い予定を指すと null');

  say('  sched-patch: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['keep', 'ym'] };

if (require.main === module) {
  const m = (process.argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
