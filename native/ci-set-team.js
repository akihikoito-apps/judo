/* CI用：Xcodeプロジェクトの署名設定をApp Store配布向けに整える。
   使い方: node native/ci-set-team.js office|player  （環境変数 APPLE_TEAM_ID を参照）

   1) DEVELOPMENT_TEAM を Appターゲットにだけ書き込む
      xcodebuild のコマンドラインで渡すと Pods の全ターゲットにも適用され、署名で転ぶことがあるため。

   2) Release構成の CODE_SIGN_IDENTITY を "Apple Distribution" にする
      Capacitorの初期テンプレートは Debug/Release とも "iPhone Developer"（開発用）に固定しており、
      そのままアーカイブすると Xcode が「開発用プロファイル」を作ろうとして
      「No profiles ... iOS App Development」「Your team has no devices」で失敗する。
      Debug は開発用のまま残す。
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

/* --- 2) Release構成だけ配布用の署名に --- */
/* CODE_SIGN_IDENTITY の各出現について、その先に最初に現れる name = ...; を見て構成を判定する */
let changed = 0, kept = 0;
t = t.replace(/CODE_SIGN_IDENTITY = "[^"]*";/g, (m, offset) => {
  const after = t.slice(offset, offset + 4000);
  const nm = after.match(/name = (Debug|Release);/);
  if (nm && nm[1] === 'Release') { changed++; return 'CODE_SIGN_IDENTITY = "Apple Distribution";'; }
  kept++; return m;
});

fs.writeFileSync(p, t);

const teams = [...t.matchAll(/DEVELOPMENT_TEAM = ([^;]*);/g)].map(m => m[1].trim());
console.log(app + ': DEVELOPMENT_TEAM=' + teams.length + '箇所（' +
  (teams[0] ? teams[0].slice(0, 4) + '******' : '?') + '） / ' +
  'Releaseの署名を配布用に変更=' + changed + '箇所, Debugは据え置き=' + kept + '箇所');
if (changed === 0) {
  console.log('::warning::Release構成の CODE_SIGN_IDENTITY を変更できませんでした。署名で失敗する可能性があります');
}
