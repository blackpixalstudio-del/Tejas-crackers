const LS={d:{},subs:[]};
function persist(){clearTimeout(persist.t);persist.t=setTimeout(()=>kvSet('data',LS.d),200);LS.subs.forEach(f=>f())}
const snap=(id,data)=>({id,exists:data!==undefined,data:()=>data});
const mk=(c,id)=>({id,get:async()=>snap(id,(LS.d[c]||{})[id]),set:async d=>{(LS.d[c]=LS.d[c]||{})[id]=JSON.parse(JSON.stringify(d));persist()},update:async d=>{const o=LS.d[c]||{};if(!o[id])throw new Error('Record not found');Object.assign(o[id],d);persist()},delete:async()=>{if(LS.d[c])delete LS.d[c][id];persist()},acquire:async()=>({acquired:true}),onSnapshot:n=>{const f=()=>n(snap(id,(LS.d[c]||{})[id]));LS.subs.push(f);setTimeout(f);return()=>{}}});
const colRef=c=>({doc:id=>mk(c,id),add:async d=>{const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);await mk(c,id).set(d);return{id}},onSnapshot:n=>{const f=()=>{const o=LS.d[c]||{};n({docs:Object.keys(o).map(id=>snap(id,o[id]))})};LS.subs.push(f);setTimeout(f);return()=>{}}});
const localdb={doc:p=>{const[c,i]=p.split('/');return mk(c,i)},collection:colRef};
function backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(snapNow())],{type:'application/json'}));a.download='shop-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
function restore(f){if(!f)return;const r=new FileReader();r.onload=e=>{try{applyBackup(JSON.parse(e.target.result))}catch(x){toast('Invalid backup file')}};r.readAsText(f)}
const $=s=>document.querySelector(s);
const E=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const S={view:'dash',dp:'week',doff:0,products:[],invoices:[],moves:[],images:[],shop:{bkOn:true,bkMin:1,bkKeep:10,name:'My Cracker Shop',sym:'₹',cc:'91',low:10,color:'#16a34a',rw:'80',foot:'Thank you, visit again!',next:1,pay:'Cash,UPI,Card'},cart:[],q:'',imp:null,db:null,can:false,uid:'u',busy:false};
const M=n=>(S.shop.sym||'₹')+(Math.round((+n||0)*100)/100).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const THEMES={blue:{bg:'#171b66',card:'#1f2584',tx:'#ffffff',mu:'#b9c0f5',bd:'#3d44b0',side:'#0e1248',stx:'#dfe3ff',btn:'#f6b92d',btx:'#1b1b57',gold:'#ffd04a',ok:'#4ade80',warn:'#fb923c',bad:'#ff7b7b'},
dark:{bg:'#111318',card:'#1b1f27',tx:'#e8edf5',mu:'#93a0b4',bd:'#2a3140',side:'#0b0d11',stx:'#c9d1de',btn:'#f6b92d',btx:'#111111',gold:'#f6b92d',ok:'#4ade80',warn:'#fb923c',bad:'#ff7b7b'},
light:{bg:'#f4f6f9',card:'#ffffff',tx:'#1b2430',mu:'#6b7686',bd:'#e3e8ef',side:'#16213a',stx:'#cbd5e1',btn:'#16a34a',btx:'#ffffff',gold:'#16213a',ok:'#16a34a',warn:'#ea580c',bad:'#dc2626'}};
const TL={bg:'Background',card:'Cards / panels',tx:'Text',mu:'Muted text',bd:'Borders',side:'Sidebar',stx:'Sidebar text',btn:'Buttons',btx:'Button text',gold:'Headings / highlights',ok:'Success',warn:'Low-stock warning',bad:'Out-of-stock / error'};
function applyTheme(o){const T={...THEMES.blue,...(S.shop.theme||{}),...(o||{})};for(const k in T)document.documentElement.style.setProperty('--'+k,T[k])}
function pvTheme(){const o={};Object.keys(TL).forEach(k=>{const e=$('#t_'+k);if(e)o[k]=e.value});applyTheme(o)}
function preset(n){Object.keys(TL).forEach(k=>{const e=$('#t_'+k);if(e)e.value=THEMES[n][k]});pvTheme()}
applyTheme();
const kvo=()=>new Promise((r,j)=>{const q=indexedDB.open('crackerpos',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});
const kvGet=async k=>{try{const d=await kvo();return await new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(undefined)})}catch(e){return undefined}};
const kvSet=async(k,v)=>{try{const d=await kvo();await new Promise(r=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=r;t.onerror=r})}catch(e){}};
async function toData(f,max,q,png){return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));const x=c.getContext('2d');if(!png){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}x.drawImage(im,0,0,c.width,c.height);res(c.toDataURL(png?'image/png':'image/jpeg',q))};im.onerror=()=>rej(new Error('Not a valid image'));im.src=r.result};r.onerror=()=>rej(new Error('Could not read file'));r.readAsDataURL(f)})}
async function prep(f,max){if(!f||!/^image\//.test(f.type))throw new Error('Please choose an image file');if(f.size>15e6)throw new Error('Image is too large (max 15 MB)');const png=f.type=='image/png';let m=max,d=await toData(f,m,.82,png);while(d.length>220000&&m>150){m=Math.round(m*.75);d=await toData(f,m,.7,png)}return d}
function dskImg(f){wfile('Images',Date.now()+'-'+String(f.name||'image').replace(/[^\w.\-]/g,'_'),f).catch(()=>{})}
function grabEdit(){['code','name','category','unit','cost','price','mrp','stock','reorder','barcode','hsn','gst'].forEach(k=>{const e=$('#e_'+k);if(e)S.edit[k]=e.value});const r=$('#e_restricted'),a=$('#e_active');if(r)S.edit.restricted=r.checked;if(a)S.edit.active=a.checked}
async function pickImg(f){if(!f)return;try{const d=await prep(f,500);grabEdit();S.edit.img=d;dskImg(f);render()}catch(e){toast(e.message)}}
function dropImg(e){e.preventDefault();e.currentTarget.classList.remove('hov');pickImg(e.dataTransfer.files[0])}
async function upImgs(fs){for(const f of fs){try{await col('images').add({name:f.name,data:await prep(f,800),at:Date.now()});dskImg(f);toast('Image added')}catch(e){toast(f.name+': '+e.message)}}}
async function setLogo(id){try{const i=S.images.find(x=>x.id==id),b=await (await fetch(i.data)).blob();await S.db.doc('cfg/shop').set({...S.shop,logo:await prep(b,300)});toast('Logo updated')}catch(e){toast(e.message)}}
async function setLogoF(f){if(!f)return;try{const d=await prep(f,300);await S.db.doc('cfg/shop').set({...S.shop,logo:d});await col('images').add({name:f.name,data:d,at:Date.now()});dskImg(f);toast('Logo updated')}catch(e){toast(e.message)}}
async function rmLogo(){const d={...S.shop};delete d.logo;await S.db.doc('cfg/shop').set(d);S.shop.logo=null;render()}
async function delImg(id){if(confirm('Delete this image?'))await col('images').doc(id).delete()}
const arr=v=>Array.isArray(v)?v:Object.entries(v||{}).map(([id,o])=>({id,...o}));
function snapNow(){return{v:2,at:Date.now(),shop:S.shop,products:S.products,invoices:S.invoices,moves:S.moves,images:S.images}}
async function doBackup(force){
  if(!S.ready)return;const d=snapNow();delete d.at;const sig=JSON.stringify(d);if(!force&&sig===S.bsig)return;
  S.bsig=sig;const at=Date.now(),l=(await kvGet('bk'))||[];l.unshift({at,d});l.length=Math.min(l.length,Math.max(1,+S.shop.bkKeep||10));await kvSet('bk',l);S.bat=at;S.bl=l.map(x=>x.at);
  if(S.dir&&S.dirOk)try{await wfile('Backups','shop-backup-latest.json',sig);await wfile('Backups','shop-backup-'+new Date(at).toISOString().slice(0,10)+'.json',sig)}catch(e){S.dirOk=false}
  if(S.view=='set'&&!document.activeElement?.matches?.('input,select'))render()
}
function bkTimer(){clearInterval(bkTimer.t);if(S.shop.bkOn===false)return;bkTimer.t=setInterval(()=>doBackup(),Math.max(1,+S.shop.bkMin||1)*60000)}
async function applyBackup(b){
  const sh=b.shop||(b.cfg&&b.cfg.shop);if(!confirm('Replace ALL current data with this backup?'))return;
  try{for(const c of ['products','invoices','moves','images']){const items=arr(b[c]),keep=new Set(items.map(x=>x.id));
    for(const x of (S[c]||[]))if(!keep.has(x.id))await col(c).doc(x.id).delete();
    for(const {id,...r} of items)await col(c).doc(id).set(r)}
    if(sh)await S.db.doc('cfg/shop').set(sh);toast('Backup restored')}catch(e){toast('Restore failed: '+e.message)}
}
async function restoreSnap(){const l=await kvGet('bk'),i=+$('#snp').value;if(l&&l[i])applyBackup(l[i].d)}
async function wfile(sub,name,data){if(!S.dir||!S.dirOk)return;const d=await S.dir.getDirectoryHandle(sub,{create:true}),f=await d.getFileHandle(name,{create:true}),w=await f.createWritable();await w.write(data);await w.close()}
async function pickDir(){try{const h=await showDirectoryPicker({mode:'readwrite'});S.dir=h;S.dirOk=true;await kvSet('dir',h);await h.getDirectoryHandle('Backups',{create:true});await h.getDirectoryHandle('Images',{create:true});toast('Folder connected (Backups and Images)');doBackup(true)}catch(e){toast(window.showDirectoryPicker?'Folder not connected':'Folder access needs Chrome or Edge on a computer')}render()}
async function allowDir(){try{S.dirOk=(await S.dir.requestPermission({mode:'readwrite'}))=='granted'}catch(e){}render()}

function prange(p,off){
  const n=new Date(),Y=n.getFullYear(),Mo=n.getMonth(),D=n.getDate(),bk=[],L=(d,o)=>d.toLocaleDateString('en-IN',o);let a,b,t;
  if(p=='day'){a=new Date(Y,Mo,D+off);b=new Date(Y,Mo,D+off+1);for(let h=0;h<24;h++)bk.push({l:h%4==0?h+':00':'',s:+new Date(Y,Mo,D+off,h),e:+new Date(Y,Mo,D+off,h+1)});t=L(a,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
  else if(p=='week'){const w=(n.getDay()+6)%7;a=new Date(Y,Mo,D-w+7*off);b=new Date(Y,Mo,D-w+7*off+7);for(let i=0;i<7;i++){const x=new Date(a.getFullYear(),a.getMonth(),a.getDate()+i);bk.push({l:L(x,{weekday:'short'}),s:+x,e:+new Date(x.getFullYear(),x.getMonth(),x.getDate()+1)})}t=L(a,{day:'numeric',month:'short'})+' – '+L(new Date(+b-864e5),{day:'numeric',month:'short',year:'numeric'})}
  else if(p=='month'){a=new Date(Y,Mo+off,1);b=new Date(Y,Mo+off+1,1);const dm=Math.round((b-a)/864e5);for(let i=0;i<dm;i++)bk.push({l:(i%5==0||i==dm-1)?String(i+1):'',s:+new Date(a.getFullYear(),a.getMonth(),i+1),e:+new Date(a.getFullYear(),a.getMonth(),i+2)});t=L(a,{month:'long',year:'numeric'})}
  else{a=new Date(Y+off,0,1);b=new Date(Y+off+1,0,1);for(let i=0;i<12;i++){const x=new Date(a.getFullYear(),i,1);bk.push({l:L(x,{month:'short'}),s:+x,e:+new Date(a.getFullYear(),i+1,1)})}t=String(a.getFullYear())}
  return{a:+a,b:+b,bk,t}}
function stats(a,b){const L=live().filter(i=>i.at>=a&&i.at<b);let sales=0,cost=0,qty=0,disc=0;L.forEach(i=>{sales+=i.total;disc+=i.disc||0;i.items.forEach(x=>{cost+=(+x.cost||0)*x.qty;qty+=x.qty})});return{L,sales,cost,profit:sales-cost,qty,disc,bills:L.length}}
function lowOut(){const a=S.products.filter(p=>p.active!==false);return{low:a.filter(p=>p.stock>0&&p.stock<=(p.reorder??S.shop.low)),out:a.filter(p=>p.stock<=0)}}
const short=v=>v>=1e7?(v/1e7).toFixed(1)+'Cr':v>=1e5?(v/1e5).toFixed(1)+'L':v>=1e3?(v/1e3).toFixed(1)+'k':String(Math.round(v));
function barChart(bk,st,p){const W=720,H=250,pl=48,pr=8,pt=12,pb=28,n=bk.length,bw=(W-pl-pr)/n,mx=Math.max(1,...st.map(x=>Math.max(x.sales,x.profit))),ch=H-pt-pb,base=H-pb;
  const tk=[0,.25,.5,.75,1].map(t=>{const y=pt+ch*(1-t);return `<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="var(--bd)" stroke-dasharray="3 4"/><text x="${pl-6}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--mu)">${short(mx*t)}</text>`}).join('');
  const fo=p=='day'?{hour:'numeric'}:p=='year'?{month:'long'}:{day:'numeric',month:'short'};
  const bars=st.map((x,i)=>{const hs=ch*x.sales/mx,hp=ch*Math.max(0,x.profit)/mx,x0=pl+i*bw+bw*.12,w=bw*.76/2;return `<g><title>${new Date(bk[i].s).toLocaleString('en-IN',fo)} · Sales ${M(x.sales)} · Profit ${M(x.profit)}</title><rect x="${x0}" y="${base-hs}" width="${w}" height="${hs}" rx="3" style="fill:var(--gold)"/><rect x="${x0+w+1}" y="${base-hp}" width="${w}" height="${hp}" rx="3" style="fill:var(--ok)"/></g>`}).join('');
  const lb=bk.map((k,i)=>k.l?`<text x="${pl+i*bw+bw/2}" y="${H-9}" text-anchor="middle" font-size="10" fill="var(--mu)">${k.l}</text>`:'').join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${tk}${bars}${lb}</svg>`}
function donut(parts){const tot=parts.reduce((a,x)=>a+x[1],0);if(!tot)return '<p class="mu">No sales in this period.</p>';const C=2*Math.PI*45,col=['var(--gold)','var(--ok)','#60a5fa','#f472b6','var(--warn)','#a78bfa'];let o=0;
  return `<div class="row n" style="flex-wrap:nowrap;align-items:flex-start"><svg viewBox="0 0 120 120" width="140" style="flex:0 0 140px;transform:rotate(-90deg)"><circle cx="60" cy="60" r="45" fill="none" stroke="var(--bd)" stroke-width="16"/>${parts.map((x,i)=>{const len=C*x[1]/tot,c=`<circle cx="60" cy="60" r="45" fill="none" stroke-width="16" style="stroke:${col[i%6]}" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-o}"/>`;o+=len;return c}).join('')}</svg><div style="flex:1;min-width:0">${parts.map((x,i)=>`<div class="row n" style="justify-content:space-between;margin:6px 0;flex-wrap:nowrap"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;background:${col[i%6]}"></i>${E(x[0])}</span><span class="k">${Math.round(x[1]/tot*100)}%</span></div>`).join('')}</div></div>`}
function dset(p){S.dp=p;S.doff=0;render()}
function dnav(n){S.doff=Math.min(0,S.doff+n);render()}
function exportDash(){
  const R=prange(S.dp,S.doff),c=stats(R.a,R.b),r2=n=>Math.round(n*100)/100,sold={},{low,out}=lowOut(),cat=p=>(p&&p.category)||'Uncategorised';
  c.L.forEach(i=>i.items.forEach(x=>{const k=sold[x.id||x.name]=sold[x.id||x.name]||{name:x.name,code:x.code,id:x.id,q:0,r:0,c:0};k.q+=x.qty;k.r+=x.price*x.qty;k.c+=(+x.cost||0)*x.qty}));
  const sv=S.products.reduce((a,x)=>a+x.stock*x.cost,0),ss=S.products.reduce((a,x)=>a+x.stock*x.price,0),fo=S.dp=='day'?{hour:'numeric'}:S.dp=='year'?{month:'long',year:'numeric'}:{day:'numeric',month:'short',year:'numeric'};
  dlWB('dashboard-report-'+S.dp+'-'+new Date().toISOString().slice(0,10)+'.xlsx',{
   Summary:[['Period',R.t],['Bills',c.bills],['Units (items) sold',c.qty],['Total sales (after discount)',r2(c.sales)],['Discounts given',r2(c.disc)],['Cost of goods sold',r2(c.cost)],['Gross profit',r2(c.profit)],['Profit margin %',c.sales?r2(c.profit/c.sales*100):0],['Average bill value',c.bills?r2(c.sales/c.bills):0],['Units in stock now',S.products.reduce((a,x)=>a+(+x.stock||0),0)],['Stock value at cost',r2(sv)],['Stock value at selling price',r2(ss)],['Low-stock products',low.length],['Out-of-stock products',out.length],['Note','Gross profit = sales after discount minus the purchase cost saved on each bill. Expenses are not included.']].map(([Item,Value])=>({Item,Value})),
   Trend:R.bk.map(k=>{const t=stats(k.s,k.e);return{Period:new Date(k.s).toLocaleString('en-IN',fo),Bills:t.bills,'Units sold':t.qty,Sales:r2(t.sales),Cost:r2(t.cost),Profit:r2(t.profit)}}),
   'Products sold':Object.values(sold).map(k=>{const q=S.products.find(x=>x.id==k.id);return{Code:k.code||'',Product:k.name,Category:cat(q),'Units sold':k.q,Sales:r2(k.r),Cost:r2(k.c),Profit:r2(k.r-k.c),'Stock left':q?q.stock:'(deleted)'}}),
   Stock:S.products.map(x=>({Code:x.code,Product:x.name,Category:x.category||'','Purchase price':x.cost,'Selling price':x.price,Stock:x.stock,'Value at cost':r2(x.stock*x.cost),Status:x.stock<=0?'Out of stock':x.stock<=(x.reorder??S.shop.low)?'Low':'OK'})),
   Bills:c.L.map(i=>({Invoice:i.no,Date:new Date(i.at).toLocaleString('en-IN'),Customer:i.cust||'Walk-in',Units:i.items.reduce((a,x)=>a+x.qty,0),Discount:i.disc,Total:i.total,Paid:i.paid,Method:i.pm}))})
}

const NAV=[['dash','Dashboard'],['bill','New Bill'],['prod','Products'],['stock','Stock'],['sales','Sales History'],['img','Images'],['set','Settings']];
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',3200)}
function go(v){S.view=v;render()}
function render(){
  applyTheme();document.title=S.shop.name;
  $('#nav').innerHTML='<h1>'+(S.shop.logo?'<img src="'+S.shop.logo+'" style="max-width:100%;max-height:56px;display:block;margin:0 0 6px">':'')+E(S.shop.name)+'</h1>'+NAV.map(([k,l])=>`<button class="${S.view==k?'on':''}" onclick="go('${k}')">${l}</button>`).join('');
  const a=document.activeElement;if(a&&a.dataset&&a.dataset.keep)return partial();
  $('#main').innerHTML=(V[S.view]||V.dash)();
}
function partial(){ // keep focus while typing in search boxes
  const a=document.activeElement,id=a.id,pos=a.selectionStart;$('#main').innerHTML=V[S.view]();const n=document.getElementById(id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}
}
const day=t=>new Date(t).toDateString();
const live=()=>S.invoices.filter(i=>i.status!=='cancelled');
const V={
dash(){
  const R=prange(S.dp,S.doff),P=prange(S.dp,S.doff-1),c=stats(R.a,R.b),pv=stats(P.a,P.b),tr=R.bk.map(k=>stats(k.s,k.e)),{low,out}=lowOut(),nm={day:'Day',week:'Week',month:'Month',year:'Year'};
  const prod={},cat={};c.L.forEach(i=>i.items.forEach(x=>{const q=S.products.find(z=>z.id==x.id),g=(q&&q.category)||'Uncategorised',r=x.price*x.qty,k=prod[x.name]=prod[x.name]||{q:0,r:0};k.q+=x.qty;k.r+=r;cat[g]=(cat[g]||0)+r}));
  const tops=Object.entries(prod).sort((a,b)=>b[1].r-a[1].r).slice(0,6),mxr=Math.max(1,...tops.map(t=>t[1].r));
  let cats=Object.entries(cat).sort((a,b)=>b[1]-a[1]);if(cats.length>5)cats=[...cats.slice(0,5),['Other',cats.slice(5).reduce((a,x)=>a+x[1],0)]];
  const sq=S.products.reduce((a,x)=>a+(+x.stock||0),0),sv=S.products.reduce((a,x)=>a+(+x.stock||0)*(+x.cost||0),0),ss=S.products.reduce((a,x)=>a+(+x.stock||0)*(+x.price||0),0);
  const dd=(a,b)=>b?`<span class="${a>=b?'ok':'out'}">${a>=b?'▲':'▼'} ${Math.abs((a-b)/b*100).toFixed(0)}%</span> vs previous`:(a?'<span class="ok">New</span>':'No data yet');
  const kp=(ic,l,v,sub,sm)=>`<div class="kpi${sm?' sm':''}"><div class="ic">${ic}</div><div><div class="k">${l}</div><div class="v">${v}</div><div class="k">${sub||''}</div></div></div>`;
  return `<div class="hero"><div><div class="k">Dashboard</div><h2>${E(S.shop.name)}</h2><div class="k">${E(R.t)}</div></div><div class="row"><div class="seg">${Object.keys(nm).map(k=>`<button class="${S.dp==k?'on':''}" onclick="dset('${k}')">${nm[k]}</button>`).join('')}</div><button class="g" onclick="dnav(-1)">◀</button><button class="g" onclick="S.doff=0;render()">Now</button><button class="g" onclick="dnav(1)" ${S.doff>=0?'disabled':''}>▶</button><button class="b" onclick="exportDash()">⬇ Export report</button></div></div>
  <div class="kg">${kp('💰','Sales',M(c.sales),dd(c.sales,pv.sales))}${kp('📈','Gross profit',M(c.profit),(c.sales?(c.profit/c.sales*100).toFixed(1)+'% margin · ':'')+dd(c.profit,pv.profit))}${kp('🧾','Bills',c.bills,dd(c.bills,pv.bills))}${kp('📦','Units sold',c.qty,dd(c.qty,pv.qty))}</div>
  <div class="kg">${kp('🏬','Products',S.products.length,'',1)}${kp('🧮','Stock in hand',sq+' units','Cost '+M(sv)+' · Sale '+M(ss),1)}${kp('⚠️','Low stock','<span class="low">'+low.length+'</span>','',1)}${kp('⛔','Out of stock','<span class="out">'+out.length+'</span>','',1)}</div>
  <div class="cols"><div class="card"><b>Sales &amp; profit</b><div class="leg"><span><i style="background:var(--gold)"></i>Sales</span><span><i style="background:var(--ok)"></i>Gross profit</span></div>${barChart(R.bk,tr,S.dp)}${c.bills?'':'<p class="mu">No sales in this period yet.</p>'}<p class="k">Gross profit = sales after discount minus purchase cost. Expenses are not included.</p></div><div class="card"><b>Sales by category</b><div style="margin-top:10px">${donut(cats)}</div></div></div>
  <div class="cols"><div class="card"><b>Top products</b>${tops.length?tops.map(t=>`<div style="margin:10px 0"><div class="row n" style="justify-content:space-between;margin:0"><span>${E(t[0])}</span><span class="k">${t[1].q} sold · ${M(t[1].r)}</span></div><div class="hb"><div style="width:${t[1].r/mxr*100}%"></div></div></div>`).join(''):'<p class="mu">No sales in this period.</p>'}</div>
  <div class="card"><b>Needs attention</b>${[...out.map(x=>`<div class="out">${E(x.name)} – out of stock</div>`),...low.map(x=>`<div class="low">${E(x.name)} – only ${x.stock} left</div>`)].join('')||'<p class="mu">Nothing to flag.</p>'}</div></div>
  <div class="card"><b>Recent bills</b>${S.invoices.slice(0,6).map(i=>`<div class="row n" style="justify-content:space-between;margin:8px 0"><span>${E(i.no)} · ${E(i.cust||'Walk-in')} <span class="k">${new Date(i.at).toLocaleString('en-IN')}</span></span><span class="${i.status=='cancelled'?'out':'ok'}">${i.status=='cancelled'?'Cancelled':M(i.total)}</span></div>`).join('')||'<p class="mu">No bills yet. Add products, then open New Bill.</p>'}</div>`;
},
bill(){
  const q=S.q.toLowerCase(),res=q?S.products.filter(p=>p.active!==false&&(p.name.toLowerCase().includes(q)||String(p.code).toLowerCase().includes(q)||String(p.barcode||'')==q)).slice(0,8):[];
  const c=totals();
  return `<h2>New Bill</h2>${S.last?`<div class="card" style="border-color:var(--gold)"><div class="row n" style="justify-content:space-between"><span class="ok">✔ ${E(S.last.no)} saved · ${M(S.last.total)}</span><span><button class="b" ${S.last.phone?'':'disabled'} onclick="waSend('last')">Send on WhatsApp</button> <button class="g" onclick="S.last=null;render()">✕</button></span></div>${S.last.phone?'':'<div class="k">No WhatsApp number was entered for this bill.</div>'}</div>`:''}<div class="cols"><div><div class="card"><input id="q" data-keep=1 placeholder="Search name, code or barcode" value="${E(S.q)}" oninput="S.q=this.value;render()">
  ${res.map(p=>`<div class="row n" style="justify-content:space-between;margin:10px 0"><span>${E(p.name)} <span class="mu">${E(p.code)} · ${M(p.price)} · stock ${p.stock}</span></span><button class="g" ${p.stock<=0?'disabled':''} onclick="addCart('${p.id}')">Add</button></div>`).join('')}${q&&!res.length?'<p class="mu">No match.</p>':''}</div>
  <div class="card"><b>Cart</b>${S.cart.length?`<div class="tw"><table>${S.cart.map((x,i)=>`<tr><td>${E(x.name)}<div class="k">${M(x.price)} · avail ${x.avail}</div></td><td><button class="g" onclick="qty(${i},-1)">−</button> <input style="width:64px;text-align:center" type="number" min="1" value="${x.qty}" onchange="qty(${i},0,this.value)"> <button class="g" onclick="qty(${i},1)">+</button></td><td>${M(x.price*x.qty)}</td><td><button class="g d" onclick="S.cart.splice(${i},1);render()">✕</button></td></tr>`).join('')}</table></div>`:'<p class="mu">Cart is empty.</p>'}</div></div>
  <div class="card"><div class="row"><input id="cn" placeholder="Customer name" value="${E(S.cust||'')}" oninput="S.cust=this.value"><input id="cp" placeholder="WhatsApp number (optional)" inputmode="tel" value="${E(S.ph||'')}" oninput="S.ph=this.value"></div>
  <div class="row"><input type="number" min="0" placeholder="Discount ₹" value="${S.disc||''}" onchange="S.disc=+this.value;render()"><select onchange="S.pm=this.value">${(S.shop.pay||'Cash').split(',').map(m=>`<option ${S.pm==m.trim()?'selected':''}>${E(m.trim())}</option>`).join('')}</select></div>
  <div class="row n" style="justify-content:space-between"><span>Subtotal</span><span>${M(c.sub)}</span></div><div class="row n" style="justify-content:space-between"><span>Discount</span><span>−${M(c.disc)}</span></div>
  <div class="row n" style="justify-content:space-between;font-size:20px;font-weight:700"><span>Total</span><span>${M(c.total)}</span></div>
  <div class="row"><input type="number" min="0" placeholder="Amount paid (blank = full)" value="${S.paid??''}" onchange="S.paid=this.value===''?undefined:+this.value"></div>
  <div class="row"><button class="b" style="padding:16px" ${S.busy||!S.cart.length||!S.can?'disabled':''} onclick="saveBill()">${S.busy?'Saving…':'Save & Print'}</button><button class="g n" onclick="clearBill()">Clear</button></div>${S.can?'':'<p class="low">You have view-only access, so billing is disabled.</p>'}</div></div>`;
},
prod(){
  const q=S.pq?.toLowerCase()||'',list=S.products.filter(p=>!q||(p.name+p.code+(p.category||'')).toLowerCase().includes(q));
  return `<h2>Products</h2><div class="card"><div class="row"><input id="pq" data-keep=1 placeholder="Search products" value="${E(S.pq||'')}" oninput="S.pq=this.value;render()"><button class="b n" onclick="editP()">+ Add product</button><label class="g n" style="cursor:pointer">Import Excel<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="readX(this.files[0])"></label><button class="g n" onclick="exportP()">Export</button><button class="g n" onclick="tpl()">Template</button></div>
  ${S.imp?impUI():''}${S.edit?editUI():''}
  <div class="tw"><table><tr><th>Code</th><th>Name</th><th>Category</th><th>Cost</th><th>Price</th><th>Stock</th><th></th></tr>${list.map(p=>`<tr><td>${E(p.code)}</td><td>${p.img?`<img src="${p.img}" style="width:30px;height:30px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px">`:''}${E(p.name)}${p.restricted?' <span class="low">⚠</span>':''}${p.active===false?' <span class="mu">(inactive)</span>':''}</td><td>${E(p.category||'')}</td><td>${M(p.cost)}</td><td>${M(p.price)}</td><td class="${p.stock<=0?'out':p.stock<=(p.reorder??S.shop.low)?'low':''}">${p.stock}</td><td><button class="g" onclick="editP('${p.id}')">Edit</button></td></tr>`).join('')}</table></div>${list.length?'':'<p class="mu">No products yet. Add one or import your Excel file.</p>'}</div>`;
},
stock(){
  return `<h2>Stock</h2><div class="card"><b>Adjust stock</b><div class="row"><select id="as">${S.products.map(p=>`<option value="${p.id}">${E(p.name)} (${p.stock})</option>`).join('')}</select><input id="aq" type="number" placeholder="Change (+/−)"><select id="ar"><option>Purchase received</option><option>Damaged</option><option>Expired</option><option>Sales return</option><option>Physical count</option><option>Manual adjustment</option></select><button class="b n" ${S.can?'':'disabled'} onclick="adjust()">Apply</button></div></div>
  <div class="card"><b>Movement history</b><div class="tw"><table><tr><th>Date</th><th>Product</th><th>Change</th><th>Reason</th><th>Ref</th></tr>${S.moves.slice(0,60).map(m=>`<tr><td>${new Date(m.at).toLocaleString('en-IN')}</td><td>${E(m.name)}</td><td class="${m.qty<0?'out':'ok'}">${m.qty>0?'+':''}${m.qty}</td><td>${E(m.reason)}</td><td>${E(m.ref||'')}</td></tr>`).join('')}</table></div></div>`;
},
sales(){
  return `<h2>Sales History</h2><div class="card"><div class="row"><input id="sq" data-keep=1 placeholder="Invoice no. or customer" value="${E(S.sq||'')}" oninput="S.sq=this.value;render()"><button class="g n" onclick="exportS()">Export</button></div><div class="tw"><table><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Total</th><th>Paid</th><th>Status</th><th></th></tr>${S.invoices.filter(i=>!S.sq||(i.no+(i.cust||'')).toLowerCase().includes(S.sq.toLowerCase())).map(i=>`<tr><td>${E(i.no)}</td><td>${new Date(i.at).toLocaleString('en-IN')}</td><td>${E(i.cust||'Walk-in')}</td><td>${M(i.total)}</td><td>${E(i.pm)} ${M(i.paid)}</td><td class="${i.status=='cancelled'?'out':'ok'}">${i.status=='cancelled'?'Cancelled':i.paid>=i.total?'Paid':'Due '+M(i.total-i.paid)}</td><td><button class="g" onclick="printI('${i.id}')">Print</button> ${i.phone?`<button class="g" onclick="waSend('${i.id}')">WhatsApp</button> `:''}${i.status!='cancelled'&&S.can?`<button class="g d" onclick="cancelI('${i.id}')">Cancel</button>`:''}</td></tr>`).join('')}</table></div></div>`;
},
img(){return `<h2>Images</h2><div class="card"><div class="dz" ondragover="event.preventDefault();this.classList.add('hov')" ondragleave="this.classList.remove('hov')" ondrop="event.preventDefault();this.classList.remove('hov');upImgs(event.dataTransfer.files)" onclick="$('#imf').click()">Drag &amp; drop images here, or click to choose (logo, banners, anything)</div><input id="imf" type="file" accept="image/*" multiple hidden onchange="upImgs(this.files)"></div><div class="grid">${S.images.map(i=>`<div class="card"><img src="${i.data}" style="width:100%;height:110px;object-fit:contain;border-radius:8px"><div class="k" style="margin:6px 0">${E(i.name)}</div><div class="row n"><button class="g" onclick="setLogo('${i.id}')">Use as logo</button><button class="g d" onclick="delImg('${i.id}')">Delete</button></div></div>`).join('')||'<p class="mu">No images yet.</p>'}</div>`},
set(){
  const s=S.shop,T={...THEMES.blue,...(s.theme||{})},f=(k,l,t='text')=>`<div><div class="k">${l}</div><input type="${t}" id="f_${k}" value="${E(s[k]??'')}"></div>`;
  return `<h2>Settings</h2><div class="card"><b>Shop profile</b><div class="row" style="margin-top:10px">${f('name','Shop name')}${f('owner','Owner')}${f('phone','Phone')}</div><div class="row">${f('addr','Address')}${f('gstin','GSTIN (optional)')}${f('lic','License no. and expiry')}</div>
  <div class="row">${f('sym','Currency symbol')}${f('cc','Default country code')}${f('low','Low-stock threshold','number')}<div><div class="k">Receipt size</div><select id="f_rw">${['58','80','A4'].map(x=>`<option ${s.rw==x?'selected':''}>${x}</option>`).join('')}</select></div></div>
  <div class="row">${f('pay','Payment methods (comma separated)')}${f('foot','Invoice footer message')}${f('notice','Compliance notice on invoice')}</div>
  <div class="row n"><span class="k">Logo</span>${s.logo?`<img src="${s.logo}" style="height:40px">`:''}<label class="g">Upload logo<input type="file" hidden accept="image/*" onchange="setLogoF(this.files[0])"></label>${s.logo?'<button class="g d" onclick="rmLogo()">Remove logo</button>':''}</div></div>
  <div class="card"><b>Theme and colours</b><div class="row n" style="margin:10px 0"><button class="g" onclick="preset('blue')">Blue &amp; Gold</button><button class="g" onclick="preset('dark')">Charcoal</button><button class="g" onclick="preset('light')">Light</button></div><div class="grid">${Object.keys(TL).map(k=>`<div><div class="k">${TL[k]}</div><input type="color" id="t_${k}" value="${T[k]}" oninput="pvTheme()"></div>`).join('')}</div><p class="k">Colours change as you pick them. Press Save changes to keep them.</p></div>
  <div class="card"><b>Automatic backup</b><div class="row" style="margin-top:10px"><label class="n"><input type="checkbox" id="f_bkOn" style="width:auto" ${s.bkOn===false?'':'checked'}> Auto backup on</label>${f('bkMin','Every (minutes, 1 or more)','number')}${f('bkKeep','Snapshots to keep','number')}</div>
  <p class="mu">Last backup: ${S.bat?new Date(S.bat).toLocaleTimeString('en-IN'):'none yet'} · ${(S.bl||[]).length} snapshots in this browser. A backup is taken only when something changed.</p>
  <div class="row n"><button class="g" onclick="doBackup(true);toast('Backup taken')">Backup now</button><button class="g" onclick="backup()">Download backup file</button><label class="g">Restore from file<input type="file" hidden accept=".json" onchange="restore(this.files[0])"></label></div>
  <div class="row"><select id="snp">${(S.bl||[]).map((t,i)=>`<option value="${i}">${new Date(t).toLocaleString('en-IN')}</option>`).join('')}</select><button class="g n" onclick="restoreSnap()">Restore selected snapshot</button></div>
  <div class="row n"><button class="g" onclick="pickDir()">${S.dir?'Change':'Choose'} backup &amp; images folder</button>${S.dir&&!S.dirOk?'<button class="g" onclick="allowDir()">Allow folder access</button>':''}<span class="k">${S.dir?(S.dirOk?'Saving to your folder':'Needs permission again'):'Optional · Chrome or Edge on a computer'}</span></div></div>
  <div class="row n"><button class="b" ${S.can?'':'disabled'} onclick="saveSet()">Save changes</button><button class="g" onclick="render()">Cancel</button></div>`;
}};
function totals(){const sub=S.cart.reduce((a,x)=>a+x.price*x.qty,0),disc=Math.min(sub,+S.disc||0);return{sub,disc,total:sub-disc}}
function addCart(id){const p=S.products.find(x=>x.id==id),x=S.cart.find(c=>c.id==id);if(x){if(x.qty<p.stock)x.qty++;else toast('Not enough stock')}else S.cart.push({id,name:p.name,code:p.code,price:+p.price,qty:1,avail:p.stock,cost:+p.cost||0});S.q='';render();}
function qty(i,d,v){const x=S.cart[i];let n=v!=null?+v:x.qty+d;if(n>x.avail){toast('Only '+x.avail+' in stock');n=x.avail}x.qty=Math.max(1,n||1);render()}
function clearBill(){S.cart=[];S.cust=S.ph='';S.disc=0;S.paid=undefined;render()}
const col=n=>S.db.collection(n);
async function saveBill(){
  if(S.busy)return;S.busy=true;render();const lock=S.db.doc('locks/billing');let got;
  try{
    got=await lock.acquire({holder:S.uid,ttlMs:15000});if(!got.acquired){toast('Another bill is being saved — try again');return}
    // re-read live stock inside the lock so two cashiers cannot oversell
    const fresh={};for(const x of S.cart){const d=await col('products').doc(x.id).get();fresh[x.id]=d.exists?d.data():null;if(!fresh[x.id]||fresh[x.id].stock<x.qty){toast('Insufficient stock for '+x.name);return}}
    const cfg=(await S.db.doc('cfg/shop').get()).data()||{},n=cfg.next||S.shop.next||1,no=(cfg.prefix||'INV')+'-'+String(n).padStart(5,'0'),c=totals(),paid=S.paid==null?c.total:S.paid;
    const inv={no,at:Date.now(),cust:S.cust||'',phone:S.ph||'',items:S.cart.map(x=>({id:x.id,name:x.name,code:x.code,price:x.price,qty:x.qty,cost:fresh[x.id].cost||0})),sub:c.sub,disc:c.disc,total:c.total,paid,pm:S.pm||(S.shop.pay||'Cash').split(',')[0].trim(),status:'completed',snap:{name:S.shop.name,addr:S.shop.addr||'',phone:S.shop.phone||'',gstin:S.shop.gstin||'',foot:S.shop.foot||'',sym:S.shop.sym,notice:S.shop.notice||'',rw:S.shop.rw}};
    const ref=await col('invoices').add(inv);          // invoice saved first
    for(const x of S.cart){await col('products').doc(x.id).update({stock:fresh[x.id].stock-x.qty});await col('moves').add({pid:x.id,name:x.name,qty:-x.qty,reason:'Sale',ref:no,at:Date.now()})}
    await S.db.doc('cfg/shop').set({...cfg,next:n+1});S.shop.next=n+1;
    toast('Saved '+no);const saved={...inv,id:ref.id};S.last=saved;clearBill();printInv(saved);
  }catch(e){toast('Could not save: '+(e.message||e.code))}finally{S.busy=false;render()}
}
function printInv(i){
  const s=i.snap||S.shop,w=s.rw=='A4'?'190mm':s.rw+'mm',m=n=>(s.sym||'₹')+(+n).toFixed(2);
  $('#print').innerHTML=`<div style="width:${w};font:${s.rw=='A4'?14:12}px monospace;margin:auto">${S.shop.logo?`<img src="${S.shop.logo}" style="display:block;margin:0 auto 4px;max-height:50px">`:''}<h3 style="text-align:center;margin:4px">${E(s.name)}</h3><div style="text-align:center">${E(s.addr)} ${E(s.phone)}<br>${s.gstin?'GSTIN '+E(s.gstin):''}</div><hr>${E(i.no)} · ${new Date(i.at).toLocaleString('en-IN')}<br>${E(i.cust||'Walk-in')}<hr><table style="width:100%">${i.items.map(x=>`<tr><td>${E(x.name)}<br>${x.qty} × ${m(x.price)}</td><td style="text-align:right">${m(x.qty*x.price)}</td></tr>`).join('')}</table><hr>Subtotal ${m(i.sub)}<br>Discount −${m(i.disc)}<br><b>Total ${m(i.total)}</b><br>${E(i.pm)} paid ${m(i.paid)}${i.paid<i.total?'<br>Due '+m(i.total-i.paid):''}<hr><div style="text-align:center">${E(s.foot)}<br><small>${E(s.notice||'')}</small></div></div>`;
  setTimeout(()=>window.print(),150);
}

function showWA(n,t){const u='https://wa.me/'+n+'?text='+encodeURIComponent(t),e=document.getElementById('wa');
  e.innerHTML=`<div class="card" style="max-width:420px;width:92%;margin:auto"><b>Send bill on WhatsApp</b><p class="mu">To: +${n}</p><a href="whatsapp://send?phone=${n}&text=${encodeURIComponent(t)}" style="display:block;text-align:center;text-decoration:none;padding:13px;margin:8px 0;border-radius:9px;color:var(--btx);background:var(--btn);font-weight:700">1. Open WhatsApp app</a><a href="https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(t)}" target="_top" style="display:block;text-align:center;text-decoration:none;padding:13px;margin:8px 0;border-radius:9px;color:var(--btx);background:var(--btn);font-weight:700">2. Open WhatsApp link</a><a href="${u}" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;padding:13px;margin:8px 0;border-radius:9px;color:var(--btx);background:var(--btn);font-weight:700">3. Try wa.me link</a><textarea id="wat" rows="7" readonly>${E(t)}</textarea><div class="row" style="margin-top:8px"><button class="g" onclick="copyWA()">Copy message</button><button class="g" onclick="document.getElementById('wa').style.display='none'">Close</button></div><p class="k">If none of the buttons open WhatsApp, tap Copy message, open the customer’s chat in WhatsApp and paste.</p></div>`;e.style.display='flex'}
function copyWA(){const t=document.getElementById('wat');t.focus();t.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}if(!ok&&navigator.clipboard)navigator.clipboard.writeText(t.value).catch(()=>{});toast('Message copied — paste it in WhatsApp')}
function waSend(id){
  const i=id==='last'?S.last:S.invoices.find(x=>x.id==id);if(!i||!i.phone)return toast('No WhatsApp number on this bill');
  let n=String(i.phone).replace(/\D/g,'');if(n.length==10)n=(S.shop.cc||'91')+n;if(n.length<11)return toast('Check the WhatsApp number');
  const s=i.snap||S.shop,m=v=>(s.sym||'₹')+(+v).toFixed(2);
  const t=`*${s.name}*\n${s.addr||''} ${s.phone||''}\nBill: ${i.no}\nDate: ${new Date(i.at).toLocaleString('en-IN')}\n\n`+i.items.map(x=>`${x.name} ${x.qty} x ${m(x.price)} = ${m(x.qty*x.price)}`).join('\n')+`\n\nSubtotal: ${m(i.sub)}\nDiscount: ${m(i.disc)}\n*Total: ${m(i.total)}*\nPaid (${i.pm}): ${m(i.paid)}`+(i.paid<i.total?`\nDue: ${m(i.total-i.paid)}`:'')+`\n\n${s.foot||''}`;
  showWA(n,t);
}
function printI(id){printInv(S.invoices.find(i=>i.id==id))}
async function cancelI(id){
  const i=S.invoices.find(x=>x.id==id);if(!confirm('Cancel '+i.no+' and return stock?'))return;
  try{await col('invoices').doc(id).update({status:'cancelled',cancelledAt:Date.now()});
  for(const x of i.items){const d=await col('products').doc(x.id).get();if(d.exists){await col('products').doc(x.id).update({stock:d.data().stock+x.qty});await col('moves').add({pid:x.id,name:x.name,qty:x.qty,reason:'Bill cancelled',ref:i.no,at:Date.now()})}}toast('Cancelled')}catch(e){toast('Failed: '+e.message)}
}
async function adjust(){
  const p=S.products.find(x=>x.id==$('#as').value),n=+$('#aq').value;if(!p||!n)return toast('Enter a non-zero change');if(p.stock+n<0)return toast('Stock cannot go below zero');
  try{await col('products').doc(p.id).update({stock:p.stock+n});await col('moves').add({pid:p.id,name:p.name,qty:n,reason:$('#ar').value,at:Date.now(),user:S.uid});toast('Stock updated')}catch(e){toast('Failed: '+e.message)}
}
function editP(id){S.edit=id?{...S.products.find(p=>p.id==id)}:{active:true,stock:0};render()}
function editUI(){const p=S.edit,f=(k,l,t='text')=>`<div><div class="k">${l}</div><input type="${t}" id="e_${k}" value="${E(p[k]??'')}"></div>`;
  return `<div class="card" style="background:var(--bg)"><div class="row">${f('code','Product code *')}${f('name','Name *')}${f('category','Category')}${f('unit','Unit')}</div><div class="row">${f('cost','Purchase price','number')}${f('price','Selling price *','number')}${f('mrp','MRP','number')}${p.id?'<div class="k">Change stock from the Stock page</div>':f('stock','Opening stock','number')}</div><div class="row">${f('reorder','Reorder level','number')}${f('barcode','Barcode')}${f('hsn','HSN')}${f('gst','GST %','number')}</div>
  <div class="dz" ondragover="event.preventDefault();this.classList.add('hov')" ondragleave="this.classList.remove('hov')" ondrop="dropImg(event)" onclick="$('#imgf').click()">${p.img?`<img src="${p.img}"><div class="k">Drop another image to replace</div>`:'Drag &amp; drop a product image here, or click to choose'}</div><input type="file" id="imgf" accept="image/*" hidden onchange="pickImg(this.files[0])">${p.img?`<button class="g d" onclick="grabEdit();S.edit.img='';render()">Remove image</button> `:''}<label><input type="checkbox" id="e_restricted" style="width:auto" ${p.restricted?'checked':''}> Special-handling / restricted item</label> <label><input type="checkbox" id="e_active" style="width:auto" ${p.active!==false?'checked':''}> Active</label>
  <div class="row" style="margin-top:10px"><button class="b n" ${S.can?'':'disabled'} onclick="saveP()">Save</button><button class="g n" onclick="S.edit=null;render()">Cancel</button>${p.id?'<button class="g d n" onclick="delP()">Delete</button>':''}</div></div>`}
async function saveP(){
  const g=k=>$('#e_'+k).value.trim(),code=g('code'),name=g('name'),price=+g('price');
  if(!code||!name||!(price>=0)||g('price')==='')return toast('Code, name and selling price are required');
  if(S.products.some(p=>p.code==code&&p.id!=S.edit.id))return toast('Product code already exists');
  const d={code,name,category:g('category'),unit:g('unit'),cost:+g('cost')||0,price,mrp:+g('mrp')||0,reorder:g('reorder')===''?null:+g('reorder'),barcode:g('barcode'),hsn:g('hsn'),gst:g('gst')===''?null:+g('gst'),restricted:$('#e_restricted').checked,img:S.edit.img||'',active:$('#e_active').checked};
  try{if(S.edit.id){await col('products').doc(S.edit.id).update(d)}else{d.stock=+g('stock')||0;const r=await col('products').add(d);if(d.stock)await col('moves').add({pid:r.id,name,qty:d.stock,reason:'Opening stock',at:Date.now()})}S.edit=null;toast('Product saved')}catch(e){toast('Failed: '+e.message)}
}
async function delP(){if(!confirm('Delete this product? Old bills keep their copy.'))return;await col('products').doc(S.edit.id).delete();S.edit=null}
const FIELDS=[['code','Product Code',/code|sku|item\s*no/i],['name','Product Name',/name|item|desc/i],['category','Category',/categ|type|group/i],['unit','Unit',/unit/i],['cost','Purchase Price',/purchase|cost|buy/i],['price','Selling Price',/sell|sale|rate|price/i],['mrp','MRP',/mrp/i],['stock','Current Stock',/stock|qty|quantity|opening/i],['reorder','Reorder Level',/reorder|min/i],['barcode','Barcode',/barcode/i]];
function readX(f){if(!f)return;const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});if(!rows.length)return toast('No rows found');const hd=Object.keys(rows[0]),map={};FIELDS.forEach(([k,,re])=>{map[k]=hd.find(h=>re.test(h))||''});S.imp={rows,hd,map,mode:'add',sig:f.name+'|'+f.size+'|'+rows.length};render()}catch(x){toast('Could not read file')}};r.readAsArrayBuffer(f)}
function impCheck(){const im=S.imp,seen=new Set(),ok=[],bad=[];im.rows.forEach((r,i)=>{const o={};FIELDS.forEach(([k])=>o[k]=im.map[k]?r[im.map[k]]:'');const er=[];if(!String(o.code).trim())er.push('missing code');if(!String(o.name).trim())er.push('missing name');if(o.price===''||isNaN(+o.price)||+o.price<0)er.push('invalid selling price');['cost','stock'].forEach(k=>{if(o[k]!==''&&isNaN(+o[k]))er.push('invalid '+k)});const c=String(o.code).trim();if(seen.has(c))er.push('duplicate in file');seen.add(c);const ex=S.products.find(p=>p.code==c);er.length?bad.push({row:i+2,code:c,err:er.join(', ')}):ok.push({o,ex})});return{ok,bad}}
function impUI(){const im=S.imp,{ok,bad}=impCheck(),dup=ok.filter(x=>x.ex).length;
  return `<div class="card" style="background:var(--bg)"><b>Import preview</b><div class="row" style="margin-top:8px">${FIELDS.map(([k,l])=>`<div><div class="k">${l}</div><select onchange="S.imp.map['${k}']=this.value;render()"><option value="">— none —</option>${im.hd.map(h=>`<option ${im.map[k]==h?'selected':''}>${E(h)}</option>`).join('')}</select></div>`).join('')}</div>
  <p><span class="ok">${ok.length} valid</span> · <span class="out">${bad.length} invalid</span> · <b>${ok.length-dup} new products</b> · <b>${dup} existing products</b></p><div class="row"><select onchange="S.imp.mode=this.value"><option value="add">Existing products: add imported stock (keep old details)</option><option value="addupd" ${im.mode=='addupd'?'selected':''}>Existing products: add stock and update details</option><option value="skip" ${im.mode=='skip'?'selected':''}>Existing products: skip</option></select><button class="b n" ${ok.length&&S.can?'':'disabled'} onclick="doImport()">Import ${ok.length} rows</button><button class="g n" onclick="errRep()" ${bad.length?'':'disabled'}>Error report</button><button class="g n" onclick="S.imp=null;render()">Cancel</button></div></div>`}
