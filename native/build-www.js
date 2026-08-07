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
  function plugin(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases) || null; }
  var ready=null;
  function init(){
    if(ready) return ready;
    var P=plugin();
    if(!P || API_KEY.indexOf('REVENUECAT_')===0){ ready=Promise.resolve(null); return ready; }
    ready=P.configure({ apiKey: API_KEY }).then(function(){ return P; }).catch(function(e){ console.log('iap configure error', e); return null; });
    return ready;
  }
  function entitled(info){
    try{ return !!(info && info.customerInfo && info.customerInfo.entitlements && info.customerInfo.entitlements.active && info.customerInfo.entitlements.active[ENTITLEMENT]); }
    catch(e){ return false; }
  }
  window.__iap={
    // 購入（年額サブスク）。成功時 true。
    buy: async function(){
      var P=await init(); if(!P) return false;
      try{
        var offs=await P.getOfferings();
        var cur=offs && offs.current;
        var pkg=cur && (cur.annual || (cur.availablePackages && cur.availablePackages[0]));
        if(!pkg) { console.log('iap: no package'); return false; }
        var res=await P.purchasePackage({ aPackage: pkg });
        return entitled(res);
      }catch(e){ if(!(e&&e.userCancelled)) console.log('iap buy error', e); return false; }
    },
    // 購入の復元。成功（対象あり）で true。
    restore: async function(){
      var P=await init(); if(!P) return false;
      try{ var res=await P.restorePurchases(); return entitled(res); }
      catch(e){ console.log('iap restore error', e); return false; }
    },
    // 現在の加入状態（起動時の再検証用・任意）。true/false/null(不明)。
    entitledNow: async function(){
      var P=await init(); if(!P) return null;
      try{ var res=await P.getCustomerInfo(); return entitled(res); }
      catch(e){ return null; }
    }
  };
  // 起動時に加入状態を再検証（失効していればアプリ側フラグを戻し、加入済みならゲートを外す）
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      window.__iap.entitledNow().then(function(ok){
        if(ok===null) return;                       // 不明（未設定/オフライン）は現状維持
        try{
          if(ok && typeof DB!=='undefined' && !DB.officePro && typeof officeUnlocked==='function' && '${app}'==='office'){ officeUnlocked(); }
          if(ok && typeof DB!=='undefined' && !DB.pro && typeof setPro==='function' && '${app}'==='player'){ setPro(true); }
          if(!ok && typeof DB!=='undefined' && '${app}'==='office' && DB.officePro){ DB.officePro=false; save(); if(typeof officeGateCheck==='function') officeGateCheck(); }
          if(!ok && typeof DB!=='undefined' && '${app}'==='player' && DB.pro){ setPro(false); }
        }catch(e){}
      });
    }, 800);
  });
})();
`;
fs.writeFileSync(path.join(wwwDir, 'iap.js'), iapJs, 'utf8');
console.log('generated', app + '/www/index.html', '+ iap.js');
