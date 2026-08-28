/* CI用：Xcodeプロジェクトの署名設定をApp Store配布向けに整える。
   使い方: node native/ci-set-team.js office|player  （環境変数 APPLE_TEAM_ID を参照）

   1) DEVELOPMENT_TEAM を Appターゲットにだけ書き込む
      xcodebuild のコマンドラインで渡すと Pods の全ターゲットにも適用され、署名で転ぶことがあるため。

   2) CODE_SIGN_IDENTITY の固定を外す
      Capacitorの初期テンプレートは Debug/Release とも "iPhone Developer" に固定している。
      自動署名（CODE_SIGN_STYLE = Automatic）と併用すると
      「conflicting provisioning settings」で失敗するため、指定そのものを取り除いて
      Xcodeに任せる。実際の署名はアーカイブ時ではなく、書き出し（-exportArchive）時に
      配布用の証明書で行う。
*/
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

/* --- 1) DEVELOPMENT_TEAM --- */
if (/DEVELOPMENT_TEAM = [^;]*;/.test(t)) {
  t = t.replace(/DEVELOPMENT_TEAM = [^;]*;/g, 'DEVELOPMENT_TEAM = ' + team + ';');
} else {
  if (!/CODE_SIGN_STYLE = Automatic;/.test(t)) {
    console.error('CODE_SIGN_STYLE = Automatic; が見つかりません'); process.exit(1);
  }
  t = t.replace(/CODE_SIGN_STYLE = Automatic;/g,
    'CODE_SIGN_STYLE = Automatic;\n\t\t\t\tDEVELOPMENT_TEAM = ' + team + ';');
}

/* --- 2) CODE_SIGN_IDENTITY の行を丸ごと削除（前後の改行・インデントごと） --- */
const removed = (t.match(/^[ \t]*CODE_SIGN_IDENTITY = "[^"]*";[ \t]*\r?\n/gm) || []).length;
t = t.replace(/^[ \t]*CODE_SIGN_IDENTITY = "[^"]*";[ \t]*\r?\n/gm, '');

/* --- 3) 手動指定のプロファイルが残っていれば消す --- */
const removedProf = (t.match(/^[ \t]*PROVISIONING_PROFILE_SPECIFIER = [^;]*;[ \t]*\r?\n/gm) || []).length;
t = t.replace(/^[ \t]*PROVISIONING_PROFILE_SPECIFIER = [^;]*;[ \t]*\r?\n/gm, '');

fs.writeFileSync(p, t);

const teams = [...t.matchAll(/DEVELOPMENT_TEAM = ([^;]*);/g)].map(m => m[1].trim());
console.log(app + ': DEVELOPMENT_TEAM=' + teams.length + '箇所（' +
  (teams[0] ? teams[0].slice(0, 4) + '******' : '?') + '） / ' +
  'CODE_SIGN_IDENTITY の固定を削除=' + removed + '箇所 / ' +
  'PROVISIONING_PROFILE_SPECIFIER の削除=' + removedProf + '箇所');
if (/CODE_SIGN_IDENTITY/.test(t)) {
  console.log('::warning::CODE_SIGN_IDENTITY がまだ残っています');
}
