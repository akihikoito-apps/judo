/* My柔道(事務) — RevenueCat課金ブリッジ（自動生成: build-www.js） */
(function(){
  var API_KEY='appl_cqqKOnaJkUfzDJQbkLpNoqCfjJL';
  var ENTITLEMENT='pro';
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
          if(ok && typeof DB!=='undefined' && !DB.officePro && typeof officeUnlocked==='function' && 'office'==='office'){ officeUnlocked(); }
          if(ok && typeof DB!=='undefined' && !DB.pro && typeof setPro==='function' && 'office'==='player'){ setPro(true); }
          if(!ok && typeof DB!=='undefined' && 'office'==='office' && DB.officePro){ DB.officePro=false; save(); if(typeof officeGateCheck==='function') officeGateCheck(); }
          if(!ok && typeof DB!=='undefined' && 'office'==='player' && DB.pro){ setPro(false); }
        }catch(e){}
      });
    }, 800);
  });
})();
