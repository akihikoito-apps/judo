/* My柔道 ネイティブ用 www 生成スクリプト
   使い方: node build-www.js office   … ../../office.html → office/www/index.html
           node build-www.js player   … ../../personal.html → player/www/index.html
   やること:
   - リポジトリ直下でビルド済みの単一HTML（node ../build.js で生成）を www/index.html にコピー
   - </body> 直前に iap.js（RevenueCat課金ブリッジ）を注入
   - iap.js をアプリ別設定（APIキー・商品情報）付きで www/ に書き出す
   注意: 元HTMLを編集したら「リポジトリ直下で node build.js」→「ここで node build-www.js <app>」の順で反映。 */
const fs = require('fs');
const path = require('path');

const app = process.argv[2];
if (app !== 'office' && app !== 'player') { console.error('usage: node build-www.js office|player'); process.exit(2); }

const ROOT = path.join(__dirname, '..');               // = judo-repo
const srcFile = app === 'office' ? 'office.html' : 'personal.html';
const wwwDir = path.join(__dirname, app, 'www');
fs.mkdirSync(wwwDir, { recursive: true });

let html = fs.readFileSync(path.join(ROOT, srcFile), 'utf8');
if (!html.includes('</body>')) { console.error('</body> が見つかりません'); process.exit(2); }
html = html.replace('</body>', '<script src="iap.js"></script>\n</body>');
fs.writeFileSync(path.join(wwwDir, 'index.html'), html, 'utf8');

/* ---- RevenueCat 課金ブリッジ（window.__iap） ----
   アプリ側(index.html)は window.__iap = {buy, restore} を呼ぶだけの設計（v169/v218）。
   RevenueCatの設定が済んだら、下の API_KEY を各アプリのiOS用 Public API Key に置き換える。 */
const CFG = {
  office: { API_KEY: 'appl_cqqKOnaJkUfzDJQbkLpNoqCfjJL', ENTITLEMENT: 'pro', LABEL: 'My柔道(事務)' },
  player: { API_KEY: 'appl_jmVKkdIbocWpbZExUKwhDgBEYBm', ENTITLEMENT: 'pro', LABEL: 'My柔道(選手)' },
}[app];

