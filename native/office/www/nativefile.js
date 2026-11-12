/* My柔道(事務) — 保存・共有ブリッジ（自動生成: build-www.js） */
(function(){
  function platform(){
    try{ return (window.Capacitor && typeof window.Capacitor.getPlatform==='function')
                 ? window.Capacitor.getPlatform() : ''; }catch(e){ return ''; }
  }
  if(platform()!=='android')return;        // iPhone・Web版は一行も変えない

  function plugin(n){
    try{ return (window.Capacitor && window.Capacitor.Plugins) ? window.Capacitor.Plugins[n] : null; }
    catch(e){ return null; }
  }
  // 本人が共有シートを閉じただけ（＝失敗ではない）かどうか
  function isCancel(e){
    var m=''; try{ m=String((e && (e.message || e.errorMessage)) || ''); }catch(_){}
    return /cancel|abort|dismiss/i.test(m);
  }
  // ファイル名に使えない文字を落とす（シェア画像の名前は大会名から作られるため）
  function safeName(n){
    n=String(n||'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').replace(/^\.+/,'').trim();
    return n.slice(0,80) || 'file';
  }

  var lastPath='';   // 前回書いた一時ファイル（次に呼ばれたときに消す。受け取り側が読む前に消さない）

  // 返り値: 'ok'（渡せた）/'cancel'（本人がやめた）/'fail'（できなかった）
  function share(o){
    var Fs=plugin('Filesystem'), Sh=plugin('Share');
    if(!Fs || !Sh) return Promise.resolve('fail');
    var name=safeName(o && o.name);
    var del = lastPath ? Fs.deleteFile({path:lastPath,directory:'CACHE'}).catch(function(){}) : Promise.resolve();
    return del.then(function(){
      lastPath='';
      return Fs.writeFile({path:name,data:(o&&o.base64)||'',directory:'CACHE',recursive:true});
    }).then(function(w){
      var uri=(w && w.uri) || '';
      if(!uri) throw new Error('no uri');
      lastPath=name;
      return Sh.share({title:(o&&o.title)||'',text:(o&&o.text)||'',url:uri,dialogTitle:(o&&o.title)||''});
    }).then(function(){ return 'ok'; })
      .catch(function(e){ return isCancel(e) ? 'cancel' : 'fail'; });
  }

  // v315: テキストだけの共有（予定表を送る・道場に送る）。ファイルは要らないので Share だけ。
  //       これが無いと Android では共有シートが出ず、黙ってコピーに落ちていた。
  function shareText(o){
    var Sh=plugin('Share');
    if(!Sh) return Promise.resolve('fail');
    return Sh.share({title:(o&&o.title)||'',text:(o&&o.text)||'',dialogTitle:(o&&o.title)||''})
      .then(function(){ return 'ok'; })
      .catch(function(e){ return isCancel(e) ? 'cancel' : 'fail'; });
  }

  window.__nativeFile={ share:share, text:shareText };
})();
