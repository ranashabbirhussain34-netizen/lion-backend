module.exports = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LION STUDIO</title>
<style>
:root{--bg1:#2e2a6e;--bg2:#121a3a;--card:rgba(255,255,255,.08);--ink:#f2f0ff;--mut:#a9a6d6;--in:#171a38;--ac1:#4f7cff;--ac2:#7b5cff}
[data-theme=Sunset]{--bg1:#6e2a3c;--bg2:#2a1226;--in:#2e1730;--ac1:#ff8a4f;--ac2:#ff4f8b}
[data-theme=Midnight]{--bg1:#10131f;--bg2:#05060c;--in:#0c0e18;--ac1:#2fd1c5;--ac2:#4f7cff}
*{box-sizing:border-box}
body{margin:0;font-family:Roboto,system-ui,sans-serif;color:var(--ink);background:linear-gradient(180deg,var(--bg1),var(--bg2)) fixed;min-height:100vh}
header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#11162e;border-bottom:1px solid #ffffff1a;position:sticky;top:0;z-index:5}
.logo{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px;letter-spacing:1px}
.logo i{font-style:normal;width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7b5cff);display:grid;place-items:center;font-size:24px}
.chip{border:1px solid #ffffff33;border-radius:99px;padding:10px 16px;font-weight:700;background:#ffffff0d}
main{padding:16px;max-width:720px;margin:0 auto}
h1{font-size:30px;margin:6px 0 4px}h2{margin:0 0 14px;font-size:26px}
.sub{color:var(--mut);margin:0 0 16px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tile{background:var(--card);border:1px solid #ffffff22;border-radius:20px;padding:16px;cursor:pointer;min-height:130px}
.tile b{display:block;font-size:18px;margin:8px 0 4px}.tile span{color:var(--mut);font-size:14px}
.tile .ic{font-size:26px;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,var(--ac1),var(--ac2))}
.card{background:var(--card);border:1px solid #ffffff22;border-radius:24px;padding:18px}
label{display:block;font-weight:700;margin:14px 0 6px}
input,select,textarea{width:100%;background:var(--in);color:var(--ink);border:1px solid #ffffff1f;border-radius:16px;padding:14px;font:inherit}
textarea{min-height:110px;resize:vertical}input[type=checkbox]{width:24px;height:24px}
button{font:inherit;font-weight:700;border:0;border-radius:18px;padding:15px;color:#fff;cursor:pointer;background:linear-gradient(90deg,var(--ac1),var(--ac2));width:100%;margin-top:14px}
button.alt{background:#ffffff1a;border:1px solid #ffffff22}
.back{width:auto;padding:10px 16px;margin:0 0 14px;background:#ffffff14;border:1px solid #ffffff22;border-radius:14px}
.tabs{display:flex;background:var(--in);border-radius:18px;padding:5px;margin-bottom:6px}
.tabs div{flex:1;text-align:center;padding:12px;border-radius:14px;font-weight:700;color:var(--mut);cursor:pointer}
.tabs .on{background:linear-gradient(90deg,var(--ac1),var(--ac2));color:#fff}
.status{background:var(--in);border-radius:16px;padding:14px;margin-top:14px;color:var(--mut);white-space:pre-wrap;word-break:break-word}
.status.err{color:#ff9b9b}
.res img,.res video,.res audio{max-width:100%;border-radius:16px;margin-top:10px;display:block}
.gal{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gal img,.gal video{width:100%;border-radius:14px}
.plan{background:var(--in);border-radius:20px;padding:16px;margin-top:12px}
.plan big{font-size:30px;font-weight:800;display:block}.plan p{display:flex;justify-content:space-between;margin:8px 0;border-bottom:1px solid #ffffff14;padding-bottom:8px}
.row{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #ffffff1f;padding:12px 0}.row select{width:55%}
footer{text-align:center;color:var(--mut);padding:24px}
@keyframes Bounce{50%{transform:translateY(-18px)}}@keyframes Spin{to{transform:rotate(360deg)}}
@keyframes Pulse{50%{transform:scale(1.15)}}@keyframes Shake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes Float{50%{transform:translateY(-10px) rotate(4deg)}}
.anim{animation-duration:1.2s;animation-iteration-count:infinite;animation-timing-function:ease-in-out}
@media (prefers-reduced-motion:reduce){.anim{animation:none!important}}
</style></head><body>
<header><div class="logo"><i>🦁</i>LION STUDIO</div><div class="chip" id="cr">✦ ... Credits</div></header>
<main id="app"></main>
<footer>LION STUDIO • AI Creative Studio</footer>
<script>
var dev=localStorage.getItem('lion_dev');
if(!dev){dev=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2)+String(Date.now());localStorage.setItem('lion_dev',dev);}
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function api(p,m,b){return fetch('/api/'+p,{method:m||'GET',headers:{'Content-Type':'application/json','x-device-id':dev},body:b?JSON.stringify(b):undefined}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||'Something went wrong');return j;});});}
function readFile(f){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(f);});}
function setCredits(n){if(n!=null){me.credits=n;$('cr').textContent='✦ '+n+' Credits';}}
var me={credits:0,theme:'LION Signature',language:'English',notifications:true};
var LANGS=['English','Urdu','Hindi','Arabic','Persian','Bengali','Punjabi','Pashto','Turkish','Spanish','French','German','Italian','Portuguese','Russian','Chinese','Japanese','Korean','Indonesian','Malay','Thai','Vietnamese','Swahili'];
var HOME=[['image','🖼️','Create Image + Video','Generate creative visuals and clips.'],['music','🎵','Create Music','Create original music ideas.'],['voice','🎙️','Create Voice','Turn text into voice.'],['editor','🎚️','Video Editor','Edit clips and build projects.'],['sticker','🖼️','Image Sticker','Create custom image stickers.'],['motion','🎬','Motion Sticker','Create animated stickers.'],['upload','⬆️','Upload','Upload images and videos.'],['read','🔤','Read Image','Read text from images.'],['gallery','📁','My Images','See your saved images.'],['ai','🦁','LION AI','Plan your video ideas.'],['plans','⭐','Upgrade Plans','Get more credits.'],['settings','⚙️','Settings','Language, theme, alerts.'],['account','👤','Account','Profile and billing.']];
var RATIO=['1:1','16:9','9:16','4:3'];
var F={
 image:{t:'Create Image + Video',tabs:1,api:'image',btn:'Generate Image',out:'img',f:[['prompt','Image Prompt','area','Describe the image you want to create...'],['image','Add Image','file'],['ratio','Ratio','sel',RATIO],['count','Number of Images','sel',['1','2','3','4']]]},
 video:{t:'Create Image + Video',tabs:1,api:'video',btn:'Generate Video Clip',out:'img',f:[['prompt','Video Prompt','area','Describe the video you want to create...'],['image','Add Image','file'],['clipDuration','Clip Duration','sel',['5 Seconds','10 Seconds']],['projectDuration','Project Duration','sel',['30 Seconds','60 Seconds']],['ratio','Ratio','sel',RATIO],['quality','Quality','sel',['360p','720p','1080p']],['clips','Number of Clips','sel',['1','2','3','4','5']]]},
 music:{t:'Create Music',api:'music',btn:'Generate Music',f:[['prompt','Music Prompt','area','Describe the music you want...'],['style','Style','sel',['Pop','Rock','Lo-fi','Classical','Hip-hop','Cinematic','Folk']],['length','Length','sel',['30 Seconds','60 Seconds','2 Minutes']]]},
 voice:{t:'Create Voice',api:'voice',btn:'Generate Voice',out:'audio',f:[['text','Voice Text','area','Type the text to turn into voice...'],['language','Language','sel',LANGS],['voiceType','Voice Type','sel',['Female','Male','Child']]]},
 editor:{t:'Video Editor',api:'editor',btn:'Build Project',f:[['clips','Add Clips','file'],['music','Add Music','file'],['note','Edit Note','area','For example: trim the first 5 seconds and add a title...']]},
 sticker:{t:'Create Image Sticker',api:'sticker',btn:'Generate Image Sticker',out:'img',f:[['prompt','Sticker Prompt','area','Describe your sticker...'],['image','Upload Image','file'],['background','Background','sel',['Transparent','White','Black']]]},
 motion:{t:'Create Motion Sticker',api:'sticker',motion:1,btn:'Generate Motion Sticker',out:'img',f:[['prompt','Sticker Prompt','area','Describe your animated sticker...'],['image','Upload Image','file'],['animation','Animation','sel',['Bounce','Spin','Pulse','Shake','Float']]]},
 read:{t:'Read Image',api:'read',btn:'Read Text',out:'text',f:[['image','Image with text','file'],['language','Text language','sel',['Auto'].concat(LANGS)]]},
 ai:{t:'LION AI',api:'ai',btn:'Ask LION AI',out:'text',f:[['idea','Video Idea','area','I want to create a cartoon adventure video...']]}
};
var lastPlan='';
function back(){return '<button class="back" onclick="go(\\'home\\')">‹ Back</button>';}
function go(s,pre){
  var a=$('app');
  if(s==='home'){a.innerHTML='<h1>Welcome to LION STUDIO</h1><p class="sub">Create images, videos, music, voices, stickers and more in one creative studio.</p><div class="grid">'+HOME.map(function(h){return '<div class="tile" onclick="go(\\''+h[0]+'\\')"><div class="ic">'+h[1]+'</div><b>'+h[2]+'</b><span>'+h[3]+'</span></div>';}).join('')+'</div>';return;}
  if(F[s])return form(s,pre);
  if(s==='upload')return upload();
  if(s==='gallery')return gallery();
  if(s==='plans')return plans();
  if(s==='settings')return settings();
  if(s==='account')return account();
}
function status(m,e){var x=$('st');x.className='status'+(e?' err':'');x.textContent=m;}
function form(s,pre){
  var c=F[s],h=back()+'<div class="card"><h2>'+c.t+'</h2>';
  if(c.tabs)h+='<div class="tabs"><div class="'+(s==='image'?'on':'')+'" onclick="go(\\'image\\')">Image</div><div class="'+(s==='video'?'on':'')+'" onclick="go(\\'video\\')">Video</div></div>';
  c.f.forEach(function(f){
    h+='<label>'+f[1]+'</label>';
    if(f[2]==='area')h+='<textarea id="f_'+f[0]+'" placeholder="'+esc(f[3])+'">'+esc(pre&&f[0]==='prompt'?pre:'')+'</textarea>';
    else if(f[2]==='file')h+='<input type="file" id="f_'+f[0]+'" accept="image/*,video/*,audio/*">';
    else h+='<select id="f_'+f[0]+'">'+f[3].map(function(o){return '<option'+(o===me.language&&f[0]==='language'?' selected':'')+'>'+o+'</option>';}).join('')+'</select>';
  });
  h+='<button id="go">'+c.btn+'</button>';
  if(s==='ai')h+='<button class="alt" onclick="sendPlan()">Send Plan to Video Generator</button>';
  h+='<div class="status" id="st">Ready.</div><div class="res" id="res"></div></div>';
  $('app').innerHTML=h;
  $('go').onclick=function(){run(s);};
}
function sendPlan(){if(!lastPlan)return status('Ask LION AI for a plan first.',1);go('video',lastPlan.slice(0,900));}
async function run(s){
  var c=F[s],b={};
  try{
    for(var i=0;i<c.f.length;i++){
      var k=c.f[i][0],el=$('f_'+k);
      if(c.f[i][2]==='file'){if(el.files[0]&&el.files[0].size<3000000)b[k]=await readFile(el.files[0]);else if(el.files[0])throw new Error('File is too large. Use a file under 3 MB.');}
      else b[k]=el.value;
    }
    if(c.motion)b.motion=true;
    $('go').disabled=true;status('Working...');$('res').innerHTML='';
    var r=await api(c.api,'POST',b);
    setCredits(r.credits);status('Done.');
    var o='';
    if(c.out==='img')r.urls.forEach(function(u){o+='<img src="'+esc(u)+'"'+(c.motion?' class="anim" style="animation-name:'+esc(b.animation)+'"':'')+'>';});
    if(c.out==='audio')o='<audio controls src="'+esc(r.url)+'"></audio>';
    if(c.out==='text'){o='<div class="status">'+esc(r.text)+'</div>';if(s==='ai')lastPlan=r.text;}
    $('res').innerHTML=o;
  }catch(e){status(e.message,1);}
  if($('go'))$('go').disabled=false;
}
function upload(){
  $('app').innerHTML=back()+'<div class="card"><h2>Upload</h2><label>Choose images or videos</label><input type="file" id="up" multiple accept="image/*,video/*"><button id="go">Upload</button><div class="status" id="st">Ready.</div></div>';
  $('go').onclick=async function(){
    var fs=$('up').files;if(!fs.length)return status('Choose a file first.',1);
    try{for(var i=0;i<fs.length;i++){if(fs[i].size>3000000)throw new Error(fs[i].name+' is over 3 MB.');status('Uploading '+(i+1)+' of '+fs.length+'...');await api('upload','POST',{name:fs[i].name,data:await readFile(fs[i])});}status('Uploaded. Find it in My Images.');}catch(e){status(e.message,1);}
  };
}
function gallery(){
  $('app').innerHTML=back()+'<div class="card"><h2>My Images</h2><div class="status" id="st">Loading...</div><div class="gal" id="gal"></div></div>';
  api('images').then(function(r){
    if(!r.files.length)return status('No saved images yet. Create or upload one.');
    $('st').style.display='none';
    $('gal').innerHTML=r.files.map(function(f){return f.kind==='video'?'<video controls src="'+esc(f.url)+'"></video>':f.kind==='audio'?'<audio controls src="'+esc(f.url)+'"></audio>':'<img src="'+esc(f.url)+'">';}).join('');
  }).catch(function(e){status(e.message,1);});
}
function plans(){
  $('app').innerHTML=back()+'<div class="card"><h2>Upgrade Plans</h2><div class="status" id="st">Loading...</div><div id="pl"></div></div>';
  api('plans').then(function(r){
    var c=r.costs,paid=r.plans.filter(function(p){return p.price_rs>0;});
    $('st').textContent='Costs in credits: Image '+c.image+' • Sticker '+c.sticker+' • Voice '+c.voice+' • Music '+c.music+' • Motion sticker '+c.motion+' • Video clip '+c.video;
    $('pl').innerHTML=paid.map(function(p){var n=p.credits;return '<div class="plan"><b style="font-size:20px">'+esc(p.name)+'</b><big>Rs. '+p.price_rs+'</big><div style="color:var(--mut)">'+n+' Credits</div><p><span>Images</span><span>Up to '+Math.floor(n/c.image)+'</span></p><p><span>Video clips</span><span>Up to '+Math.floor(n/c.video)+'</span></p><p><span>Music</span><span>Up to '+Math.floor(n/c.music)+' songs</span></p><p><span>Voice</span><span>Up to '+Math.floor(n/c.voice)+'</span></p><p><span>Stickers</span><span>Up to '+Math.floor(n/c.sticker)+'</span></p><button onclick="choose(\\''+p.id+'\\')">Choose Plan</button></div>';}).join('')+'<p class="sub" style="margin-top:14px">Numbers show the most you can make if you spend all your credits on that one feature.</p>';
  }).catch(function(e){status(e.message,1);});
}
function choose(id){api('plans/choose','POST',{plan:id}).catch(function(e){status(e.message,1);window.scrollTo(0,0);});}
function settings(){
  var th=['LION Signature','Sunset','Midnight'];
  $('app').innerHTML=back()+'<div class="card"><h2>Settings</h2><div class="row"><div><b>App Language</b><br><span class="sub">Interface language</span></div><select id="s_l">'+LANGS.map(function(l){return '<option'+(l===me.language?' selected':'')+'>'+l+'</option>';}).join('')+'</select></div><div class="row"><div><b>Theme</b><br><span class="sub">Choose your app appearance</span></div><select id="s_t">'+th.map(function(l){return '<option'+(l===me.theme?' selected':'')+'>'+l+'</option>';}).join('')+'</select></div><div class="row"><div><b>Notifications</b><br><span class="sub">App notifications</span></div><input type="checkbox" id="s_n"'+(me.notifications?' checked':'')+'></div><button id="go">Save Settings</button><button class="alt" onclick="window.open(\\'https://assistant.google.com\\')">Open Google Assistant</button><div class="status" id="st">Ready.</div></div>';
  $('go').onclick=function(){api('me','PUT',{language:$('s_l').value,theme:$('s_t').value,notifications:$('s_n').checked}).then(function(r){me=r;applyTheme();status('Settings saved.');}).catch(function(e){status(e.message,1);});};
}
function account(){
  $('app').innerHTML=back()+'<div class="card"><h2>Account</h2><label>Name</label><input id="a_n" placeholder="Your name" value="'+esc(me.name)+'"><label>Email</label><input id="a_e" type="email" placeholder="you@example.com" value="'+esc(me.email)+'"><div class="row" style="margin-top:14px"><div><b>Current plan</b><br><span class="sub">'+esc(me.plan_id||'free')+'</span></div><b>'+me.credits+' credits</b></div><button onclick="go(\\'plans\\')">Upgrade</button><button class="alt" id="go">Save Account</button><div class="status" id="st">Ready.</div></div>';
  $('go').onclick=function(){api('me','PUT',{name:$('a_n').value,email:$('a_e').value}).then(function(r){me.name=r.name;me.email=r.email;status('Account saved.');}).catch(function(e){status(e.message,1);});};
}
function applyTheme(){document.documentElement.setAttribute('data-theme',me.theme||'');}
api('me').then(function(r){me=r;setCredits(r.credits);applyTheme();go('home');}).catch(function(e){$('app').innerHTML='<div class="status err">Could not connect: '+esc(e.message)+'</div>';});
</script></body></html>`;