const iapJs = `/* ${CFG.LABEL} — RevenueCat課金ブリッジ（自動生成: build-www.js） */
(function(){
  var API_KEY='${CFG.API_KEY}';
  var ENTITLEMENT='${CFG.ENTITLEMENT}';
  var APP='${app}';
  function plugin(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases) || null; }
  var ready=null;
  // 注意: configure は Capacitor の returnType=None のため Promise ではなく callbackId(文字列) を返す。
  //       そのまま .then すると TypeError になるので必ず Promise.resolve() で包むこと。
  function init(){
    if(ready) return ready;
    try{
      var P=plugin();
      if(!P || API_KEY.indexOf('REVENUECAT_')===0){ ready=Promise.resolve(null); return ready; }
      // v256: StoreKit 2 を明示する。既定（自動選択）では古いレシート方式(StoreKit 1)に落ちることがあり、
      //        サンドボックスで「The receipt is not valid …」で購入シートすら出ずに失敗した。
      //        ※RevenueCat側に In-App Purchase キーが設定済みであること（両プロジェクト設定済み・2026-09-24確認）。
      //        iOS 15 など StoreKit 2 が使えない端末では、SDKが自動でStoreKit 1に戻す。
      ready=Promise.resolve(P.configure({ apiKey: API_KEY, storeKitVersion: 'STOREKIT_2' })).then(function(){ return P; })
        .catch(function(e){ console.log('iap configure error', e); ready=null; return null; });
    }catch(e){ console.log('iap init error', e); ready=Promise.resolve(null); }
    return ready;
  }
  function entitled(info){
    try{ return !!(info && info.customerInfo && info.customerInfo.entitlements && info.customerInfo.entitlements.active && info.customerInfo.entitlements.active[ENTITLEMENT]); }
    catch(e){ return false; }
  }
  // v256: 課金側のエラーを日本語の案内に置き換える（従来は英語の原文がそのまま画面に出ていた）。
  //       返す文字列はアプリ側の辞書に登録してあり、en/fr/pt でも訳される。
  var ERR={
    '2':'App Store側で問題が起きています。少し時間をおいてもう一度お試しください。',
    '3':'この端末では購入が許可されていません。設定の「スクリーンタイム」などの制限をご確認ください。',
    '5':'この商品はいま購入できません。少し時間をおいてもう一度お試しください。',
    '6':'すでにご購入済みです。「購入を復元する」をお試しください。',
    '7':'このご購入は別のApple IDで使用中です。ご購入時のApple IDでお試しください。',
    '8':'購入の確認に失敗しました。アプリをいったん終了して開き直し、もう一度お試しください。',
    '9':'購入の確認に失敗しました。アプリをいったん終了して開き直し、もう一度お試しください。',
    '10':'通信に失敗しました。電波のよい場所でもう一度お試しください。',
    '13':'このご購入は別のApple IDで使用中です。',
    '15':'前の手続きがまだ進行中です。少し待ってからお試しください。',
    '17':'課金の設定に問題があります。お手数ですがサポートページからご連絡ください。',
    '20':'購入の承認待ちです。承認されると自動でご利用いただけます。',
    '23':'課金の設定に問題があります。お手数ですがサポートページからご連絡ください。',
    '35':'オフラインのため購入できません。通信を確認してからお試しください。'
  };
  function errText(e,fallback){
    try{ console.log('iap error', e && e.code, e && e.message); }catch(_){}
    var c=String(e&&e.code!=null?e.code:'');
    return ERR[c]||fallback;
  }
  // ユーザーが購入をキャンセルしたか（RevenueCat: PURCHASE_CANCELLED_ERROR = 1）
  function cancelled(e){ if(!e) return false; if(e.userCancelled) return true;
    var c=String(e.code!=null?e.code:''); if(c==='1') return true;
    return /cancell?ed/i.test(String(e.message||'')); }
  function pickPkg(cur){ if(!cur) return null;
    if(cur.annual) return cur.annual;
    var av=cur.availablePackages||[];
    for(var i=0;i<av.length;i++){ var id=(av[i]&&av[i].identifier)||''; if(/annual|year/i.test(id)) return av[i]; }
    return av[0]||null; }
  window.__iap={
    lastError:'',
    // 価格表示用（取得できたら実際のストア価格を返す）
    priceInfo: async function(){
      var P=await init(); if(!P) return null;
      try{ var offs=await P.getOfferings(); var pkg=pickPkg(offs&&offs.current); var pr=pkg&&pkg.product;
        if(!pr) return null;
        var intro=(pr.introPrice&&(pr.introPrice.periodNumberOfUnits!=null))?pr.introPrice:null;
        // 無料トライアルをこのApple IDがまだ使えるか（1=INELIGIBLE / 2=ELIGIBLE / それ以外は不明）
        var eligible=null;
        if(intro && pr.identifier && P.checkTrialOrIntroductoryPriceEligibility){
          try{
            var el=await P.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers:[pr.identifier] });
            var r=el && (el[pr.identifier] || (el.eligibility && el.eligibility[pr.identifier]));
            var st=r && (r.status!=null ? r.status : r);
            if(st===1||st==='INTRO_ELIGIBILITY_STATUS_INELIGIBLE') eligible=false;
            else if(st===2||st==='INTRO_ELIGIBILITY_STATUS_ELIGIBLE') eligible=true;
          }catch(e){}
        }
        return { price: pr.priceString||'', intro: intro, eligible: eligible };
      }catch(e){ return null; }
    },
    // 購入（年額サブスク）。成功時 true。キャンセルは 'cancel' を返す。
    buy: async function(){
      window.__iap.lastError='';
      var P=await init();
      if(!P){ window.__iap.lastError='課金機能を準備できませんでした（通信環境をご確認ください）'; return false; }
      try{
        var offs=await P.getOfferings();
        var pkg=pickPkg(offs && offs.current);
        if(!pkg){ window.__iap.lastError='商品情報を取得できませんでした（時間をおいて再度お試しください）'; return false; }
        var res=await P.purchasePackage({ aPackage: pkg });
        var ok=entitled(res);
        if(!ok) window.__iap.lastError='購入は完了しませんでした';
        return ok;
      }catch(e){
        if(cancelled(e)) return 'cancel';
        window.__iap.lastError=errText(e,'購入は完了しませんでした。少し時間をおいてもう一度お試しください。');
        return false;
      }
    },
    // 購入の復元。成功（対象あり）で true。
    restore: async function(){
      window.__iap.lastError='';
      var P=await init();
      if(!P){ window.__iap.lastError='課金機能を準備できませんでした（通信環境をご確認ください）'; return false; }
      try{ var res=await P.restorePurchases(); var ok=entitled(res);
        if(!ok) window.__iap.lastError='このApple IDでのご購入が見つかりませんでした';
        return ok; }
      catch(e){ window.__iap.lastError=errText(e,'復元できませんでした。少し時間をおいてもう一度お試しください。'); return false; }
    },
    // 現在の加入状態（起動時の再検証用）。true/false/null(不明)。
    entitledNow: async function(){
      var P=await init(); if(!P) return null;
      try{ var res=await P.getCustomerInfo(); return entitled(res); }
      catch(e){ return null; }
    }
  };
  // 起動時に加入状態を再検証（失効していればアプリ側フラグを戻し、加入済みならゲートを外す）
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      try{
        var payReady=function(){ try{ if(typeof officePaySetChecking==='function') officePaySetChecking(false); }catch(e){} };
        window.__iap.entitledNow().then(function(ok){
          if(ok===null){ payReady(); return; }        // 不明（未設定/オフライン）は現状維持（v254: 購読画面のボタンは出す）
          try{
            if(ok && typeof DB!=='undefined' && !DB.officePro && typeof officeUnlocked==='function' && APP==='office'){ officeUnlocked(); }
            if(ok && typeof DB!=='undefined' && !DB.pro && typeof setPro==='function' && APP==='player'){ setPro(true); }
            if(!ok && typeof DB!=='undefined' && APP==='office' && DB.officePro){ DB.officePro=false; save(); if(typeof officeGateCheck==='function') officeGateCheck(); }
            if(!ok && typeof DB!=='undefined' && APP==='player' && DB.pro){ setPro(false); }
          }catch(e){}
          if(!ok) payReady();                         // v254: 未加入なら購読画面のボタンを出す（失効時の再表示の後に）
        }).catch(function(e){ payReady(); console.log('iap entitledNow error', e); });
      }catch(e){ console.log('iap boot error', e); }
      try{ if(typeof refreshPaywallPrices==='function') refreshPaywallPrices(); }catch(e){}
    }, 800);
  });
})();
`;
fs.writeFileSync(path.join(wwwDir, 'iap.js'), iapJs, 'utf8');
console.log('generated', app + '/www/index.html', '+ iap.js');
