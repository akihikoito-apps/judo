/* 学年の自動計算（点検 D-1・v276）の回帰テスト
   index.html から entryFYFromBirth・fixGradeEntryFY・refreshGrades などを取り出し、node の vm で動かす。
   使い方： node tests/grade-entry.test.js            … 全件 ok なら終了コード0、1件でも NG なら1
           node tests/grade-entry.test.js --mutate=entry … 入学年度の式をわざと1年ずらす（失敗するのが正しい）
           node tests/grade-entry.test.js --mutate=fix   … 移行で直す年数をわざと1年ずらす（失敗するのが正しい）
   build.js の最後からも run() が呼ばれる（本部のテストコマンド「node build.js」で一緒に走る）。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 「function 名前(」から対応する } までを取り出す（中括弧の数だけを数える。対象の関数は文字列・正規表現に中括弧の偏りがない）
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
function extractConst(src, name) {
  const head = '\nconst ' + name + '=';
  const i = src.indexOf(head);
  if (i < 0) throw new Error('index.html に const ' + name + ' が見つかりません');
  const end = src.indexOf('];', i);
  return src.slice(i + 1, end + 2).replace(/^const /, 'var ');
}

const FNS = ['cats', 'catNames', 'catObj', 'gradeStart', 'schoolFY', 'todayStr', 'gradeChain', 'gradeLabelFor',
  'levelToInfo', 'currentFY', 'entryFYFromBirth', 'fixGradeEntryFY', 'gradeInfo', 'refreshGrades'];

function loadCode(html, mutate) {
  let code = extractConst(html, 'DEFAULT_CATEGORIES') + '\n' + FNS.map(n => extractFn(html, n)).join('\n');
  if (mutate === 'entry') {
    if (code.indexOf('afterApr2?y+7:y+6') < 0) throw new Error('mutate=entry の置き換え先が見つかりません');
    code = code.replace('afterApr2?y+7:y+6', 'afterApr2?y+8:y+7');
  } else if (mutate === 'fix') {
    if (code.indexOf('const efy=oldEfy+1;') < 0) throw new Error('mutate=fix の置き換え先が見つかりません');
    code = code.replace('const efy=oldEfy+1;', 'const efy=oldEfy+2;');
  }
  return code;
}

// 今日の日付を決めた環境を作る（new Date() だけ差し替える）
function makeEnv(code, today, db) {
  const RealDate = Date;
  const fixed = new RealDate(today + 'T12:00:00').getTime();
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fixed); } static now() { return fixed; } }
  const ctx = { Date: FakeDate, DB: db, console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx;
}
const clone = o => JSON.parse(JSON.stringify(o));

function run(html, opts) {
  opts = opts || {};
  const log = opts.quiet ? () => {} : (s => console.log(s));
  const code = loadCode(html, opts.mutate);
  let ok = 0, ng = 0;
  const t = (name, fn) => {
    try { fn(); ok++; log('ok   ' + name); }
    catch (e) { ng++; log('NG   ' + name + ' … ' + e.message); }
  };
  const eq = (a, b, what) => {
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb) throw new Error((what || '') + ' 期待 ' + sb + ' / 実際 ' + sa);
  };

  // ---- 1. 入学年度の式（日本の学齢：4/1 生まれまでは早生まれ）----
  {
    const E = makeEnv(code, '2026-10-09', { gradeEnabled: true, students: [] });
    t('4/1 生まれ（2019-04-01）は 2025 年度に小1', () => eq(E.entryFYFromBirth('2019-04-01'), 2025));
    t('4/2 生まれ（2019-04-02）は 2026 年度に小1', () => eq(E.entryFYFromBirth('2019-04-02'), 2026));
    t('12/31 生まれ（2019-12-31）は 2026 年度に小1', () => eq(E.entryFYFromBirth('2019-12-31'), 2026));
    t('1/1 生まれ（2020-01-01）は 2026 年度に小1', () => eq(E.entryFYFromBirth('2020-01-01'), 2026));
    t('3/31 生まれ（2020-03-31）は 2026 年度に小1', () => eq(E.entryFYFromBirth('2020-03-31'), 2026));
    t('旧い式（oldRule）はちょうど1年早い', () => {
      ['2019-04-01', '2019-04-02', '2019-12-31', '2020-01-01'].forEach(b => eq(E.entryFYFromBirth(b, true), E.entryFYFromBirth(b) - 1, b));
    });
    t('生年月日なしは null', () => { eq(E.entryFYFromBirth(''), null); eq(E.entryFYFromBirth(null), null); });
  }

  // ---- 2. 未就学の人が自動で小1になる（進級月4月）----
  {
    const db = { gradeEnabled: true, students: [
      { id: 'a', name: '4/1生', category: '未就学', birth: '2019-04-01' },
      { id: 'b', name: '4/2生', category: '未就学', birth: '2019-04-02' },
      { id: 'c', name: '12/31生', category: '未就学', birth: '2019-12-31' },
      { id: 'd', name: '1/1生', category: '未就学', birth: '2020-01-01' },
      { id: 'e', name: '翌年4/2生', category: '未就学', birth: '2020-04-02' },
    ] };
    const E = makeEnv(code, '2026-10-09', db);
    E.refreshGrades();
    const g = id => { const s = db.students.find(x => x.id === id); return s.category + '/' + (s.grade || ''); };
    t('2026年10月：4/1 生まれ（2019）は小2', () => eq(g('a'), '小学生/小2'));
    t('2026年10月：4/2 生まれ（2019）は小1', () => eq(g('b'), '小学生/小1'));
    t('2026年10月：12/31 生まれ（2019）は小1', () => eq(g('c'), '小学生/小1'));
    t('2026年10月：1/1 生まれ（2020）は小1', () => eq(g('d'), '小学生/小1'));
    t('2026年10月：4/2 生まれ（2020）はまだ未就学', () => eq(g('e'), '未就学/'));
  }
  {
    // 年度の切り替わり：3/31 まではまだ未就学、4/1 に小1
    const mk = () => ({ gradeEnabled: true, students: [{ id: 'b', name: '4/2生', category: '未就学', birth: '2019-04-02' }] });
    const d1 = mk(); makeEnv(code, '2026-03-31', d1).refreshGrades();
    const d2 = mk(); makeEnv(code, '2026-04-01', d2).refreshGrades();
    t('4/2 生まれ（2019）は 2026-03-31 では未就学', () => eq(d1.students[0].category, '未就学'));
    t('4/2 生まれ（2019）は 2026-04-01 に小1', () => eq(d2.students[0].category + d2.students[0].grade, '小学生小1'));
  }

  // ---- 3. 進級月が4月以外 ----
  {
    const db = { gradeEnabled: true, gradeStartMonth: 9, students: [
      { id: 'p', name: '未就学', category: '未就学', birth: '2019-06-01' },
      { id: 'q', name: '手で小1', category: '小学生', grade: '小1', birth: '2019-06-01', gradeBaseFY: 2025, gradeBaseLevel: 1, gradeTouchedFY: 2025 },
    ] };
    const before = clone(db);
    const E1 = makeEnv(code, '2026-08-31', db);
    t('進級月9月：8/31 の年度は前の年（2025）', () => eq(E1.schoolFY(), 2025));
    E1.fixGradeEntryFY();
    t('進級月9月：移行は何もせず印も付けない', () => { eq(db.gradeEntryFix, undefined); eq(db.gradeEntryFixBackup, undefined); eq(db.students, before.students); });
    E1.refreshGrades();
    t('進級月9月：未就学の人は生年月日から自動で小1にしない', () => eq([db.students[0].category, db.students[0].gradeBaseFY], ['未就学', undefined]));
    t('進級月9月：8/31 はまだ小1のまま', () => eq(db.students[1].grade, '小1'));
    const E2 = makeEnv(code, '2026-09-01', db);
    t('進級月9月：9/1 から年度が 2026', () => eq(E2.schoolFY(), 2026));
    E2.refreshGrades();
    t('進級月9月：9/1 に小2へ進級', () => eq(db.students[1].grade, '小2'));
  }

  // ---- 4. v275 以前のデータの移行（fixGradeEntryFY）----
  const v275 = () => ({ gradeEnabled: true, students: [
    // 旧い式で自動的に小1にされた人（2019-06-10 生 → 旧 2025・正 2026）
    { id: 's1', name: '自動', category: '小学生', grade: '小2', birth: '2019-06-10', gradeBaseFY: 2025, gradeBaseLevel: 1 },
    // 旧い式では今年度小1、正しくはまだ未就学（2020-06-10 生 → 旧 2026・正 2027）
    { id: 's2', name: '早すぎ', category: '小学生', grade: '小1', birth: '2020-06-10', gradeBaseFY: 2026, gradeBaseLevel: 1 },
    // 未就学のときに手で触った（gradeTouchedFY < gradeBaseFY）あとで自動で小1になった人は直す
    { id: 's3', name: '未就学で保存', category: '小学生', grade: '小2', birth: '2019-06-10', gradeBaseFY: 2025, gradeBaseLevel: 1, gradeTouchedFY: 2024 },
    // 小1になったあとに手で学年を選んで保存した人（gradeTouchedFY >= gradeBaseFY）は触らない
    { id: 'm1', name: '手で保存', category: '小学生', grade: '小2', birth: '2019-06-10', gradeBaseFY: 2025, gradeBaseLevel: 1, gradeTouchedFY: 2025 },
    // 手で小2から始めた人（gradeBaseLevel が1でない）は触らない
    { id: 'm2', name: '手で小2', category: '小学生', grade: '小3', birth: '2019-06-10', gradeBaseFY: 2025, gradeBaseLevel: 2, gradeTouchedFY: 2025 },
    // 手で入れた年度が旧い式の値と違う人は触らない
    { id: 'm3', name: '手で年度', category: '小学生', grade: '小3', birth: '2019-06-10', gradeBaseFY: 2024, gradeBaseLevel: 1 },
    // 院生など固定の学年は触らない
    { id: 'm4', name: '院生', category: '大学生', grade: '院生M', birth: '2019-06-10', gradeBaseFY: 2025, gradeBaseLevel: 1, gradeFixed: '院生M' },
    // 生年月日なしは触らない
    { id: 'm5', name: '生年月日なし', category: '小学生', grade: '小2', gradeBaseFY: 2025, gradeBaseLevel: 1 },
  ] });
  {
    const db = v275(); const before = clone(db);
    const E = makeEnv(code, '2026-10-09', db);
    E.fixGradeEntryFY();
    const S = id => db.students.find(x => x.id === id);
    t('移行：済みの印が付く', () => eq(db.gradeEntryFix, 1));
    t('移行：控え gradeEntryFixBackup が noticed:false で作られる', () => {
      const b = db.gradeEntryFixBackup;
      if (!b) throw new Error('控えがない');
      eq([b.noticed, b.date], [false, '2026-10-09']);
    });
    t('移行：控えには直した3人だけが、直す前の値で入る', () => eq(db.gradeEntryFixBackup.items, ['s1', 's2', 's3'].map(id => {
      const s = before.students.find(x => x.id === id);
      return { id: s.id, name: s.name, gradeBaseFY: s.gradeBaseFY, gradeBaseLevel: s.gradeBaseLevel, category: s.category, grade: s.grade };
    })));
    t('移行：自動で小1にされた人の入学年度が1年あと（2025→2026）', () => eq([S('s1').gradeBaseFY, S('s1').gradeBaseLevel], [2026, 1]));
    t('移行：まだ未就学のはずの人は未就学に戻る', () => eq([S('s2').category, S('s2').grade, S('s2').gradeBaseFY, S('s2').gradeBaseLevel], ['未就学', '', null, null]));
    t('移行：未就学のときに保存しただけの人は直る', () => eq(S('s3').gradeBaseFY, 2026));
    t('移行：手で入力・修正した学年は変わらない', () => ['m1', 'm2', 'm3', 'm4', 'm5'].forEach(id => eq(S(id), before.students.find(x => x.id === id), id)));
    E.refreshGrades();
    t('移行＋再計算：直した人は小1・未就学になる', () => eq([S('s1').grade, S('s3').grade, S('s2').category], ['小1', '小1', '未就学']));
    t('移行＋再計算：手で入れた学年は表示も変わらない', () => eq(['m1', 'm2', 'm3', 'm4'].map(id => S(id).grade), ['小2', '小3', '小3', '院生M']));
    t('移行＋再計算：未就学に戻した人が今年度また小1にされない', () => { E.refreshGrades(); eq(S('s2').category, '未就学'); });

    // 2回目（次の起動・同じデータ）：何も直さず控えも作り直さない
    if (db.gradeEntryFixBackup) db.gradeEntryFixBackup.noticed = true;
    const after1 = clone(db);
    E.fixGradeEntryFY();
    t('2回目の移行：控えは作り直さない（通知済みのまま）', () => eq(db.gradeEntryFixBackup, after1.gradeEntryFixBackup));
    t('2回目の移行：学年は変わらない', () => eq(db.students, after1.students));
    delete db.gradeEntryFixBackup;
    E.fixGradeEntryFY();
    t('2回目の移行：控えを消したあとでも新しく作らない', () => eq(db.gradeEntryFixBackup, undefined));
  }
  {
    // 直す人がいない v275 以前のデータでは控えを作らず、印だけ付ける
    const db = { gradeEnabled: true, students: [{ id: 'm1', name: '手で保存', category: '小学生', grade: '小2', birth: '2019-06-10', gradeBaseFY: 2025, gradeBaseLevel: 1, gradeTouchedFY: 2025 }] };
    makeEnv(code, '2026-10-09', db).fixGradeEntryFY();
    t('直す人がいなければ控えは作らず、印だけ付く', () => eq([db.gradeEntryFix, db.gradeEntryFixBackup], [1, undefined]));
  }
  {
    // 学年機能オフでは何もしない（印も付けない＝あとでオンにしたら移行できる）
    const db = v275(); db.gradeEnabled = false; const before = clone(db);
    makeEnv(code, '2026-10-09', db).fixGradeEntryFY();
    t('学年機能オフ：移行も印もなし', () => eq(db, before));
  }

  if (!opts.silent) console.log('grade-entry.test: ok ' + ok + ' / NG ' + ng);
  return ng === 0;
}

module.exports = { run, mutations: ['entry', 'fix'] };

if (require.main === module) {
  const m = (process.argv.find(a => a.startsWith('--mutate=')) || '').split('=')[1];
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  let pass;
  try { pass = run(html, { mutate: m }); }
  catch (e) { console.error('grade-entry.test: ' + e.message); pass = false; }
  process.exit(pass ? 0 : 1);
}
