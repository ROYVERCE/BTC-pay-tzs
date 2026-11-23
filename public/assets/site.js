(function(){
var $=function(s,r){return(r||document).querySelector(s)},$a=function(s,r){return[].slice.call((r||document).querySelectorAll(s))}
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches,root=document.documentElement
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}}
window.toast=function(m){var t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},2800)}
function resolve(m){return m==="light"||m==="dark"?m:(matchMedia("(prefers-color-scheme:light)").matches?"light":"dark")}
window.setTheme=function(m){store("btcpay-theme",m);root.dataset.theme=resolve(m);var mc=$('meta[name="theme-color"]');if(mc)mc.content=root.dataset.theme==="light"?"#FFFFFF":"#0E0E10";$a("[data-theme-set]").forEach(function(b){b.classList.toggle("on",b.dataset.themeSet===m)})}
$a(".theme-btn").forEach(function(b){b.onclick=function(){setTheme(root.dataset.theme==="light"?"dark":"light")}})
$a("[data-theme-set]").forEach(function(b){b.onclick=function(){setTheme(b.dataset.themeSet)}})
setTheme(store("btcpay-theme")||"system")
var dr=$("#drawer"),bg=$("#burger")
function setDrawer(o){if(!dr)return;dr.classList.toggle("open",o);dr.setAttribute("aria-hidden",!o);if(bg)bg.setAttribute("aria-expanded",o);document.body.style.overflow=o?"hidden":"";if(o)$(".ib",dr).focus();else if(bg)bg.focus()}
window.setDrawer=setDrawer
if(bg)bg.onclick=function(){setDrawer(true)}
$a("[data-close]").forEach(function(b){b.onclick=function(){setDrawer(false)}})
addEventListener("keydown",function(e){if(e.key==="Escape")setDrawer(false)})
var ck=$("#cookie")
if(ck){if(!store("btcpay-cookies"))setTimeout(function(){ck.classList.add("show")},900)
$("#cookieOk").onclick=function(){store("btcpay-cookies","essential");ck.classList.remove("show")}}
var fab=$("#fab"),hc=$("#heroCta")
if(fab&&hc&&"IntersectionObserver"in window)new IntersectionObserver(function(es){var e=es[0];fab.classList.toggle("show",!e.isIntersecting&&e.boundingClientRect.top<0)}).observe(hc)
var f=$("#contactForm")
if(f)f.onsubmit=function(e){e.preventDefault()
var n=$("#cn").value.trim(),m=$("#ce").value.trim(),t=$("#cm").value.trim(),er=$("#cerr")
if(n.length<2||!/^\S+@\S+\.\S+$/.test(m)||t.length<10){er.textContent="Enter your name, a valid email and a message of at least 10 characters.";return}
er.textContent="";location.href="mailto:classicroykizzy@gmail.com?subject="+encodeURIComponent("BTC Pay support: "+n)+"&body="+encodeURIComponent(t+"\n\nFrom: "+n+" <"+m+">");toast("Opening your email app")}
/* converter */
var cv=$("#cv")
if(cv){var uT=$("#uT"),uS=$("#uS"),uB=$("#uB"),note=$("#rateNote"),rate=0,cur=[0,0],units=$a(".u",cv.closest(".conv")),k=0,hold=false
var fmt=function(n){return Math.round(n).toLocaleString("en-US")}
function tween(el,i,to,f){var from=cur[i];cur[i]=to;if(rm||from===to){el.textContent=f(to);return}var t0=performance.now();(function s(t){var p=Math.min((t-t0)/350,1),v=from+(to-from)*(1-Math.pow(1-p,3));el.textContent=f(v);if(p<1)requestAnimationFrame(s)})(t0)}
function calc(){var tzs=parseInt(cv.value.replace(/\D/g,""),10)||0;tween(uT,0,tzs,fmt)
if(!rate||!tzs){uS.textContent="—";uB.textContent="—";cur[1]=cur[2]=0;return}
var sats=tzs/rate*1e8;tween(uS,1,sats,fmt);tween(uB,2,sats/1e8,function(v){return v.toFixed(8)})}
cv.oninput=calc;cv.onfocus=function(){hold=true};cv.onblur=function(){hold=false}
var c;try{c=JSON.parse(sessionStorage.getItem("btcpay-rate")||"null")}catch(e){}
function got(r){rate=r;note.textContent="Indicative rate";calc()}
if(c&&Date.now()-c.t<6e5)got(c.v);else{note.textContent="Loading rate";fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=tzs").then(function(r){return r.json()}).then(function(j){var v=j.bitcoin&&j.bitcoin.tzs;if(!v)throw 0;try{sessionStorage.setItem("btcpay-rate",JSON.stringify({v:v,t:Date.now()}))}catch(e){}got(v)}).catch(function(){note.textContent="Rate unavailable right now"})}
calc()
if(!rm)setInterval(function(){if(hold||document.hidden)return;units.forEach(function(u,i){u.classList.toggle("on",i===k%3)});k++},1500)}
})()
