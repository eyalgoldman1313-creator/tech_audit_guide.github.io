
(function(){
  // ===== Hamburger + mobile dropdowns =====
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  var navItems = document.querySelectorAll('.nav-item');

  hamburger.addEventListener('click', function(){
    var open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // On mobile, tapping a nav-item link with a dropdown should toggle the dropdown
  navItems.forEach(function(item){
    var trigger = item.querySelector(':scope > a');
    var dropdown = item.querySelector(':scope > .dropdown');
    if (!dropdown) return;
    trigger.addEventListener('click', function(e){
      if (window.matchMedia('(max-width:1180px)').matches){
        e.preventDefault();
        // Close others
        navItems.forEach(function(other){ if (other !== item) other.classList.remove('open'); });
        item.classList.toggle('open');
      }
    });
  });

  // Close mobile menu when a leaf link is clicked
  document.querySelectorAll('.dropdown a').forEach(function(a){
    a.addEventListener('click', function(){
      if (window.matchMedia('(max-width:1180px)').matches){
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded','false');
        navItems.forEach(function(item){ item.classList.remove('open'); });
      }
    });
  });

  // Close mobile menu on outside tap
  document.addEventListener('click', function(e){
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)){
      if (window.matchMedia('(max-width:1180px)').matches){
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded','false');
      }
    }
  });

  // ===== Reveal on scroll =====
  // Add .rv to elements that should fade in
  document.querySelectorAll('.standard, .ch-head').forEach(function(el){
    if (!el.classList.contains('rv')) el.classList.add('rv');
  });

  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {rootMargin:'0px 0px -6% 0px', threshold:0.05});
    document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function(el){ el.classList.add('in'); });
  }

  // ===== Active nav highlighting =====
  var sections = document.querySelectorAll('section.chapter, header.hero');
  var navAnchors = document.querySelectorAll('.nav-item > a');
  var linkByHash = {};
  navAnchors.forEach(function(a){
    var h = a.getAttribute('href');
    if (h && h.startsWith('#')) linkByHash[h.substring(1)] = a;
  });

  if ('IntersectionObserver' in window){
    var navIo = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          var id = e.target.id;
          Object.values(linkByHash).forEach(function(a){ a.classList.remove('active'); });
          var lnk = linkByHash[id] || linkByHash[id === 'top' ? 'top' : null];
          if (lnk) lnk.classList.add('active');
        }
      });
    }, {rootMargin:'-40% 0px -55% 0px'});
    sections.forEach(function(s){ navIo.observe(s); });
  }

  // ===== Smooth scroll for in-page anchors =====
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = this.getAttribute('href').substring(1);
      var t = document.getElementById(id);
      if (t){
        e.preventDefault();
        t.scrollIntoView({behavior:'smooth', block:'start'});
        history.replaceState(null,'',this.getAttribute('href'));
      }
    });
  });


  // ===== Search =====
  var q=document.getElementById('q'), res=document.getElementById('results'), IDX=window.__INDEX__||[], sel=-1;
  function norm(s){return (s||'').toLowerCase().replace(/[\u0591-\u05C7"'״׳]/g,'');}
  IDX.forEach(function(x){x._k=norm(x.t+' '+x.k);x._t=norm(x.t);});
  function render(){
    var v=norm(q.value.trim()); sel=-1;
    if(!v){res.hidden=true;res.innerHTML='';return;}
    var terms=v.split(/\s+/);
    function ws(str,t){var i=str.indexOf(t);while(i>-1){if(i===0||/[\s(,.\-\/:]/.test(str[i-1]))return true;i=str.indexOf(t,i+1);}return false;}
    function score(x){var s=0;if(x._t.indexOf(v)>-1)s+=20;terms.forEach(function(t){if(ws(x._t,t))s+=6;else if(x._t.indexOf(t)>-1)s+=2;if(ws(x._k,t))s+=2;});return s;}
    var hits=IDX.filter(function(x){return terms.every(function(t){return x._k.indexOf(t)>-1;});})
      .map(function(x){return [score(x),x];}).sort(function(a,b){return b[0]-a[0];}).map(function(p){return p[1];}).slice(0,12);
    res.innerHTML=hits.length?hits.map(function(h){return '<a href="#'+h.id+'">'+h.t+'<small>'+h.c+'</small></a>';}).join(''):'<div class="none">לא נמצאו תוצאות</div>';
    res.hidden=false;
  }
  q.addEventListener('input',render);
  q.addEventListener('keydown',function(e){
    var as=res.querySelectorAll('a'); if(!as.length) return;
    if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,as.length-1);}
    else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);}
    else if(e.key==='Enter'){e.preventDefault();(as[sel>-1?sel:0]).click();return;}
    else if(e.key==='Escape'){res.hidden=true;return;}
    as.forEach(function(a,i){a.classList.toggle('sel',i===sel);});
  });
  res.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;e.preventDefault();var t=document.getElementById(a.getAttribute('href').slice(1));res.hidden=true;if(t){t.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',a.getAttribute('href'));t.classList.add('in');}});
  document.addEventListener('click',function(e){if(!e.target.closest('.search-box'))res.hidden=true;});

  // ===== Back to top =====
  var b2t = document.getElementById('b2t');
  b2t.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  window.addEventListener('scroll', function(){
    b2t.classList.toggle('on', window.scrollY > 600);
  }, {passive:true});
})();
