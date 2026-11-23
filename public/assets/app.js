(function(){
var $=function(s){return document.querySelector(s)},$a=function(s){return[].slice.call(document.querySelectorAll(s))}
var st={},poll=null,tick=null,pay=null,qt=null,key=null,view="home"
var OKI='<svg class="i" aria-hidden="true"><use href="#i-send"/></svg>'
function api(p,m,b,h){var o={method:m||"GET",credentials:"same-origin",headers:Object.assign({"Content-Type":"application/json"},h||{})};if(b)o.body=JSON.stringify(b)
return fetch(p,o).then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok,status:r.status,data:d}})}).catch(function(){return{ok:false,status:0,data:{error:{message:"Network error. Check your connection."}}}})}
function msg(r){return(r.data&&r.data.error&&r.data.error.message)||"Something went wrong. Try again."}
function tab(t){["create","login"].forEach(function(k){$("#t-"+k).hidden=k!==t});$a(".seg button").forEach(function(b){var on=b.dataset.tab===t;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});history.replaceState(null,"","#"+t)}
$a(".seg button").forEach(function(b){b.onclick=function(){tab(b.dataset.tab)}})
tab(location.hash==="#login"?"login":"create")
$("#mk").onclick=function(){var n=$("#dn").value.trim();if(n.length<2){$("#cerr").textContent="Enter a display name of at least 2 characters.";return}
$("#mk").disabled=true;api("/api/wallet/create","POST",{displayName:n}).then(function(r){$("#mk").disabled=false
if(!r.ok){$("#cerr").textContent=msg(r);return}
st.name=r.data.displayName;st.id=r.data.walletId;$("#wid").textContent=st.id;$("#c1").hidden=true;$("#c2").hidden=false})}
function copy(t,m){try{navigator.clipboard.writeText(t).then(function(){toast(m)})}catch(e){toast("Copy not available")}}
$("#cp").onclick=function(){copy(st.id,"Wallet ID copied")}
$("#dl").onclick=function(){var b=new Blob(["BTC Pay wallet ID: "+st.id+"\nKeep this private. It cannot be recovered."],{type:"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="btc-pay-wallet.txt";a.click()}
$("#ck").onchange=function(){$("#go").disabled=!$("#ck").checked}
$("#go").onclick=function(){enter(st.name,st.id)}
$("#lg").onclick=function(){var v=$("#wi").value.trim().toUpperCase()
if(!/^BTC-\d{16}$/.test(v)){$("#aerr").textContent="Enter a wallet ID like BTC-0000000000000000.";return}
$("#lg").disabled=true;$("#aerr").textContent="";api("/api/wallet/login","POST",{walletId:v}).then(function(r){
if(!r.ok){$("#lg").disabled=false;$("#aerr").textContent=msg(r);return}
return api("/api/wallet/me").then(function(m){$("#lg").disabled=false;$("#wi").value="";enter(m.data.displayName,m.data.walletId)})})}
function enter(n,id){st.name=n;st.id=id;$("#dname").textContent=n;$("#dwid").textContent=id;$("#av").textContent=n.charAt(0).toUpperCase()
$("#auth").hidden=true;$("#app").hidden=false;$("#tabbar").hidden=false;show("home");scrollTo(0,0)}
$("#out").onclick=function(){stopPoll();api("/api/wallet/logout","POST").then(function(){st={};$("#app").hidden=true;$("#tabbar").hidden=true;$("#fabSend").hidden=true;$("#auth").hidden=false;$("#c1").hidden=false;$("#c2").hidden=true;$("#dn").value="";$("#ck").checked=false;$("#go").disabled=true;tab("login")})}
api("/api/wallet/me").then(function(r){if(r.ok)enter(r.data.displayName,r.data.walletId)})
function show(v){if(v!=="send")stopPoll();view=v
["home","send","air","act"].forEach(function(k){var e=$("#v-"+k);e.hidden=k!==v;if(k===v){e.classList.remove("in");void e.offsetWidth;e.classList.add("in")}})
$a("[data-v]").forEach(function(b){if(b.classList.contains("ni")||b.closest("#tabbar"))b.classList.toggle("on",b.dataset.v===v)})
$("#fabSend").hidden=v==="send";if(v==="send")step(1);if(v==="home"||v==="act")loadTx();scrollTo({top:0})}
$a("[data-v]").forEach(function(b){b.onclick=function(){if(b.dataset.v==="send"&&view!=="send")resetSend();show(b.dataset.v)}})
$("#fabSend").onclick=function(){resetSend();show("send")}
$("#cwid").onclick=function(){copy(st.id,"Wallet ID copied")}
function resetSend(){["sp","si","ss","sa"].forEach(function(i){$("#"+i).value=""});$("#serr").textContent=""}
function step(n){["s1","s2","s3"].forEach(function(k,i){$("#"+k).hidden=i!==n-1})}
var lab={pending_payment:"Waiting",paid_processing:"Processing",delivered:"Delivered",expired:"Expired",failed:"Failed"}
function loadTx(){api("/api/transactions").then(function(r){var t=(r.data&&r.data.transactions)||[]
[["#txh",3],["#txa",50]].forEach(function(p){var b=$(p[0]);b.innerHTML="";if(!t.length){var e=document.createElement("div");e.className="empty";e.textContent="No payments yet. Send BTC to M-Pesa and it will appear here.";b.appendChild(e);return}
t.slice(0,p[1]).forEach(function(x){var r=document.createElement("div");r.className="row";r.innerHTML='<span class="ic">'+OKI+'</span><div class="m"><b></b><small></small></div><div style="text-align:right;display:grid;gap:6px;justify-items:end"><b class="a"></b><span class="pill"></span></div>'
r.querySelector(".m b").textContent="Send BTC to "+x.recipient;r.querySelector("small").textContent=new Date(x.createdAt).toLocaleString();r.querySelector(".a").textContent=x.amountTzs.toLocaleString()+" TZS"
var s=r.querySelector(".pill");s.className="pill "+x.status;s.textContent=lab[x.status]||x.status;b.appendChild(r)})})})}
var phoneRe=/^(07(4[0-9]|5[0-9]|6[0-9]|9[0-9])|255(74|75|76|79))\d{7}$/
function norm(s){var x=s.replace(/[\s\-().]/g,"").replace(/^\+/,"");if(/^0\d{9}$/.test(x))return"255"+x.slice(1);if(/^255\d{9}$/.test(x))return x;return null}
function fmtT(ms){if(ms<=0)return"0:00";var s=Math.floor(ms/1000);return Math.floor(s/60)+":"+("0"+s%60).slice(-2)}
$("#sf").onsubmit=function(e){e.preventDefault()
var ph=$("#sp").value.trim(),ini=$("#si").value.trim().replace(/\./g,"").toUpperCase(),sur=$("#ss").value.trim(),amt=parseInt($("#sa").value.replace(/[, ]/g,""),10),er=$("#serr")
if(!ph||!ini||!sur||!amt){er.textContent="Enter the M-Pesa number, initial, surname and amount.";return}
var p=norm(ph);if(!p||!phoneRe.test(p)){er.textContent="Only Vodacom M-Pesa numbers (0740 to 0769, 0790 to 0799) are supported.";return}
if(!/^[A-Z]{1,3}$/.test(ini)){er.textContent="Initial must be 1 to 3 letters, for example J.";return}
if(!/^[A-Za-z' -]{2,40}$/.test(sur)){er.textContent="Enter the surname using letters only.";return}
if(amt<2500||amt>100000){er.textContent="Amount must be between 2,500 and 100,000 TZS.";return}
er.textContent="";$("#getq").disabled=true
var body={phone:ph,amountTzs:amt,recipientInitial:ini,recipientSurname:sur}
api("/api/payments/quote","POST",body).then(function(r){$("#getq").disabled=false
if(!r.ok){er.textContent=msg(r);return}
qt={body:body,name:ini+". "+sur,exp:new Date(r.data.quoteExpiresAt).getTime()};key=crypto.randomUUID()
$("#q-r").textContent=qt.name+" · "+r.data.recipient;$("#q-t").textContent=r.data.amountTzs.toLocaleString()+" TZS";$("#q-f").textContent=r.data.providerFeePercent+"%"
$("#q-s").textContent="≈ "+r.data.estimatedSats.toLocaleString()+" sats";$("#gerr").textContent="";step(2)
clearInterval(tick);tick=setInterval(function(){var l=qt.exp-Date.now();$("#q-e").textContent=fmtT(l);if(l<=0){clearInterval(tick);$("#gerr").textContent="Quote expired. Press Edit to get a new one."}},500)})}
$("#req").onclick=function(){clearInterval(tick);step(1)}
$("#gen").onclick=function(){if(Date.now()>qt.exp){$("#gerr").textContent="Quote expired. Press Edit to get a new one.";return}
$("#gen").disabled=true;api("/api/payments/generate","POST",qt.body,{"Idempotency-Key":key}).then(function(r){$("#gen").disabled=false
if(!r.ok){$("#gerr").textContent=msg(r);return}
clearInterval(tick);pay=r.data;render();step(3);startPoll()})}
function render(){$("#qr").innerHTML="";new QRCode($("#qr"),{text:"lightning:"+pay.invoice,width:220,height:220,correctLevel:QRCode.CorrectLevel.L})
$("#p-s").textContent=pay.amountSats.toLocaleString()+" sats";$("#p-t").textContent=pay.amountTzs.toLocaleString()+" TZS";$("#p-r").textContent=qt.name;$("#inv").textContent=pay.invoice
$("#open").href="lightning:"+pay.invoice;$("#pbody").hidden=false;$("#pdone").hidden=true;$("#pfoot").hidden=true;setStatus(pay.status,{})}
$("#cinv").onclick=function(){copy(pay.invoice,"Invoice copied")}
$("#again").onclick=function(){resetSend();show("send")}
function setStatus(s,x){var m={pending_payment:"Waiting for Bitcoin payment",paid_processing:"Bitcoin received. M-Pesa payout processing",delivered:"M-Pesa delivered",expired:"Payment expired",failed:"Payment failed"}
$("#pst").textContent=m[s]||s;var n=$("#pnote");n.innerHTML="";var sp=document.createElement("span"),b=document.createElement("b")
sp.textContent=x.needsSupport?"This is taking longer than usual. Contact support with reference ":x.providerUnavailable?"Status check is delayed, your payment is safe. Reference ":"Support reference: ";b.textContent=pay.supportRef;sp.appendChild(b);n.appendChild(sp)
if(s!=="pending_payment")$("#pbody").hidden=true
if(s==="delivered"){var d=$("#pdone");d.hidden=false;d.innerHTML='<svg class="ring-ok" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30"/><path d="M22 37l10 10 18-21"/></svg>';var p=document.createElement("p");p.className="muted";p.textContent=(x.amountTzs||pay.amountTzs).toLocaleString()+" TZS delivered to "+qt.name+(x.receipt?". Receipt "+x.receipt+".":".");d.appendChild(p)}
if(s==="delivered"||s==="expired"||s==="failed")$("#pfoot").hidden=false}
function startPoll(){stopPoll();var ex=new Date(pay.expiresAt).getTime();tick=setInterval(function(){$("#p-e").textContent=fmtT(ex-Date.now())},500);poll=setInterval(check,5000);setTimeout(check,2000)}
function check(){if(!pay)return;api("/api/payments/status/"+pay.id).then(function(r){if(!r.ok)return;setStatus(r.data.status,r.data);if(["delivered","expired","failed"].indexOf(r.data.status)>-1)stopPoll()})}
function stopPoll(){clearInterval(poll);clearInterval(tick)}
})()
