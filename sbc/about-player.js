/* Swaps the About page video for the interactive 3D walkthrough of
   Shantiban City (hosted on EdgeOne), opening on its entry screen.
   The iframe is lazy, so it only loads as the section nears the viewport. */
(function(){
  /* keep the shared stylesheet in <head> even if the app re-renders <body> */
  (function(){ if (!document.getElementById('sbc-enhance-css')){ var l=document.createElement('link'); l.id='sbc-enhance-css'; l.rel='stylesheet'; l.href='/sbc/enhance.css?v=3d2'; document.head.appendChild(l); } })();
  var VID="Untitled_Scene_09-20_13_22_43_20260920205922", URL3D='https://shantiban-city-3d.edgeone.cool/';
  var ICON_FS='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M220,48V88a12,12,0,0,1-24,0V60H168a12,12,0,0,1,0-24h40A12,12,0,0,1,220,48ZM88,196H60V168a12,12,0,0,0-24,0v40a12,12,0,0,0,12,12H88a12,12,0,0,0,0-24Zm120-40a12,12,0,0,0-12,12v28H168a12,12,0,0,0,0,24h40a12,12,0,0,0,12-12V168A12,12,0,0,0,208,156ZM88,36H48A12,12,0,0,0,36,48V88a12,12,0,0,0,24,0V60H88a12,12,0,0,0,0-24Z"/></svg>';
  var ICON_OUT='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M228,104a12,12,0,0,1-24,0V69l-59.51,59.51a12,12,0,0,1-17-17L187,52H152a12,12,0,0,1,0-24h64a12,12,0,0,1,12,12Zm-44,24a12,12,0,0,0-12,12v64H52V84h64a12,12,0,0,0,0-24H48A20,20,0,0,0,28,80V208a20,20,0,0,0,20,20H176a20,20,0,0,0,20-20V140A12,12,0,0,0,184,128Z"/></svg>';
  var TPL=
    '<iframe src="'+URL3D+'" title="Shantiban City interactive 3D walkthrough" loading="lazy" allow="fullscreen; autoplay; accelerometer; gyroscope" allowfullscreen></iframe>'+
    '<div class="sbc-3d-tools">'+
      '<a href="'+URL3D+'" target="_blank" rel="noopener" aria-label="Open the walkthrough in a new tab" title="Open in a new tab">'+ICON_OUT+'</a>'+
      '<button type="button" aria-label="Toggle Fullscreen" title="Full screen">'+ICON_FS+'</button>'+
    '</div>';
  function mount(){
    var v=document.querySelector('video[src*="'+VID+'"]'); if(!v) return;
    var w=v.parentElement; if(!w||w.querySelector('.sbc-3d')) return;
    /* keep the video element (React owns it) but stop it, unload it and hide it */
    v.removeAttribute('autoplay'); v.autoplay=false; v.loop=false; v.pause();
    v.removeAttribute('src'); v.load(); v.style.display='none';
    var box=document.createElement('div'); box.className='sbc-3d'; box.innerHTML=TPL;
    w.appendChild(box); w.setAttribute('data-sbc-3d','1');
    box.querySelector('button').addEventListener('click',function(){ var d=document;
      if(d.fullscreenElement||d.webkitFullscreenElement){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); }
      else { var r=w.requestFullscreen||w.webkitRequestFullscreen; if(r) r.call(w); else window.open(URL3D,'_blank','noopener'); } });
  }
  function boot(){ mount(); new MutationObserver(function(){ var v=document.querySelector('video[src*="'+VID+'"]'); if(v&&v.parentElement&&!v.parentElement.querySelector('.sbc-3d')) mount(); }).observe(document.documentElement,{childList:true,subtree:true}); }
  if(document.readyState==='complete') setTimeout(boot,150); else window.addEventListener('load',function(){ setTimeout(boot,150); });
})();
