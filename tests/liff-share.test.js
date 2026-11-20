/* v319: 予定表を「ボタンだけのカード」で LINE へ送る道（LIFF）の見張り。

   なぜ要るのか：
     LINE の通常メッセージは「表示する文字」と「飛び先」を分けられないため、
     予定の中身を抱えた 683〜850文字のリンクがトーク画面を埋めてしまう。
     liff.shareTargetPicker() なら、ボタンに URL を仕込んだカードを本人の名前で送れる。

   ここで見張る「壊れたら気づけないこと」：

   (1) 合言葉まわりの確認が1か所であること。
       「リンクで送る」と「カードで送る」で別々に書くと、片方だけ直して
       もう片方が名前入りの平文リンクを配る事故になる。実際 v315・v316 で
       「片方だけ直して siblings を見落とす」のを2度やっている。

   (2) カードのボタンに入れる URL が、自分のページに限られていること。
       share-liff.html に知らない飛び先を運ばせない。

   (3) altText に URL を入れないこと。
       altText は通知とトーク一覧に出る文字。ここに URL を入れると、
       せっかくカードにしたのに長い文字列が通知で復活する。

   (4) 予定データを # で渡していること。
       # 以降はどのサーバーにも送られない＝LINE も GitHub も暗号文を受け取らない。
       クエリに変えると、その前提が黙って崩れる。

   (5) LIFF の登録が済むまでボタンを出さないこと（押しても失敗するだけ）。

   (7) アプリ版が line:// で LINE を直接開くこと。
       https の LIFF URL だと iOS のユニバーサルリンクの判定にゆだねられ、効かないと
       既定のブラウザが開いてしまう（実機で踏んだ。既定が Edge だと長押ししても
       「LINEで開く」が出ず、手の打ちようがない）。

   (6) 受け側が3経路（hash / liff.state / query）から読むこと。
       LIFF の起動で # が残るかは実機で確かめるまで分からないため、
       どれで届いても動くようにしてある。1つでも落ちると実機で詰まる。

   使い方： node tests/liff-share.test.js
           node tests/liff-share.test.js --mutate=guard  … 確認を片方だけに戻す（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=alttext … altTextにURLを入れる（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=query  … 予定データをクエリで渡す（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=origin … 飛び先の確かめを外す（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=gate   … 未登録でもボタンを出す（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=scheme … アプリ版を https に戻す（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=clip   … クリップボード渡しをやめる（失敗するのが正しい）
           node tests/liff-share.test.js --mutate=clipnative … 書き込みを Web の API だけに戻す（失敗するのが正しい）
   build.js の最後からも run() が呼ばれる。 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const GUARD_LINK = 'if(!ssPlainGuard(r,ssSendLink))return;';
const GUARD_CARD = 'if(!ssPlainGuard(r,ssSendCard))return;';
const HASH_PASS = "const web='https://liff.line.me/'+LIFF_SHARE_ID+'#'+q;";
const SCHEME_PASS = "const app='line://app/'+LIFF_SHARE_ID+'#'+q;";
const ORIGIN_CHECK = "if(!/^https:\\/\\/akihikoito-apps\\.github\\.io\\/judo\\//.test(D.url)){";
const GATE = 'const showCard=liffShareReady();';
const CLIP_CALL = "ssClipWrite('myjudo-sched:v1:'+q)";
const CLIP_NATIVE = 'if(p&&p.write){ await p.write({string:text}); return true; }';

function run(src, opts) {
  opts = opts || {};
  const say = (m) => { if (!opts.quiet) console.log(m); };
  let pass = 0, fail = 0;
  const ok = (cond, label) => {
    if (cond) { pass++; return; }
    fail++;
    if (!opts.silent) console.error('  NG: ' + label);
  };

  let index = src || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let page = fs.readFileSync(path.join(ROOT, 'share-liff.html'), 'utf8');
  const pkg = fs.readFileSync(path.join(ROOT, 'native', 'office', 'package.json'), 'utf8');

  if (opts.mutate === 'guard') {
    if (index.indexOf(GUARD_CARD) < 0) throw new Error('mutate=guard の置き換え先が見つかりません');
    // カード側だけ確認を素通りさせる（＝合言葉なしで平文リンクを配れてしまう）
    index = index.replace(GUARD_CARD, '');
  }
  if (opts.mutate === 'alttext') {
    if (page.indexOf("altText:'【'") < 0) throw new Error('mutate=alttext の置き換え先が見つかりません');
    page = page.replace("altText:'【'", "altText:D.url+'【'");
  }
  if (opts.mutate === 'query') {
    if (index.indexOf(SCHEME_PASS) < 0) throw new Error('mutate=query の置き換え先が見つかりません');
    index = index.replace(SCHEME_PASS, "const app='line://app/'+LIFF_SHARE_ID+'?'+q;");
  }
  if (opts.mutate === 'clip') {
    if (index.indexOf(CLIP_CALL) < 0) throw new Error('mutate=clip の置き換え先が見つかりません');
    // クリップボードをやめる（＝URLに載せるしか道がなくなる）
    index = index.replace(CLIP_CALL, 'Promise.resolve(true)');
  }
  if (opts.mutate === 'clipnative') {
    if (index.indexOf(CLIP_NATIVE) < 0) throw new Error('mutate=clipnative の置き換え先が見つかりません');
    // v321 と同じ、Web の API だけに戻す（＝await のあとで iOS に拒まれ、黙って空になる）
    index = index.replace(CLIP_NATIVE, '');
  }
  if (opts.mutate === 'scheme') {
    if (index.indexOf(SCHEME_PASS) < 0) throw new Error('mutate=scheme の置き換え先が見つかりません');
    // アプリ版を v319 の https に戻す（＝実機で既定のブラウザが開いてしまう形）
    index = index.replace(SCHEME_PASS, "const app='https://liff.line.me/'+LIFF_SHARE_ID+'#'+q;");
  }
  if (opts.mutate === 'origin') {
    if (page.indexOf(ORIGIN_CHECK) < 0) throw new Error('mutate=origin の置き換え先が見つかりません');
    page = page.replace(ORIGIN_CHECK, 'if(false){');
  }
  if (opts.mutate === 'gate') {
    if (index.indexOf(GATE) < 0) throw new Error('mutate=gate の置き換え先が見つかりません');
    index = index.replace(GATE, 'const showCard=true;');
  }

  /* (1) 合言葉の確認が1か所 ------------------------------------------------ */
  ok(index.indexOf('function ssPlainGuard(r,retry){') >= 0, '合言葉の確認がひとつの関数になっている');
  ok(index.indexOf(GUARD_LINK) >= 0, 'リンクで送るが ssPlainGuard を通る');
  ok(index.indexOf(GUARD_CARD) >= 0, 'カードで送るが ssPlainGuard を通る');
  // 確認の中身（2つの問い）が、その関数の中にあること
  const gi = index.indexOf('function ssPlainGuard(r,retry){');
  const gEnd = index.indexOf('async function ssSendCard()');
  const guardBody = gi >= 0 && gEnd > gi ? index.slice(gi, gEnd) : '';
  ok(guardBody.indexOf("T('合言葉で包めませんでした。')") >= 0, '包めなかったときの問いが関数の中にある');
  ok(guardBody.indexOf("T('合言葉を入れずに送ります。')") >= 0, '合言葉なしのときの問いが関数の中にある');
  // 同じ問いが関数の外に散っていないこと（＝直し忘れる相手がいない）
  ok(index.split("T('合言葉で包めませんでした。')").length - 1 === 1,
     '包めなかったときの問いが1か所だけ');
  ok(index.split("T('合言葉を入れずに送ります。')").length - 1 === 1,
     '合言葉なしのときの問いが1か所だけ');

  /* (4) 予定データは # で渡す --------------------------------------------- */
  ok(index.indexOf(HASH_PASS) >= 0, '予定データを # で渡している（どのサーバーにも渡らない）');
  ok(index.indexOf("'u='+encodeURIComponent(r.url)") >= 0, '予定表のリンクを u= で渡す');

  /* (7) アプリ版はカスタムURLスキームで LINE を直接開く --------------------
     v319 は https の LIFF URL を渡していたが、実機（iPhone）で LINE ではなく
     既定のブラウザが開いた。Capacitor は外部URLを canOpenURL も通さず
     UIApplication.shared.open(url, options: [:]) に素通しするだけなので、
     https だと「ユニバーサルリンクが効くかどうか」次第になる。しかも社長の端末の
     既定ブラウザは Safari ではなく Edge で、長押ししても「LINEで開く」が出ない。
     スキームなら iOS がスキームから直接 LINE を引くので、判定に左右されない。 */
  ok(index.indexOf(SCHEME_PASS) >= 0,
     'アプリ版はカスタムURLスキームで LINE を直接開く（既定ブラウザに逃げない）');
  ok(index.indexOf('try{ location.href=app; }catch(e){}') >= 0,
     'アプリ版はスキームのURLへ出す');
  ok(index.indexOf('ssCardWatch(web);') >= 0,
     'スキームで出したあと、開けたかどうかを見張る');
  ok(index.indexOf("if(document.visibilityState!=='visible')return;") >= 0,
     'LINE に移れたときは余計な案内を出さない');
  ok(index.indexOf("w=window.open(web,'_blank');") >= 0, 'Web版は別タブで開く');

  /* (8) 予定の中身を URL に載せずに渡す ------------------------------------
     line:// は # を落とすので、クエリに移したくなる。だがクエリに移すと
     予定の中身が LINE と GitHub のサーバーを通る。合言葉なしの月は氏名が
     平文でサーバーの記録に残る。だからクリップボードで渡している。
     ここが崩れたら、その事故に気づけない。 */
  ok(index.indexOf(CLIP_CALL) >= 0,
     'LINEを開く直前に、予定をクリップボードへ写している');
  /* v322: ここが肝。iOS は Web の writeText を「押した直後」しか許さず、
     ssSendCard は共有URLを作るのに await を挟む。だから Capacitor の
     クリップボード（OSの貼り付け板）を先に試すこと。これを外すと v321 に戻り、
     書けていないのに LINE だけ開いて、受け側が空になる。 */
  ok(index.indexOf(CLIP_NATIVE) >= 0,
     'アプリ版は Capacitor のクリップボードで書いている（await のあとでも書ける）');
  ok(pkg.indexOf('"@capacitor/clipboard"') >= 0,
     '事務アプリに @capacitor/clipboard が入っている（無いと黙って Web の API に落ちる）');
  ok(page.indexOf("var CLIP_TAG = 'myjudo-sched:v1:';") >= 0,
     '受け側が同じ合図でクリップボードを読む');
  ok(page.indexOf('navigator.clipboard.readText()') >= 0, '受け側に読み出す道がある');
  ok(page.indexOf('take(ta.value);') >= 0,
     '自動で読めないときに、手で貼り付ける道がある');
  ok(page.indexOf('ta.oninput = function(){ take(ta.value, true); };') >= 0,
     '貼り付けた時点で進む（「読み込む」を押させない）');
  // クリップボードから読んだ中身も、必ず飛び先の確かめを通ること
  const si = page.indexOf('function start(){');
  const pi = page.indexOf('function applyQuery(q){');
  const sBody = si >= 0 ? page.slice(si, page.indexOf('start();', si)) : '';
  ok(pi >= 0 && sBody.indexOf('.test(D.url)') >= 0,
     'クリップボードから読んだ中身も、飛び先の確かめを通る');

  /* (5) 未登録のうちは出さない -------------------------------------------- */
  ok(index.indexOf("const LIFF_SHARE_ID='LIFF_ID_PENDING';") >= 0 ||
     /const LIFF_SHARE_ID='[0-9]{10}-[0-9A-Za-z]{8}';/.test(index),
     'LIFF ID が仮置きか、正しい形で入っている');
  ok(index.indexOf("function liffShareReady(){ return !!LIFF_SHARE_ID && LIFF_SHARE_ID.indexOf('PENDING')<0; }") >= 0,
     '仮置きのあいだは「使えない」と判定する');
  ok(index.indexOf(GATE) >= 0, 'ボタンの出し分けが liffShareReady を見ている');
  ok(index.indexOf('id="ssCardBtn" style="display:none;') >= 0, 'ボタンは既定で隠れている');

  /* 文言が辞書にある（英仏葡で日本語のまま出ない） ------------------------ */
  ['💬 LINEでカードを送る', '長いURLが出ません',
   'LINEが開きます。送る相手を選ぶと、ボタンだけのカードが届きます。',
   'LINEを開けませんでした。「リンクで送る」をお使いください。',
   'LINEが開きませんでした。',
   '別の開き方を試します。これでも開かないときは「リンクで送る」をお使いください。',
   '別の方法で開く'].forEach((k) => {
    ok(index.indexOf("  '" + k + "':{en:") >= 0, '辞書にある: ' + k);
  });

  /* ---- share-liff.html 側 ------------------------------------------------ */

  /* (2) 飛び先は自分のページだけ ------------------------------------------ */
  ok(page.indexOf(ORIGIN_CHECK) >= 0, '知らない飛び先をボタンに仕込まない');

  /* (3) altText に URL を入れない ----------------------------------------- */
  const ai = page.indexOf('altText:');
  const aEnd = page.indexOf('contents:{', ai);
  const altLine = ai >= 0 && aEnd > ai ? page.slice(ai, aEnd) : '';
  ok(altLine.length > 0 && altLine.indexOf('D.url') < 0,
     'altText に URL を入れていない（通知で長い文字列が復活しない）');

  /* (6) 3経路から読む ----------------------------------------------------- */
  ok(page.indexOf("if(h.u) return {how:'hash', q:h};") >= 0, '# から読める');
  ok(page.indexOf("if(st.u) return {how:'liff.state', q:st};") >= 0, 'liff.state から読める');
  ok(page.indexOf("if(q.u) return {how:'query', q:q};") >= 0, 'クエリから読める');

  /* ピッカーの使い方 ------------------------------------------------------ */
  ok(page.indexOf("liff.isApiAvailable('shareTargetPicker')") >= 0,
     '送る前にピッカーが使えるか確かめる');
  ok(page.indexOf('liff.shareTargetPicker([buildFlex()])') >= 0, 'ピッカーでカードを送る');
  ok(page.indexOf("type:'uri', label:'予定を見る', uri:D.url") >= 0,
     'ボタンの飛び先が予定表のリンク');
  ok(page.indexOf("liff.init({ liffId: LIFF_ID })") >= 0, 'LIFF を初期化している');
  ok(page.indexOf("var LIFF_ID = 'LIFF_ID_PENDING';") >= 0 ||
     /var LIFF_ID = '[0-9]{10}-[0-9A-Za-z]{8}';/.test(page),
     'ページ側の LIFF ID が仮置きか、正しい形で入っている');
  // 送れなかったときに黙らない（コピーの逃げ道がある）
  ok(page.indexOf('リンクをコピー') >= 0, 'カードで送れないときの逃げ道がある');
  // 外部ブラウザで開かれたら、LINE の中へ入り直せる（SSOのログイン画面を避ける）
  ok(page.indexOf('inClient = liff.isInClient();') >= 0, 'LINEの中かどうかを見ている');
  // LINE 公式（2026-05-07）：iOS は「JSによる自動リダイレクトではなく、ユーザーのタップで」
  // 始めないとユニバーサルリンクが効かず、ブラウザに留まる。実機でこれを踏んだ。
  ok(page.indexOf('id="reopen" href="') >= 0,
     'LINEで開き直すのは本物の <a href>（タップでないと iOS で効かない）');
  ok(page.indexOf('location.href = liffUrl()') < 0,
     '開き直しを JS の自動遷移でやっていない');
  ok(page.indexOf('function schemeUrl()') >= 0 && page.indexOf("'line://app/' + LIFF_ID") >= 0,
     'ユニバーサルリンクが効かない端末向けの逃げ道（line://app/）がある');

  /* 受け取り側の道は1つも変えていない ------------------------------------ */
  ok(index.indexOf("return {url:SHARE_PAGE+'#'+frag,") >= 0,
     '予定表リンクの作り方は変えていない（選手アプリ1.3でも開ける）');
  ok(index.indexOf("if(!await shareTextOrFalse(text,'My柔道 予定'))ssCopy(text);") >= 0,
     'これまでの「リンクで送る」はそのまま残っている');

  say('  liff-share: ok ' + pass + ' / NG ' + fail);
  return fail === 0;
}

module.exports = { run, mutations: ['guard', 'alttext', 'query', 'origin', 'gate', 'scheme', 'clip', 'clipnative'] };

if (require.main === module) {
  const m = (process.argv.find((a) => a.startsWith('--mutate=')) || '').split('=')[1];
  process.exit(run(null, { mutate: m }) ? 0 : 1);
}
