/* Adds the Certificate of Incorporation to the About page's
   "Behind the name on the gate" section: a thumbnail card with the
   company's registration details, opening the full certificate in a lightbox. */
(function(){
  (function(){ if (!document.getElementById('sbc-enhance-css')){ var l=document.createElement('link'); l.id='sbc-enhance-css'; l.rel='stylesheet'; l.href='/sbc/enhance.css'; document.head.appendChild(l); } })();
  var IMG='/images/certificate-of-incorporation.jpg', HEAD='Behind the name on the gate';
  var ICON_SEAL='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-52.2,6.84-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg>';
  var ICON_ZOOM='<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M152,112a8,8,0,0,1-8,8H120v24a8,8,0,0,1-16,0V120H80a8,8,0,0,1,0-16h24V80a8,8,0,0,1,16,0v24h24A8,8,0,0,1,152,112Zm77.66,117.66a8,8,0,0,1-11.32,0l-50.06-50.07a88.11,88.11,0,1,1,11.31-11.31l50.07,50.06A8,8,0,0,1,229.66,229.66ZM112,184a72,72,0,1,0-72-72A72.08,72.08,0,0,0,112,184Z"></path></svg>';

  function card(){
    var d=document.createElement('div'); d.className='sbc-coi';
    d.innerHTML=
      '<button type="button" class="sbc-coi-thumb" aria-label="View the Certificate of Incorporation full size">'+
        '<img src="'+IMG+'" alt="Certificate of Incorporation of Mrityika Realters (OPC) Private Limited, issued by the Ministry of Corporate Affairs, Government of India" loading="lazy" decoding="async" width="1220" height="1584">'+
        '<span class="sbc-coi-zoom">'+ICON_ZOOM+'</span>'+
      '</button>'+
      '<div class="sbc-coi-body">'+
        '<span class="sbc-coi-tag">'+ICON_SEAL+'Registered with the Government of India</span>'+
        '<h3 class="font-display">Certificate of Incorporation</h3>'+
        '<p>Mrityika Realters (OPC) Private Limited is incorporated under the Companies Act, 2013, by the Ministry of Corporate Affairs.</p>'+
        '<dl>'+
          '<div><dt>Incorporated</dt><dd>28 January 2019</dd></div>'+
          '<div><dt>CIN</dt><dd>U45500WB2019OPC230083</dd></div>'+
          '<div><dt>Registered office</dt><dd>17A, Ganga Prasad Mukherjee Road, Kolkata 700025</dd></div>'+
        '</dl>'+
        '<div class="sbc-coi-actions">'+
          '<button type="button" class="sbc-coi-view">View certificate</button>'+
          '<a href="https://www.mca.gov.in" target="_blank" rel="noopener noreferrer">Verify on mca.gov.in</a>'+
        '</div>'+
      '</div>';
    d.querySelector('.sbc-coi-thumb').addEventListener('click',open);
    d.querySelector('.sbc-coi-view').addEventListener('click',open);
    return d;
  }

  function open(){
    if(document.querySelector('.sbc-coi-lb')) return;
    var prev=document.activeElement, lb=document.createElement('div');
    lb.className='sbc-coi-lb'; lb.setAttribute('role','dialog'); lb.setAttribute('aria-modal','true'); lb.setAttribute('aria-label','Certificate of Incorporation');
    lb.innerHTML='<button type="button" class="sbc-coi-close" aria-label="Close">&times;</button><img src="'+IMG+'" alt="Certificate of Incorporation of Mrityika Realters (OPC) Private Limited">';
    function close(){ document.removeEventListener('keydown',key); document.documentElement.style.overflow=''; lb.remove(); if(prev&&prev.focus) prev.focus(); }
    function key(e){ if(e.key==='Escape') close(); }
    lb.addEventListener('click',function(e){ if(e.target===lb||e.target.classList.contains('sbc-coi-close')) close(); });
    document.addEventListener('keydown',key);
    document.documentElement.style.overflow='hidden';
    document.body.appendChild(lb);
    lb.querySelector('.sbc-coi-close').focus();
  }

  function mount(){
    var h=[].find.call(document.querySelectorAll('h2'),function(x){ return x.textContent.indexOf(HEAD)>-1; });
    if(!h||h.parentElement.querySelector('.sbc-coi')) return;
    h.parentElement.appendChild(card());
  }
  function boot(){ mount(); new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true}); }
  if(document.readyState==='complete') setTimeout(boot,150); else window.addEventListener('load',function(){ setTimeout(boot,150); });
})();
