/* Adds the second phone number and the email address next to the main
   number wherever the site shows it (Contact page card, footer). Each is a
   clone of the existing "Call" link, so it keeps that spot's styling. */
(function(){
  var TEL='tel:+919150568165', SHOWN='+91 91505 68165';
  var TEL2='tel:+918974332863', SHOWN2='+91 89743 32863';
  var EMAIL='connect@mrityikaestates.com';
  var MAIL_PATH='M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z';

  function textEl(a,txt){ return [].find.call(a.querySelectorAll('span'),function(s){ return s.children.length===0&&s.textContent.trim()===txt; }); }
  function variant(a,href,shown,label,path){
    var c=a.cloneNode(true); c.href=href; c.setAttribute('data-sbc-extra','');
    textEl(c,SHOWN).textContent=shown;
    var l=textEl(c,'Call'); if(l) l.textContent=label;
    if(path){ var p=c.querySelector('svg path'); if(p) p.setAttribute('d',path); }
    return c;
  }
  function mount(){
    [].forEach.call(document.querySelectorAll('a[href="'+TEL+'"]:not([data-sbc-extra])'),function(a){
      if(!textEl(a,SHOWN)||a.parentElement.querySelector('[data-sbc-extra]')) return;
      var two=variant(a,TEL2,SHOWN2,'Call'), mail=variant(a,'mailto:'+EMAIL,EMAIL,'Email',MAIL_PATH);
      mail.style.overflowWrap='anywhere';
      a.after(two,mail);
    });
  }
  function boot(){ mount(); new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true}); }
  if(document.readyState==='complete') setTimeout(boot,150); else window.addEventListener('load',function(){ setTimeout(boot,150); });
})();