async function doImport(){
  const{ok}=impCheck(),im=S.imp,mode=im.mode,nEx=ok.filter(x=>x.ex).length,sigs=(await kvGet('impsig'))||[];
  let msg='Add '+(ok.length-nEx)+' new product(s)'+(mode=='skip'?'; skip '+nEx+' existing.':'; add the imported stock to '+nEx+' existing product(s). Old products are kept.')+' Continue?';
  if(sigs.includes(im.sig))msg='This file looks already imported on this device. Importing again will add its stock AGAIN.\n\n'+msg;
  if(!confirm(msg))return;let a=0,u=0,sk=0,units=0;
  for(const{o,ex}of ok){try{const q=Math.max(0,+o.stock||0);
    if(ex){if(mode=='skip'){sk++;continue}
      const cur=(await col('products').doc(ex.id).get()).data()||ex,upd={};
      if(mode=='addupd')['name','category','unit','cost','price','mrp','barcode','reorder'].forEach(k=>{if(o[k]!==''&&o[k]!=null)upd[k]=['cost','price','mrp','reorder'].includes(k)?+o[k]:String(o[k]).trim()});
      await col('products').doc(ex.id).update({...upd,stock:(+cur.stock||0)+q});
      if(q)await col('moves').add({pid:ex.id,name:cur.name,qty:q,reason:'Stock added (import)',at:Date.now()});u++;units+=q}
    else{const d={code:String(o.code).trim(),name:String(o.name).trim(),category:o.category||'',unit:o.unit||'',cost:+o.cost||0,price:+o.price,mrp:+o.mrp||0,barcode:String(o.barcode||''),reorder:o.reorder===''?null:+o.reorder,stock:q,active:true},r=await col('products').add(d);
      if(q)await col('moves').add({pid:r.id,name:d.name,qty:q,reason:'Opening stock (import)',at:Date.now()});a++;units+=q}}catch(e){sk++}}
  sigs.push(im.sig);await kvSet('impsig',sigs.slice(-20));
  S.imp=null;toast(`Import done: ${a} new products, ${u} existing products topped up, ${sk} skipped (+${units} units)`);render()}
