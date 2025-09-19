// ================== Utilities ==================
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const out = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'academy-codelab-web';


const escapeHtml = s =>
  String(s).replace(/[&<>"]/g, c => ({

    '&':'&amp;',

    '<':'&lt;',

    '>':'&gt;',

    '"':'&quot;'
}[c]
));


function log(msg, type='info'){
  const color = type==='error' ? 'var(--err)' : type==='warn' ? 'var(--warn)' : 'var(--brand)';

  const time = new Date().toLocaleTimeString();

  const line = document.createElement('div');

  line.innerHTML = `<span style="color:${color}">[${time}]</span> ${escapeHtml(msg)}`;

  out.appendChild(line); 
  out.scrollTop = out.scrollHeight;
}


function clearOut(){ out.innerHTML=''; }

$('#clearOut')?.addEventListener('click', clearOut);


// ================== ACE Editors (HTML/CSS/JS) ==================
function makeEditor(id, mode){

  const ed = ace.edit(id, {
    theme:'ace/theme/dracula',
    mode, tabSize:2, useSoftTabs:true, showPrintMargin:false, wrap:true
  });


  ed.session.setUseWrapMode(true);//to Make sure line wrapping is always enabled.
  ed.commands.addCommand({
    name:'run', bindKey:{win:'Ctrl-Enter',mac:'Command-Enter'},
    exec(){ runWeb(false); }
  });


  ed.commands.addCommand({
    name:'save',
    bindKey:{win:'Ctrl-S',mac:'Command-S'},
    exec(){ saveProject(); }
  });


  return ed;
}

const ed_html = makeEditor('ed_html','ace/mode/html');
const ed_css  = makeEditor('ed_css','ace/mode/css');
const ed_js   = makeEditor('ed_js','ace/mode/javascript');

// ================== Tabs (robust + a11y) ==================
const TAB_ORDER = ['html','css','js'];

const wraps   = Object.fromEntries($$('#webEditors .editor-wrap').map(w => [w.dataset.pane, w]));
/*wraps = {
    html: <div class="editor-wrap" data-pane="html">...</div>,
    css:  <div class="editor-wrap" data-pane="css">...</div>,
    js:   <div class="editor-wrap" data-pane="js">...</div>
  };*/
const editors = { html: ed_html, css: ed_css, js: ed_js };

function activePane(){
  const t = $('#webTabs .tab.active');
  return t ? t.dataset.pane : 'html';
}


function showPane(name){

  TAB_ORDER.forEach(k => { if(wraps[k]) wraps[k].hidden = (k !== name); });
  $$('#webTabs .tab').forEach(t => {
    const on = t.dataset.pane === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });


  requestAnimationFrame(() => {
    const ed = editors[name];
    if(ed && ed.resize){
         ed.resize(true);
         ed.focus(); 
    }
  });

}

//just added one listener for parent instead of adding for each child element i.e for each tab.
$('#webTabs')?.addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab'); 
  if(!btn) return;
  showPane(btn.dataset.pane);
});

//e.target = the element you actually clicked on 
//(could be the button, or maybe text inside it).

//.closest('.tab') = climbs up the DOM tree until it 
// finds an element with class "tab".

//So btn will be the actual <button class="tab" ...>
//that was clicked.


$('#webTabs')?.addEventListener('keydown', (e)=>{
  const idx = TAB_ORDER.indexOf(activePane());
  if(e.key==='ArrowLeft' || e.key==='ArrowRight'){
    const delta = e.key==='ArrowLeft' ? -1 : 1;
    showPane(TAB_ORDER[(idx+delta+TAB_ORDER.length)%TAB_ORDER.length]);
    e.preventDefault();
  }
});

showPane('html');

// ================== Preview ==================
function buildWebSrcdoc(withTests=false){
  const html  = ed_html.getValue();//gets the value/content from code editor
  const css   = ed_css.getValue();
  const js    = ed_js.getValue();
  const tests = ($('#testArea')?.value || '').trim();

  return `
  <!doctype html>
  
  <html lang="en" dir="ltr">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>${css}\n</style></head>
  <body>${html}

    <script>
        try{
            ${js}
            ${withTests && tests ? `\n/* tests */\n${tests}` : ''}
        }catch(e){
            console.error(e)
        }
    <\/script>

  </body>
  </html>`;
}

//buildWebSrcdoc() takes the user’s HTML, CSS, JS (and optional tests)
//and creates a complete HTML document string.

//runWeb() loads that document into the preview <iframe>.

function runWeb(withTests=false){
  preview.srcdoc = buildWebSrcdoc(withTests);
  log(withTests ? 'Run with tests.' : 'Web preview updated.');
}

$('#runWeb')?.addEventListener('click', ()=>runWeb(false));


$('#runTests')?.addEventListener('click', ()=>runWeb(true));


$('#openPreview')?.addEventListener('click', ()=>{

  const src = buildWebSrcdoc(false);

  const w = window.open('about:blank');

  w.document.open();
  w.document.write(src);
  w.document.close();
});

// ================== Save / Load (Web-only) ==================
function projectJSON(){
  return {
    version: 1,
    kind: 'web-only',
    assignment: $('#assignment')?.value || '',
    test: $('#testArea')?.value || '',
    html: ed_html.getValue(),
    css:  ed_css.getValue(),
    js:   ed_js.getValue()
  };
}


function loadProject(obj){

  try{

    if($('#assignment')) $('#assignment').value = obj.assignment || '';

    if($('#testArea'))   $('#testArea').value   = obj.test || '';

    ed_html.setValue(obj.html || '', -1);

    ed_css.setValue(obj.css   || '', -1);

    ed_js.setValue(obj.js     || '', -1);

    log('Web project loaded.');

  }catch(e){ log('Unable to load project: '+e, 'error'); }

}


function setDefaultContent(){
  ed_html.setValue(`<!-- Welcome card -->
<section class="card" style="max-width:520px;margin:24px auto;padding:18px;text-align:center">
  <h1>Welcome to the Academy</h1>
  <p>This example runs locally in the browser.</p>
  <button id="btn">Try me</button>
</section>`, -1);

  ed_css.setValue(`body{font-family:system-ui;background:#f7fafc;margin:0}
h1{color:#0f172a}
#btn{padding:.75rem 1rem;border:0;border-radius:10px;background:#60a5fa;color:#08111f;font-weight:700}`, -1);

  ed_js.setValue(`document.getElementById('btn').addEventListener('click',()=>alert('Well done!'));
console.log('Hello from JavaScript!');`, -1);
}


function saveProject(){
  try{
    const data = JSON.stringify(projectJSON(), null, 2);
    localStorage.setItem(STORAGE_KEY, data);
    const blob = new Blob([data], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'academy-web.json';
    a.click();
    log('Saved locally and downloaded JSON file.');
  }catch(e){ log('Unable to save: '+e, 'error'); }
}


$('#saveBtn')?.addEventListener('click', saveProject);
$('#loadBtn')?.addEventListener('click', ()=> $('#openFile').click());
$('#openFile')?.addEventListener('change', async (e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    try{
        const obj = JSON.parse(await f.text());
        loadProject(obj);
    }catch(err){
        log('Invalid project file', 'error');
    }
});