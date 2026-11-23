(function(){
var $=function(s,r){return(r||document).querySelector(s)},$a=function(s,r){return[].slice.call((r||document).querySelectorAll(s))}
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches
window.toast=function(m){var t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},3000)}
var dr=$("#drawer"),bg=$("#burger")
function setDrawer(o){if(!dr)return;dr.classList.toggle("open",o);dr.setAttribute("aria-hidden",!o);if(bg)bg.setAttribute("aria-expanded",o);document.body.style.overflow=o?"hidden":"";if(o)$(".xbtn",dr).focus();else if(bg)bg.focus()}
if(bg)bg.onclick=function(){setDrawer(true)}
$a("[data-close]",dr||document).forEach(function(b){b.onclick=function(){setDrawer(false)}})
addEventListener("keydown",function(e){if(e.key==="Escape")setDrawer(false)})
window.setDrawer=setDrawer
var ck=$("#cookie")
if(ck){var seen;try{seen=localStorage.getItem("btcpay-cookies")}catch(e){}
if(!seen)setTimeout(function(){ck.classList.add("show")},1200)
$("#cookieOk").onclick=function(){try{localStorage.setItem("btcpay-cookies","essential")}catch(e){}ck.classList.remove("show")}}
var st=$(".stage")
if(st&&!rm&&matchMedia("(pointer:fine)").matches){var c=$(".hero-coin .in",st),ch=$a(".chip",st)
st.addEventListener("pointermove",function(e){var r=st.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5
st.style.setProperty("--mx",x);ch.forEach(function(n,i){n.style.transform="translate("+(x*(i+1)*-18)+"px,"+(y*(i+1)*-18)+"px)"})
if(c){c.style.setProperty("--rx",(-y*18)+"deg")}})
st.addEventListener("pointerleave",function(){ch.forEach(function(n){n.style.transform=""});if(c)c.style.setProperty("--rx","0deg")})}
if("IntersectionObserver"in window){var o=new IntersectionObserver(function(es){es.forEach(function(n){if(n.isIntersecting){n.target.classList.add("vis");o.unobserve(n.target)}})},{threshold:.12})
$a(".rv").forEach(function(e,i){e.style.transitionDelay=(i%3)*90+"ms";o.observe(e)})}else $a(".rv").forEach(function(e){e.classList.add("vis")})
var f=$("#contactForm")
if(f)f.onsubmit=function(e){e.preventDefault()
var n=$("#cn").value.trim(),m=$("#ce").value.trim(),t=$("#cm").value.trim(),er=$("#cerr")
if(n.length<2||!/^\S+@\S+\.\S+$/.test(m)||t.length<10){er.textContent="Enter your name, a valid email and a message of at least 10 characters.";return}
er.textContent="";location.href="mailto:classicroykizzy@gmail.com?subject="+encodeURIComponent("BTC Pay support: "+n)+"&body="+encodeURIComponent(t+"\n\nFrom: "+n+" <"+m+">");toast("Opening your email app")}
})()