async function dlWB(name,sheets){try{const wb=XLSX.utils.book_new();for(const k in sheets)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(sheets[k].length?sheets[k]:[{Note:'No data'}]),k.slice(0,31));const buf=XLSX.write(wb,{type:'array',bookType:'xlsx'}),dn=window.claude&&await claude.use('downloads');if(dn)await dn.save({filename:name,data:buf});else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([buf]));a.download=name;a.click()}}catch(e){toast('Export failed (Excel needs internet the first time)')}}
const dl=(name,rows)=>dlWB(name,{Sheet1:rows});
function exportP(){dl('products.xlsx',S.products.map(p=>({'Product Code':p.code,'Product Name':p.name,Category:p.category,Unit:p.unit,'Purchase Price':p.cost,'Selling Price':p.price,MRP:p.mrp,'Current Stock':p.stock,'Reorder Level':p.reorder,Barcode:p.barcode})))}
function exportS(){dl('sales.xlsx',S.invoices.map(i=>({Invoice:i.no,Date:new Date(i.at).toLocaleString('en-IN'),Customer:i.cust,Total:i.total,Paid:i.paid,Method:i.pm,Status:i.status})))}
function tpl(){dl('product-template.xlsx',[{'Product Code':'C001','Product Name':'Sample Sparkler Box','Category':'Sparklers','Unit':'Box','Purchase Price':40,'Selling Price':60,MRP:75,'Current Stock':20,'Reorder Level':5,Barcode:''}])}
function errRep(){const{bad}=impCheck();dl('import-errors.xlsx',bad.map(b=>({Row:b.row,Code:b.code,Problem:b.err})))}
async function saveSet(){const g=k=>$('#f_'+k).value,d={...S.shop};['name','owner','phone','addr','gstin','lic','sym','cc','pay','foot','notice','rw'].forEach(k=>d[k]=g(k));d.low=+g('low')||0;if(!d.name.trim())return toast('Shop name is required');
  d.bkOn=$('#f_bkOn').checked;d.bkMin=Math.max(1,Math.round(+g('bkMin')||1));d.bkKeep=Math.max(1,Math.round(+g('bkKeep')||10));d.theme={};Object.keys(TL).forEach(k=>d.theme[k]=$('#t_'+k).value);
  try{await S.db.doc('cfg/shop').set(d);toast('Settings saved')}catch(e){toast('Failed: '+e.message)}}
