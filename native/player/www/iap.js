/* My柔道(選手) — RevenueCat課金ブリッジ（自動生成: build-www.js） */
(function(){
  var API_KEY='appl_jmVKkdIbocWpbZExUKwhDgBEYBm';
  var ENTITLEMENT='pro';
  var APP='player';
  function plugin(){ return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases) || null; }
  var ready=null;
  // 注意: configure は Capacitor の returnType=None のため Promise ではなく callbackId(文字列) を返す。
  //       そのまま .then すると TypeError になるので必ず Promise.resolve() で包むこと。
  function init(){
    if(ready) return ready;
    try{
      var P=plugin();
      if(!P || API_KEY.indexOf('REVENUECAT_')===0){ ready=Promise.resolve(null); return ready; }
      ready=Promise.resolve(P.configure({ apiKey: API_KEY })).then(function(){ return P; })
        .catch(function(e){ console.log('iap configure error', e); ready=null; return null; });
    }catch(e){ console.log('iap init error', e); ready=Promise.resolve(null); }
    return ready;
  }
  function entitled(info){
    try{ return !!(info && info.customerInfo && info.customerInfo.entitlements && info.customerInfo.entitlements.active && info.customerInfo.entitlements.active[ENTITLEMENT]); }
    catch(e){ return false; }
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
        return { price: pr.priceString||'', intro: (pr.introPrice&&(pr.introPrice.periodNumberOfUnits!=null))?pr.introPrice:null };
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
        window.__iap.lastError=(e&&e.message)?String(e.message):'購入に失敗しました';
        console.log('iap buy error', e); return false;
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
      catch(e){ window.__iap.lastError=(e&&e.message)?String(e.message):'復元に失敗しました'; console.log('iap restore error', e); return false; }
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
        window.__iap.entitledNow().then(function(ok){
          if(ok===null) return;                       // 不明（未設定/オフライン）は現状維持
          try{
            if(ok && typeof DB!=='undefined' && !DB.officePro && typeof officeUnlocked==='function' && APP==='office'){ officeUnlocked(); }
            if(ok && typeof DB!=='undefined' && !DB.pro && typeof setPro==='function' && APP==='player'){ setPro(true); }
            if(!ok && typeof DB!=='undefined' && APP==='office' && DB.officePro){ DB.officePro=false; save(); if(typeof officeGateCheck==='function') officeGateCheck(); }
            if(!ok && typeof DB!=='undefined' && APP==='player' && DB.pro){ setPro(false); }
          }catch(e){}
        }).catch(function(e){ console.log('iap entitledNow error', e); });
      }catch(e){ console.log('iap boot error', e); }
      try{ if(typeof refreshPaywallPrices==='function') refreshPaywallPrices(); }catch(e){}
    }, 800);
  });
})();
