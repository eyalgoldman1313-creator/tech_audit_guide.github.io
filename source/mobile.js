(function(){
  var bar=document.querySelector('.progress i');
  function prog(){var h=document.documentElement;var p=h.scrollTop/((h.scrollHeight-h.clientHeight)||1);if(bar)bar.style.width=(p*100)+'%';}
  addEventListener('scroll',prog,{passive:true});prog();
  var body=document.body;
  function close(){body.classList.remove('sheet-open');}
  document.querySelectorAll('[data-sheet]').forEach(function(b){b.addEventListener('click',function(){
    var cur=null;document.querySelectorAll('section.chapter').forEach(function(s){if(s.getBoundingClientRect().top<200)cur=s.id;});
    document.querySelectorAll('.msheet details').forEach(function(d){d.open=d.dataset.ch===cur;});
    body.classList.add('sheet-open');
  });});
  var scrim=document.querySelector('.mscrim');if(scrim)scrim.addEventListener('click',close);
  document.querySelectorAll('.msheet a').forEach(function(a){a.addEventListener('click',function(e){
    var t=document.getElementById(a.getAttribute('href').slice(1));
    if(t){e.preventDefault();e.stopPropagation();close();setTimeout(function(){t.scrollIntoView({block:'start'});history.replaceState(null,'',a.getAttribute('href'));},250);}
  },true);});
  var s=document.querySelector('[data-search]');if(s)s.addEventListener('click',function(){var q=document.getElementById('q');scrollTo({top:0,behavior:'smooth'});setTimeout(function(){if(q)q.focus();},350);});
  var t=document.querySelector('[data-top]');if(t)t.addEventListener('click',function(){scrollTo({top:0,behavior:'smooth'});});
  addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
