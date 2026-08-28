/* CI用：Appターゲットにだけ DEVELOPMENT_TEAM を書き込む。
   xcodebuild のコマンドラインで DEVELOPMENT_TEAM を渡すと、Podsの各ターゲットにも適用されて
   署名で転ぶことがあるため、プロジェクトファイル側（CODE_SIGN_STYLE = Automatic; が置かれている
   ＝Appターゲットのビルド設定）にだけ差し込む。
   使い方: node native/ci-set-team.js office|player  （環境変数 APPLE_TEAM_ID を参照） */
const fs = require('fs');
const path = require('path');

const app = process.argv[2];
const team = (process.env.APPLE_TEAM_ID || '').trim();
if (!app || !['office', 'player'].includes(app)) {
  console.error('使い方: node native/ci-set-team.js office|player');
  process.exit(1);
}
if (!team) { console.error('APPLE_TEAM_ID が空です'); process.exit(1); }

const p = path.join(__dirname, app, 'ios/App/App.xcodeproj/project.pbxproj');
let t = fs.readFileSync(p, 'utf8');

const before = [...t.matchAll(/DEVELOPMENT_TEAM = ([^;]*);/g)].map(m => m[1].trim());
if (before.length) {
  t = t.replace(/DEVELOPMENT_TEAM = [^;]*;/g, 'DEVELOPMENT_TEAM = ' + team + ';');
} else {
  const hits = (t.match(/CODE_SIGN_STYLE = Automatic;/g) || []).length;
  if (!hits) { console.error('CODE_SIGN_STYLE = Automatic; が見つかりません'); process.exit(1); }
  t = t.replace(/CODE_SIGN_STYLE = Automatic;/g,
    'CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ' + team + ';');
}
fs.writeFileSync(p, t);

const after = [...t.matchAll(/DEVELOPMENT_TEAM = ([^;]*);/g)].map(m => m[1].trim());
console.log(app + ': DEVELOPMENT_TEAM を ' + after.length + ' 箇所に設定しました（' +
  (after[0] ? after[0].slice(0, 4) + '******' : '?') + '）');