(async()=>{
  let db=null,user=null;
  try{if(window.claude){db=await Promise.race([claude.use('db'),new Promise(r=>setTimeout(()=>r(null),6000))]);user=await claude.use('user')}}catch(e){db=null}
  if(!db){LS.d=(await kvGet('data'))||(()=>{try{return JSON.parse(localStorage.getItem('crackerpos')||'{}')}catch(e){return{}}})();S.db=localdb;S.can=true;S.local=true;toast('Saving on this device only')}
  else{S.db=db;try{S.uid=(await user?.id())||'u';S.can=(await user?.can('data.write'))!==false}catch(e){S.can=true}}
  db=S.db;const err=e=>toast('Data error: '+(e.code||e.message));
  db.collection('products').onSnapshot(s=>{S.products=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name).localeCompare(b.name));if(!document.activeElement?.dataset?.keep&&S.edit)return;render()},err);
  db.collection('invoices').onSnapshot(s=>{S.invoices=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.at-a.at);render()},err);
  db.collection('moves').onSnapshot(s=>{S.moves=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.at-a.at);if(S.view=='stock')render()},err);
  db.collection('images').onSnapshot(s=>{S.images=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.at-a.at);if(S.view=='img')render()},err);
  db.doc('cfg/shop').onSnapshot(s=>{if(s.exists)Object.assign(S.shop,s.data());bkTimer();render()},err);
  S.bl=((await kvGet('bk'))||[]).map(x=>x.at);S.dir=(await kvGet('dir'))||null;try{S.dirOk=!!S.dir&&(await S.dir.queryPermission({mode:'readwrite'}))=='granted'}catch(e){S.dirOk=false}
  S.ready=true;bkTimer();render();
})();
