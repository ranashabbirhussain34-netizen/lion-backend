const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lion AI</title>
<style>
  :root { --bg:#14110d; --card:#221d16; --gold:#f2b134; --text:#f5efe4; --muted:#a99f8f; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,sans-serif; background:var(--bg); color:var(--text); }
  .wrap { max-width:520px; margin:0 auto; padding:16px; }
  h1 { margin:8px 0 2px; color:var(--gold); font-size:26px; }
  .credits { color:var(--muted); font-size:14px; margin-bottom:14px; }
  .tabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; }
  .tab { flex:0 0 auto; padding:8px 14px; border-radius:20px; border:1px solid #3a3226; background:var(--card); color:var(--text); font-size:14px; }
  .tab.on { background:var(--gold); color:#1a1408; border-color:var(--gold); font-weight:600; }
  .card { background:var(--card); border-radius:16px; padding:14px; margin-top:12px; }
  textarea { width:100%; min-height:110px; border-radius:12px; border:1px solid #3a3226; background:#17130e; color:var(--text); padding:12px; font-size:16px; resize:vertical; }
  .row { display:flex; gap:8px; margin-top:10px; }
  .voice { flex:1; padding:10px; border-radius:12px; border:1px solid #3a3226; background:#17130e; color:var(--text); font-size:14px; }
  .voice.on { border-color:var(--gold); color:var(--gold); font-weight:600; }
  button.go { width:100%; margin-top:12px; padding:14px; border:0; border-radius:12px; background:var(--gold); color:#1a1408; font-size:17px; font-weight:700; }
  button.go:disabled { opacity:.5; }
  #msg { margin-top:12px; font-size:15px; color:var(--muted); min-height:20px; }
  #msg.err { color:#ff8a7a; }
  audio { width:100%; margin-top:12px; }
  .hide { display:none; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Lion AI</h1>
  <div class="credits">Credits: <b id="cr">-</b></div>
  <div class="tabs" id="tabs"></div>
  <div class="card">
    <textarea id="p" placeholder="Write here..."></textarea>
    <div class="row hide" id="voices"></div>
    <button class="go" id="go">Create</button>
    <div id="msg"></div>
    <audio id="au" class="hide" controls></audio>
  </div>
</div>
<script>
var TYPES = [["voice","Voice"],["image","Image"],["sticker","Sticker"],["music","Music"],["motion","Motion"],["video","Video"]];
var VOICES = ["Female","Male","Child"];
var type = "voice", voice = "Female";
var uid = "guest";
try {
  uid = localStorage.getItem("lion_uid");
  if (!uid) { uid = "u" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("lion_uid", uid); }
} catch (e) { uid = "guest"; }

var $ = function (id) { return document.getElementById(id); };

function drawTabs() {
  var t = $("tabs"); t.innerHTML = "";
  TYPES.forEach(function (x) {
    var b = document.createElement("button");
    b.className = "tab" + (x[0] === type ? " on" : "");
    b.textContent = x[1];
    b.onclick = function () { type = x[0]; drawTabs(); drawVoices(); $("msg").textContent = ""; $("au").classList.add("hide"); };
    t.appendChild(b);
  });
}
function drawVoices() {
  var v = $("voices"); v.innerHTML = "";
  if (type !== "voice") { v.classList.add("hide"); return; }
  v.classList.remove("hide");
  VOICES.forEach(function (name) {
    var b = document.createElement("button");
    b.className = "voice" + (name === voice ? " on" : "");
    b.textContent = name;
    b.onclick = function () { voice = name; drawVoices(); };
    v.appendChild(b);
  });
}
function show(text, isErr) { var m = $("msg"); m.textContent = text; m.className = isErr ? "err" : ""; }

function loadMe() {
  fetch("/api/me?uid=" + encodeURIComponent(uid))
    .then(function (r) { return r.json(); })
    .then(function (d) { $("cr").textContent = d.credits; })
    .catch(function () { $("cr").textContent = "?"; });
}

$("go").onclick = function () {
  var text = $("p").value.trim();
  if (!text) { show("Write something first.", true); return; }
  var btn = $("go");
  btn.disabled = true; show("Working... please wait."); $("au").classList.add("hide");
  fetch("/api/generate/" + type, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ uid: uid, p: text, f2: voice })
  })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
    .then(function (res) {
      if (!res.ok) { show(res.d.error || "Something went wrong.", true); return; }
      if (res.d.credits !== undefined) $("cr").textContent = res.d.credits;
      show(res.d.message || "Done.");
      if (res.d.audio) { var a = $("au"); a.src = res.d.audio; a.classList.remove("hide"); a.play().catch(function () {}); }
    })
    .catch(function () { show("Could not reach server. Check your internet and try again.", true); })
    .then(function () { btn.disabled = false; });
};

drawTabs(); drawVoices(); loadMe();
</script>
</body>
</html>`;

export default html;
