
function createPitCombat(deps){ "use strict";
/* ============ CORE — ported from the-pit-of-karridge.html. THE SOURCE IS LAW: do not rebalance. ============ */
const D=deps||{};
const UI=Object.assign({stats(){},btnLabel(){},flash(){},banner(){},screen(){},hud(){},controls(){},name(){},boss(){},hpbar(){},bossbar(){},cds(){},demoCap(){},intro(){}},D.ui||{});
const NOW=D.now||(()=>Date.now());
const _stub2d=()=>new Proxy({},{get:(t,k)=>(k==='createRadialGradient'?(()=>({addColorStop(){}})):()=>{}),set:()=>true});
const ctx=D.ctx||null,dctx=D.dctx||_stub2d();
const THEME=Object.assign({backdrop:'#06040a',star:'rgba(120,100,140,.14)',ringBase:0.34,ringStep:0.06,
  ringCol:'255,90,140',crowdCol:'240,168,61',floor:'#100d18',rim:'#ff5a8c',rivet:'#ffd0e0',
  showCrowd:true},D.theme||{});
let W=0,H=0,DPR=1,arena={x:0,y:0,r:0};
// cinematic camera (declared before resize, which runs at load)
const cam={x:0,y:0,z:1,tx:0,ty:0,tz:1,hold:0};
let letterbox=0;
function camFocus(x,y,z,hold){cam.tx=x;cam.ty=y;cam.tz=z;cam.hold=hold||0;}
function resize(w,h){
  W=w;H=h; // host owns canvas sizing/DPR; logic+draw run in logical coords
  arena.x=W/2;arena.y=H/2;arena.r=Math.min(W,H)*0.42;
  cam.x=cam.tx=W/2;cam.y=cam.ty=H/2;cam.z=cam.tz=1;cam.hold=0;
}
resize(D.width||1280,D.height||720);

const rnd=(a,b)=>a+Math.random()*(b-a);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ang=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const clampArena=(e)=>{const d=Math.hypot(e.x-arena.x,e.y-arena.y),max=arena.r-e.r;
  if(d>max){const a=Math.atan2(e.y-arena.y,e.x-arena.x);e.x=arena.x+Math.cos(a)*max;e.y=arena.y+Math.sin(a)*max;}};
const MODS={dmg:1,maxhp:1,parryWin:1,dodgeWin:1};
function setMods(m){Object.assign(MODS,m||{});}
function rollDice(n,s){let t=0;for(let i=0;i<n;i++)t+=1+Math.floor(Math.random()*s);return Math.round(t*MODS.dmg);}
const vib=(ms)=>{if(D.vibrate)D.vibrate(ms);};

/* ============ STATE ============ */
const S={mode:'title',fight:0,shake:0,hitPause:0,time:0,slow:0,fatal:false};
const KILLWORDS=['SLICED','UNMADE','HALVED','CARVED','REAPED','SUNDERED','GUTTED','SPLIT','ENDED','RIBBONS'];
let kwIdx=Math.floor(Math.random()*KILLWORDS.length);
let limbs=[]; // flying dismembered pieces
const P={x:0,y:0,r:16,face:0,hp:45,kills:0,
  base:{STR:10,DEX:10,CON:10,ATK:10},
  char:'ronin',form:'human',formCD:0,heavyCDmax:2.2,wolfCD:0,
  rollT:0,rollCD:0,heavyCD:0,atkT:0,atkRecover:0,heavyWind:0,flash:0,dead:false,
  parryT:0,parryCD:0,ripoT:0,combo:0,comboT:0,atkPose:0,
  ft:{dmgTaken:0,heavy:0,slash:0,rolls:0,parries:0,t0:0,low:false}};
let wolves=[],demons=[],fireballs=[],tracers=[];
const lvl=()=>Math.min(10,Math.floor(P.level||1));
let buffs=[]; // {k,amt,until} from belt potions
const buffAmt=k=>{let a=0;for(const b of buffs)if(b.k===k&&b.until>S.time)a+=b.amt;return a;};
const stat=k=>(P.char==='ronin'?P.base[k]+P.kills*2:P.base[k]+3*(lvl()-1))+buffAmt(k);
function usePotion(type){
  if(P.dead)return false;
  if(type==='potion-health'){const hl=Math.round(maxHP()*0.5);P.hp=Math.min(maxHP(),P.hp+hl);
    popup(P.x,P.y-48,'+'+hl,'#7fbf6a',16);flashFx(.12);return true;}
  const k={'potion-str':'STR','potion-dex':'DEX','potion-con':'CON','potion-atk':'ATK'}[type];
  if(!k)return false;
  const amt=Math.round(stat(k)*0.25);
  buffs=buffs.filter(b=>b.k!==k);
  buffs.push({k,amt,until:S.time+60});
  popup(P.x,P.y-48,k+' +25% — 60s','#3df0c8',14);flashFx(.1);return true;}
const maxHP=()=>Math.round(((P.char==='ronin'?38:45)+(stat('CON')-10)*5)*MODS.maxhp);
const UNLOCKS={druid:{3:'BEAR FORM UNLOCKED',6:'WOLF FORM UNLOCKED'},
               warlock:{3:'BONE DRAGON UNLOCKED',5:'SUCCUBI UNLOCKED',8:'ARCH DEVIL UNLOCKED'},
               seraph:{3:'CHAINS OF DECREE',6:'TRIUNE MAW',8:'HALO JUDGEMENT'}};
function gainLevel(){ // +1.5 levels per kill, max 10
  if(P.char==='ronin')return;
  const ol=lvl();
  P.level=Math.min(10,(P.level||1)+1.5);
  if(lvl()>ol){
    const u=(UNLOCKS[P.char]||{})[lvl()];
    showBanner('LEVEL '+lvl(),u?u.toLowerCase():'',u?1500:900,'#3df0c8');
    if(u){P.unlockMsg=u;flashFx(.2);vib([40,40,80]);}
    popup(P.x,P.y-64,'LEVEL '+lvl(),'#3df0c8',18);}
  UI.stats(diceN()+'d8','LV '+lvl()+' · KILLS '+P.kills);}
// ronin weapon forms: stats double from 10 -> 20 (NODACHI) -> 40 (ODACHI). Permanent.
const roninTier=()=>P.char!=='ronin'?0:(stat('STR')>=40?2:(stat('STR')>=20?1:0));
function checkRoninForm(){
  if(P.char!=='ronin')return;
  const t=roninTier();
  if(t===(P.bladeTier||0))return;
  P.bladeTier=t;
  P.r=[16,19,23][t];
  flashFx(.3);S.shake=Math.max(S.shake,10);vib([50,60,90]);
  leafBurst(P.x,P.y,22,'#e7b450');
  showBanner(t===2?'ODACHI':'NODACHI',
    t===2?'the blade is taller than the man was':'the blade grows with its legend',1600,'#e7b450');}
const dmgBonus=()=>6+Math.floor((stat('STR')-10)/2)+P.kills;
const moveSpd=()=>185+(stat('DEX')-10)*4;
const rollCDmax=()=>Math.max(.55,1.15-(stat('DEX')-10)*.035);
const atkRec=()=>Math.max(.17,.34-(stat('ATK')-10)*.009);
const diceN=()=>P.char==='ronin'?1+P.kills:lvl();
let nickname='NOBODY',styleScore={untouched:0,headsman:0,quicksand:0,breath:0,corpse:0,mirror:0};

let enemies=[],particles=[],popups=[],zones=[],swings=[],bullets=[];
let nickname2=null;

/* ============ INPUT (host scene writes into these; see api) ============ */
const keys={};let mouse={x:0,y:0,down:false};
const stick={id:null,ox:0,oy:0,dx:0,dy:0,mag:0};

/* ============ PLAYER ACTIONS ============ */
function nearestFoe(){let best=null,bd=1e9;for(const e of enemies){if(e.dead)continue;const d=dist(P,e);if(d<bd){bd=d;best=e;}}return best;}
function nearestRealFoe(){ // nearest enemy that is NOT a summon; falls back to summons if none left
  let best=null,bd=1e9;
  for(const e of enemies){if(e.dead||e.minion)continue;const d=dist(P,e);if(d<bd){bd=d;best=e;}}
  if(!best)for(const e of enemies){if(e.dead)continue;const d=dist(P,e);if(d<bd){bd=d;best=e;}}
  return best;}
function autoFace(){const f=nearestRealFoe();if(f)P.face=ang(P,f);}
function doSlash(){if(S.mode!=='fight'&&S.mode!=='demo'||P.dead||P.atkRecover>0||P.heavyWind>0||P.rollT>0||P.channel||P.paralyzeT>0)return;
  if(P.char==='warlock'){
    if(P.devilT>0){devilClaw();return;} // CLAW — rolls to the target, then massive hit
    autoFace();hexBolt();return;}
  if(P.char==='druid'){autoFace();druidSlash();return;}
  if(P.char==='seraph'){autoFace();seraphSlash();return;}
  autoFace();P.atkRecover=atkRec();P.ft.slash++;
  if(P.comboT<=0)P.combo=0;
  const st=P.combo;P.atkPose=st;P.combo=(P.combo+1)%3;P.comboT=1.1;
  // kendo rhythm: kesa-giri right, kesa-giri left, men overhead finisher
  const arc=st===2?1.15:1.7, range=(st===2?88:74)+roninTier()*12, mult=st===2?1.25:1;
  let dmg=Math.round((rollDice(diceN(),8)+dmgBonus())*mult*0.88);
  swings.push({x:P.x,y:P.y,a:P.face,arc,range,t:st===2?.16:.14,heavy:st===2,col:st===2?'#e7d9a8':'#d8cdb8',style:st});
  strike(P.face,arc,range,dmg,false);}
function doParry(){if(S.mode!=='fight'&&S.mode!=='demo'||P.dead||P.rollT>0||P.heavyWind>0||P.channel||P.paralyzeT>0)return;
  if(P.char==='druid'){cycleForm();return;}
  if(P.parryCD>0)return;
  if(P.char==='warlock'){portal();return;}
  if(P.char==='seraph'){ascend();return;}
  autoFace();P.parryT=2.3*MODS.parryWin;P.parryCD=1.4;}

/* ============ DRUID ============ */
function setBtnLabel(id,txt){UI.btnLabel(id,txt);}
function updateLabels(){
  if(P.char==='ronin'){setBtnLabel('bSlash','SLASH');setBtnLabel('bHeavy','HEAVY');setBtnLabel('bParry','PARRY');setBtnLabel('bRoll','ROLL');return;}
  if(P.char==='warlock'){
    if(P.devilT>0){setBtnLabel('bSlash','CLAW');setBtnLabel('bHeavy','BITE');}
    else{setBtnLabel('bSlash','HEX');setBtnLabel('bHeavy','SUMMON');}
    setBtnLabel('bParry','PORTAL');setBtnLabel('bRoll','BLINK');return;}
  if(P.char==='seraph'){setBtnLabel('bSlash','SPEAR');setBtnLabel('bHeavy','HALO RAY');
    setBtnLabel('bParry','ASCEND');setBtnLabel('bRoll','ROLL');return;}
  setBtnLabel('bParry','FORM');setBtnLabel('bRoll','ROLL');
  if(P.form==='human'){setBtnLabel('bSlash','GLAIVE');setBtnLabel('bHeavy','VINES');}
  else if(P.form==='bear'){setBtnLabel('bSlash','CLAW');setBtnLabel('bHeavy','ROAR');}
  else{setBtnLabel('bSlash','BITE');setBtnLabel('bHeavy','HOWL');}}
function leafBurst(x,y,n,col){for(let i=0;i<n&&particles.length<240;i++){
  const a=rnd(0,Math.PI*2),s=rnd(50,170);
  particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:rnd(.3,.7),col:col||'#7fbf6a',r:rnd(1.5,3)});}}
function cycleForm(){
  if(P.formCD>0)return;
  if(P.form==='human'){
    if(lvl()<3){popup(P.x,P.y-44,'BEAR FORM AT LEVEL 3','#8a93a8',12);return;}
    if(P.humanCD>0){popup(P.x,P.y-44,'NOT YET — '+Math.ceil(P.humanCD)+'s','#8a93a8',12);return;}
    P.formCD=.5;enterForm('bear');return;}
  if(P.form==='bear'){P.formCD=.5;
    if(lvl()<6){popup(P.x,P.y-44,'WOLF FORM AT LEVEL 6','#8a93a8',12);revertToHuman();return;}
    enterForm('wolf');return;} // timer resets on switch
  P.formCD=.5;revertToHuman();} // wolf → human by hand
function enterForm(f){
  P.form=f;P.r=f==='bear'?22:18;P.formT=6;
  if(P.glaive){P.glaive=null;leafBurst(P.x,P.y,5);} // blade dissolves on shift
  leafBurst(P.x,P.y,18);S.shake=Math.max(S.shake,4);vib(25);flashFx(.1);
  showBanner(f.toUpperCase()+' FORM','6 seconds',650,'#7fbf6a');
  if(f==='wolf'&&P.wolfCD<=0){
    P.wolfCD=10;
    for(let i=0;i<3;i++){const a=rnd(0,Math.PI*2);
      wolves.push({x:P.x+Math.cos(a)*40,y:P.y+Math.sin(a)*40,r:11,face:a,
        hp:20+P.kills*4,maxhp:20+P.kills*4,life:14,cool:rnd(.4,1),lungeT:0,bit:false,walkP:0});}
    popup(P.x,P.y-46,'THE PACK ANSWERS','#7fbf6a',15);}
  updateLabels();}
function revertToHuman(){
  P.form='human';P.r=16;P.formT=0;P.humanCD=5;
  leafBurst(P.x,P.y,14);vib(20);
  showBanner('HUMAN FORM','the wild needs 5s to gather again',800,'#7fbf6a');
  updateLabels();}
function druidSlash(){
  P.ft.slash++;
  if(P.form==='bear'){ // CLAW — heavy sweep
    autoFace();P.atkRecover=atkRec()*1.35;
    swings.push({x:P.x,y:P.y,a:P.face,arc:2.1,range:88,t:.17,heavy:true,col:'#c98a4a'});
    strike(P.face,2.1,88,Math.round((rollDice(diceN(),8)+dmgBonus())*1.45),true);
  }else if(P.form==='wolf'){ // BITE — lunge
    autoFace();P.atkRecover=atkRec()*.75;
    P.x+=Math.cos(P.face)*46;P.y+=Math.sin(P.face)*46;clampArena(P);
    swings.push({x:P.x,y:P.y,a:P.face,arc:1.3,range:62,t:.12,heavy:false,col:'#9ab8a0'});
    strike(P.face,1.3,62,Math.round((rollDice(diceN(),8)+dmgBonus())*.7),false);
  }else{ // human — throw the twin-blade glaive
    throwGlaive();}}
function throwGlaive(){
  if(P.glaive)return; // blade is still in flight — wait for the catch
  if(P.comboT<=0)P.combo=0;
  const pat=P.combo;P.combo=(P.combo+1)%3;P.comboT=2.4;
  P.atkRecover=.22;
  P.glaive={t:0,rot:0,p:pat,fa:P.face,x:P.x,y:P.y,cd:{}};
  popup(P.x,P.y-42,['PIERCE','CRESCENT','CYCLONE'][pat],'#7fbf6a',12);
  vib(12);}
function updGlaive(dt){
  const g=P.glaive;if(!g)return;
  g.t+=dt;g.rot+=22*dt;
  for(const k in g.cd)g.cd[k]-=dt;
  let done=false,px=g.x,py=g.y;
  if(g.p===0){ // PIERCE: straight out, homing return — slices both passes
    const T1=.3,T2=.3;
    if(g.t<T1){const d=(g.t/T1)*195;px=P.x+Math.cos(g.fa)*d;py=P.y+Math.sin(g.fa)*d;}
    else if(g.t<T1+T2){const d=(1-((g.t-T1)/T2))*195;px=P.x+Math.cos(g.fa)*d;py=P.y+Math.sin(g.fa)*d;}
    else done=true;
  }else if(g.p===1){ // CRESCENT: boomerang arc sweeping across the front
    const T=.85;
    if(g.t>=T)done=true;
    else{const u=g.t/T,th=g.fa-1.0+2.0*u,rad=Math.sin(Math.PI*u)*175;
      px=P.x+Math.cos(th)*rad;py=P.y+Math.sin(th)*rad;}
  }else{ // CYCLONE: two full orbits around her
    const T=1.05;
    if(g.t>=T)done=true;
    else{const u=g.t/T,th=g.fa+u*Math.PI*4,rad=Math.sin(Math.PI*u)*118;
      px=P.x+Math.cos(th)*rad;py=P.y+Math.sin(th)*rad;}}
  if(done){P.glaive=null;leafBurst(P.x,P.y,4);return;}
  g.x=px;g.y=py;
  // spin trail
  if(particles.length<240)particles.push({x:g.x,y:g.y,vx:0,vy:0,t:.16,col:'#7fbf6a',r:2.5});
  // area slicing — each enemy can be cut again after 0.5s (out-pass and back-pass both hit)
  enemies.forEach((e,i)=>{if(e.dead)return;
    if((g.cd[i]||0)>0)return;
    if(Math.hypot(g.x-e.x,g.y-e.y)<26+e.r*.4){
      g.cd[i]=.5;
      const d=Math.round((rollDice(diceN(),8)+dmgBonus())*0.52);
      e.hp-=d;e.flash=.12;blood(e.x,e.y,5);
      popup(e.x+rnd(-6,6),e.y-26,d,'#a8e0a0',13);
      S.hitPause=Math.max(S.hitPause,.02);vib(10);
      swings.push({x:g.x,y:g.y,a:Math.atan2(e.y-g.y,e.x-g.x),arc:1.4,range:30,t:.1,heavy:false,col:'#9ad0a0'});
      if(e.hp<=0)killEnemy(e,false);}});}
function drawGlaive(g){
  ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.rot);
  ctx.lineCap='round';
  ctx.strokeStyle='#5a4a36';ctx.lineWidth=3.5; // handle
  ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.stroke();
  ctx.strokeStyle='#d8e4d0';ctx.lineWidth=3; // twin curved blades
  ctx.beginPath();ctx.arc(14,-5,9,Math.PI*0.4,Math.PI*1.25);ctx.stroke();
  ctx.beginPath();ctx.arc(-14,5,9,Math.PI*1.4,Math.PI*2.25);ctx.stroke();
  ctx.strokeStyle='rgba(127,191,106,.8)';ctx.lineWidth=1.2; // green edge glint
  ctx.beginPath();ctx.arc(14,-5,11,Math.PI*0.5,Math.PI*1.1);ctx.stroke();
  ctx.beginPath();ctx.arc(-14,5,11,Math.PI*1.5,Math.PI*2.1);ctx.stroke();
  ctx.restore();}
function druidHeavy(){
  if(P.form==='human'){ // GRASPING VINES + retreat — own cooldown
    if(P.cdVines>0)return;
    P.ft.heavy++;P.cdVines=3;
    let rooted=0;
    for(const e of enemies){if(e.dead)continue;
      if(dist(P,e)<165){e.stunT=Math.max(e.stunT||0,5.2);e.vined=5.2;rooted++;
        leafBurst(e.x,e.y,8);popup(e.x,e.y-30,'ROOTED','#7fbf6a',13);
        strikeOne(e,rollDice(1,8)+Math.floor(dmgBonus()/2));}}
    // retreat hop away from nearest threat
    const f=nearestFoe();
    const a=f?ang(f,P):P.face+Math.PI;
    P.x+=Math.cos(a)*115;P.y+=Math.sin(a)*115;clampArena(P);
    leafBurst(P.x,P.y,12);S.shake=Math.max(S.shake,4);vib(30);
    if(!rooted)popup(P.x,P.y-44,'VINES FIND NO ONE','#7fbf6a',12);
  }else if(P.form==='bear'){ // ROAR — AOE stagger + knockback — own cooldown
    if(P.cdRoar>0)return;
    P.ft.heavy++;P.cdRoar=4;
    swings.push({x:P.x,y:P.y,a:0,arc:7,range:140,t:.22,heavy:true,col:'#c98a4a',ring:true});
    S.shake=Math.max(S.shake,10);vib(60);flashFx(.12);
    for(const e of enemies){if(e.dead)continue;
      if(dist(P,e)<145){e.stunT=Math.max(e.stunT||0,1.0);
        const a=ang(P,e);e.x+=Math.cos(a)*75;e.y+=Math.sin(a)*75;clampArena(e);
        strikeOne(e,Math.round(rollDice(1,6)+dmgBonus()*.5));}}
    popup(P.x,P.y-50,'ROAR','#c98a4a',20);
  }else{ // wolf HOWLING HEAL — own cooldown, doubled strength
    if(P.cdHowl>0)return;
    P.ft.heavy++;P.cdHowl=6;
    const amt=24+P.kills*4;
    P.hp=Math.min(maxHP(),P.hp+amt);
    popup(P.x,P.y-48,'HOWL  +'+amt,'#7fbf6a',17);
    for(const w of wolves){w.hp=w.maxhp;w.life=Math.min(16,w.life+6);
      popup(w.x,w.y-22,'+','#7fbf6a',12);}
    swings.push({x:P.x,y:P.y,a:0,arc:7,range:120,t:.3,heavy:false,col:'#7fbf6a',ring:true});
    vib(35);}}
function strikeOne(e,dmg){ // direct damage helper (vines/roar) — no shield/parry rules
  e.hp-=dmg;e.flash=.12;
  popup(e.x+rnd(-8,8),e.y-26,dmg,'#a8c89a',13);
  blood(e.x,e.y,4);
  if(e.hp<=0)killEnemy(e,false);}
/* ============ WARLOCK ============ */
function demonTaunt(){return demons.find(d=>d.type==='brute'&&d.hp>0);}
function hexBolt(){
  if(P.hexCD>0){popup(P.x,P.y-44,'HEX — '+Math.ceil(P.hexCD)+'s','#8a93a8',12);return;}
  P.hexCD=10;
  P.ft.slash++;P.atkRecover=atkRec()*1.1;
  const f=nearestFoe();if(f)P.face=ang(P,f);
  fireballs.push({x:P.x+Math.cos(P.face)*14,y:P.y+Math.sin(P.face)*14-18,
    vx:Math.cos(P.face)*420,vy:Math.sin(P.face)*420,r:5,kind:'hex'});
  vib(10);}
function startChannel(){
  if(P.channel||P.heavyCD>0||P.devilT>0)return;
  P.channel={t:0,b:false,d:false,any:false};P.ft.heavy++;
  popup(P.x,P.y-48,'CHANNELING...','#b070f0',12);}
function releaseChannel(){
  if(!P.channel)return;
  if(!P.channel.any)popup(P.x,P.y-44,'FIZZLE','#8a93a8',12);
  P.channel=null;}
function portal(){
  const fs=enemies.filter(e=>!e.dead);
  if(!fs.length)return;
  P.parryCD=3;P.ft.rolls++;
  fs.sort((a,b)=>dist(P,b)-dist(P,a));
  const e=fs[0]; // the furthest enemy
  leafBurst(P.x,P.y,12,'#b070f0');leafBurst(e.x,e.y,12,'#b070f0');
  const px2=P.x,py2=P.y;
  P.x=e.x;P.y=e.y;e.x=px2;e.y=py2;
  clampArena(P);clampArena(e);
  e.stunT=Math.max(e.stunT||0,0.6); // disoriented by the swap
  P.wardT=3; // magic shield: untouchable and uninterruptible
  popup(P.x,P.y-58,'WARDED','#5ad2ff',13);
  popup(P.x,P.y-44,'PORTAL','#b070f0',14);
  popup(e.x,e.y-30,'SWAPPED','#b070f0',11);
  S.shake=Math.max(S.shake,5);vib(35);flashFx(.12);}
function summonDemons(type){
  // demons STACK — keep summoning; oldest dissolves past the cap of 12
  while(demons.length>=12){const old=demons.shift();leafBurst(old.x,old.y,8,'#b070f0');}
  flashFx(.1);S.shake=Math.max(S.shake,6);vib([30,50]);
  if(type==='brute'){
    const a=P.face;
    demons.push({type:'brute',x:P.x+Math.cos(a)*55,y:P.y+Math.sin(a)*55,r:24,face:a,
      hp:30+P.kills*5,maxhp:30+P.kills*5,life:18,cool:1,flash:0,walkP:0});
    showBanner('CLAW FIEND','it hungers — they fight IT now',1300,'#b070f0');
  }else if(type==='dragon'){
    demons.push({type:'dragon',x:P.x,y:P.y-60,r:18,face:P.face,
      hp:20+P.kills*3,maxhp:20+P.kills*3,life:15,cool:1.2,flash:0,walkP:0});
    showBanner('BONE DRAGON','poison breath — the rot spreads',1300,'#7fd05a');
  }else{
    for(let i=0;i<3;i++){const a=i*2.09;
      demons.push({type:'succubus',x:P.x+Math.cos(a)*55,y:P.y+Math.sin(a)*55,r:10,face:a,slot:a,
        hp:10+P.kills*2,maxhp:10+P.kills*2,life:14,cool:rnd(.5,2),flash:0,walkP:0});}
    showBanner('THE COVEN','three answer — fire and mending',1400,'#f06aa0');}}
function hurtDemon(d,dmg,from){
  d.hp-=dmg;d.flash=.12;
  popup(d.x+rnd(-6,6),d.y-d.r-12,dmg,'#d0a8f0',12);}
function updDemons(dt){
  for(let i=demons.length-1;i>=0;i--){const d=demons[i];
    d.life-=dt;d.flash=Math.max(0,d.flash-dt);
    if(d.life<=0||d.hp<=0){leafBurst(d.x,d.y,12,'#b070f0');
      popup(d.x,d.y-20,'UNSUMMONED','#b070f0',12);demons.splice(i,1);continue;}
    d.cool-=dt;
    const tgt=enemies.filter(e=>!e.dead).sort((a,b)=>dist(d,a)-dist(d,b))[0];
    if(d.type==='brute'){
      if(!tgt)continue;
      const dd=dist(d,tgt);d.face=ang(d,tgt);
      if(dd>d.r+tgt.r+10){d.x+=Math.cos(d.face)*95*dt;d.y+=Math.sin(d.face)*95*dt;}
      else if(d.cool<=0){d.cool=1.4;
        swings.push({x:d.x,y:d.y,a:d.face,arc:2.0,range:d.r+36,t:.16,heavy:true,col:'#d05a6a'});
        S.shake=Math.max(S.shake,4);
        for(const e of enemies){if(e.dead)continue;
          if(dist(d,e)<d.r+e.r+30){ // pure aggro tank: token damage, big shove
            const pa=ang(d,e);e.x+=Math.cos(pa)*70;e.y+=Math.sin(pa)*70;clampArena(e);
            e.hp-=1;e.flash=.1;
            popup(e.x,e.y-26,'SHOVED','#d05a6a',11);
            if(e.hp<=0)killEnemy(e,false);}}}
    }else if(d.type==='dragon'){
      d.y+=Math.sin(S.time*3)*0.4; // hover
      if(!tgt)continue;
      const dd=dist(d,tgt);d.face=ang(d,tgt);
      if(dd>160){d.x+=Math.cos(d.face)*80*dt;d.y+=Math.sin(d.face)*80*dt;}
      else if(dd<100){d.x-=Math.cos(d.face)*60*dt;d.y-=Math.sin(d.face)*60*dt;}
      if(d.cool<=0&&dd<220){d.cool=3.2;
        for(let k=0;k<16&&particles.length<240;k++){ // breath cone FX
          const ba=d.face+rnd(-.5,.5),bs=rnd(80,240);
          particles.push({x:d.x+Math.cos(d.face)*d.r,y:d.y+Math.sin(d.face)*d.r,
            vx:Math.cos(ba)*bs,vy:Math.sin(ba)*bs,t:rnd(.4,.8),col:'#7fd05a',r:rnd(2,4),noG:true});}
        vib(20);
        // the breath lays a LINGERING gas cloud — paralytic, near-harmless, only inside it
        zones.push({x:d.x+Math.cos(d.face)*120,y:d.y+Math.sin(d.face)*120,r:110,tele:0,life:4,type:'gas'});}
    }else{ // succubus: orbit the warlock, mend or hurl fire
      if(d.arch){ // the gift has a fuse
        d.archT-=dt;
        const sec=Math.ceil(d.archT);
        if(sec<=5&&sec!==d.archWarn){d.archWarn=sec;
          popup(d.x,d.y-d.r-30,'BURSTS IN '+sec,'#d03a4a',19);vib(25);}
        if(d.archT<=0){ // EXPLOSION — kills her, damages everyone in range
          const EX=Math.round((rollDice(diceN(),8)+dmgBonus())*2.3),ER=175;
          flashFx(.35);S.shake=Math.max(S.shake,16);vib([60,50,110]);
          swings.push({x:d.x,y:d.y,a:0,arc:7,range:ER,t:.3,heavy:true,col:'#f06aa0',ring:true});
          for(let k=0;k<26&&particles.length<240;k++){const ea2=rnd(0,6.3),es=rnd(120,340);
            particles.push({x:d.x,y:d.y,vx:Math.cos(ea2)*es,vy:Math.sin(ea2)*es,t:rnd(.3,.7),
              col:k%2?'#f06aa0':'#d03a4a',r:rnd(2,4.5)});}
          showBanner('SHE BURSTS','everything near her pays',1100,'#d03a4a');
          if(dist(d,P)<ER)hurtPlayer(EX,null); // ward or distance saves you
          for(const e of enemies){if(e.dead)continue;
            if(dist(d,e)<ER){e.hp-=EX;e.flash=.16;blood(e.x,e.y,8);
              popup(e.x,e.y-30,EX,'#f06aa0',15);
              if(e.hp<=0)killEnemy(e,false);}}
          for(const o of demons){if(o===d||o.hp<=0)continue;
            if(dist(d,o)<ER)hurtDemon(o,EX,null);}
          d.hp=0;d.life=0;continue;}}
      if(d.arch){d.x=d.mineX;d.y=d.mineY;} // a ticking land mine — she holds her ground
      else{d.slot+=dt*.8;
      const ox=P.x+Math.cos(d.slot)*58,oy=P.y+Math.sin(d.slot)*58;
      d.x+=(ox-d.x)*3*dt;d.y+=(oy-d.y)*3*dt+Math.sin(S.time*4+d.slot)*0.5;}
      d.face=tgt?ang(d,tgt):d.slot;
      if(d.cool<=0){d.cool=d.arch?1.1:2.2; // the arch succubus works twice as fast
        if(P.hp<maxHP()){
          const amt=6;P.hp=Math.min(maxHP(),P.hp+amt);
          tracers.push({x1:d.x,y1:d.y-12,x2:P.x,y2:P.y-16,t:.3,col:'#f06aa0'});
          popup(P.x,P.y-46,'+'+amt,'#f06aa0',13);
        }else if(tgt){
          fireballs.push({x:d.x,y:d.y-10,vx:Math.cos(d.face)*360,vy:Math.sin(d.face)*360,
            r:6,kind:'fire',dmg:Math.round((rollDice(diceN(),8)+dmgBonus())*1.3)});}}}
    const mv=Math.hypot(d.x-(d._lx??d.x),d.y-(d._ly??d.y));
    d.walkP=(d.walkP||0)+mv*.16;d._mv=mv>0.2;d._lx=d.x;d._ly=d.y;
    clampArena(d);}}
function updFireballs(dt){
  for(let i=fireballs.length-1;i>=0;i--){const b=fireballs[i];
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(particles.length<240)particles.push({x:b.x,y:b.y,vx:0,vy:0,t:.14,
      col:b.kind==='hex'?'#b070f0':'#f0883d',r:b.kind==='hex'?2.5:3.5});
    let hit=false;
    if(b.kind==='slash'){ // piercing air slash: cuts everything in the line, once each
      enemies.forEach((e,ei)=>{if(e.dead||b.hit[ei])return;
        if(Math.hypot(b.x-e.x,b.y-(e.y-14))<e.r+b.r){b.hit[ei]=1;
          e.hp-=b.dmg;e.flash=.16;blood(e.x,e.y,8);
          popup(e.x,e.y-30,b.dmg,'#e7d9a8',16);
          S.shake=Math.max(S.shake,4);
          if(e.hp<=0)killEnemy(e,false);}});
      if(Math.hypot(b.x-arena.x,b.y-arena.y)>arena.r+40)fireballs.splice(i,1);
      continue;}
    for(const e of enemies){if(e.dead)continue;
      if(Math.hypot(b.x-e.x,b.y-(e.y-14))<e.r+b.r){hit=true;
        if(b.kind==='hex'){
          e.hexT=10;e.flash=.14; // 30/s rot for 10 seconds, slowed the whole time
          popup(e.x,e.y-28,'HEXED','#b070f0',13);
          S.shake=Math.max(S.shake,4);
        }else{
          e.hp-=b.dmg;e.flash=.16;blood(e.x,e.y,8);
          popup(e.x,e.y-30,b.dmg,'#f0883d',16);
          S.shake=Math.max(S.shake,4);
          for(const o of enemies){if(o.dead||o===e)continue; // splash
            if(dist(e,o)<45){const sd=Math.round(b.dmg/2);o.hp-=sd;o.flash=.1;
              popup(o.x,o.y-26,sd,'#f0883d',12);
              if(o.hp<=0)killEnemy(o,false);}}
          if(e.hp<=0)killEnemy(e,false);}
        break;}}
    if(hit||Math.hypot(b.x-arena.x,b.y-arena.y)>arena.r+40)fireballs.splice(i,1);}}
/* ---- ARCH DEVIL: the price of the full coven ---- */
function enterDevil(){
  if(lvl()<8){popup(P.x,P.y-64,'ARCH DEVIL AT LEVEL 8','#8a93a8',12);return;}
  P.devilT=10;P.channel=null;P.r=24;
  flashFx(.35);S.shake=Math.max(S.shake,12);vib([60,60,120]);
  leafBurst(P.x,P.y,26,'#d03a4a');
  showBanner('ARCH DEVIL','he was never summoning FOR himself — 10 seconds',1800,'#d03a4a');
  updateLabels();}
function exitDevil(){
  P.devilT=0;P.r=16;
  leafBurst(P.x,P.y,16,'#b070f0');
  showBanner('THE PACT ENDS','',800,'#b070f0');
  updateLabels();}
function devilClaw(){ // CLAW: roll to whoever he's targeting, then carve
  let tgt=null,bd=1e9;
  for(const d of demons){if(d.hp<=0||d.arch)continue;const dd=dist(P,d);if(dd<bd){bd=dd;tgt=d;}} // his own first — arch succubi are off the menu
  if(!tgt)for(const e of enemies){if(e.dead)continue;const dd=dist(P,e);if(dd<bd){bd=dd;tgt=e;}}
  if(tgt&&bd>P.r+tgt.r+12){ // rolling dash that lands beside the target
    const a=ang(P,tgt);
    const tx=tgt.x-Math.cos(a)*(tgt.r+P.r+6),ty=tgt.y-Math.sin(a)*(tgt.r+P.r+6);
    const steps=9;
    for(let k=0;k<steps&&particles.length<240;k++)
      particles.push({x:P.x+(tx-P.x)*k/steps,y:P.y+(ty-P.y)*k/steps,
        vx:rnd(-25,25),vy:rnd(-25,25),t:rnd(.15,.32),col:'#d03a4a',r:rnd(2,3.5)});
    P.x=tx;P.y=ty;clampArena(P);P.face=a;
    S.shake=Math.max(S.shake,5);}
  devilStrike(2.0,false);}
function devilStrike(mult,heals){
  autoFace();P.atkRecover=atkRec()*(mult>1.5?1.3:0.9);
  P.ft[mult>1.5?'heavy':'slash']++;
  swings.push({x:P.x,y:P.y,a:P.face,arc:2.0,range:98,t:.16,heavy:mult>1.5,col:'#d03a4a'});
  S.shake=Math.max(S.shake,mult>1.5?7:4);vib(mult>1.5?35:18);
  const dmg=Math.round((rollDice(diceN(),8)+dmgBonus())*mult);
  const ds=demons.filter(d=>d.hp>0&&!d.arch); // arch succubi are no longer his prey
  let dealt=0;
  if(ds.length){ // he devours his own first
    for(const d of ds){
      const da=ang(P,d);let diff=da-P.face;
      while(diff>Math.PI)diff-=2*Math.PI;while(diff<-Math.PI)diff+=2*Math.PI;
      if(dist(P,d)<98+d.r&&Math.abs(diff)<1.2){
        if(heals&&d.type==='succubus'){ // immune to the bite — it feeds them BOTH
          dealt+=dmg;
          if(!d.arch){d.arch=true;d.r=15;d.archT=7;d.archWarn=0;d.mineX=d.x;d.mineY=d.y;
            leafBurst(d.x,d.y,14,'#f06aa0');
            popup(d.x,d.y-d.r-24,'ARCH SUCCUBUS','#f06aa0',14);
            showBanner('ARCH SUCCUBUS','she BURSTS in 7 — she will not move. Portal away.',1700,'#d03a4a');}
          else popup(d.x,d.y-d.r-22,'IMMUNE','#f06aa0',11); // the gift does not stack
        }else{
          hurtDemon(d,dmg);dealt+=dmg;
          popup(d.x,d.y-d.r-22,'DEVOURED','#d03a4a',12);}}}
  }else{ // summons gone — the Pit is next
    for(const e of enemies){if(e.dead)continue;
      const da=ang(P,e);let diff=da-P.face;
      while(diff>Math.PI)diff-=2*Math.PI;while(diff<-Math.PI)diff+=2*Math.PI;
      if(dist(P,e)<98+e.r&&Math.abs(diff)<1.2){
        e.hp-=dmg;e.flash=.14;blood(e.x,e.y,7);dealt+=dmg;
        popup(e.x,e.y-30,dmg,'#d03a4a',mult>1.5?17:14);
        if(e.hp<=0)killEnemy(e,mult>1.5);}}}
  if(heals&&dealt>0){const hl=Math.round(dealt*0.5);
    P.hp=Math.min(maxHP(),P.hp+hl);
    popup(P.x,P.y-52,'+'+hl,'#d05a6a',14);}}
function blink(){
  if(P.rollCD>0||P.channel)return;
  P.rollCD=2.2;P.ft.rolls++;
  const ox=P.x,oy=P.y;
  for(const e of enemies){if(e.dead)continue; // stun around the departure point — wide and long
    if(dist(P,e)<230){e.stunT=Math.max(e.stunT||0,4);e.flash=.15;
      popup(e.x,e.y-28,'STUNNED','#b070f0',12);}}
  leafBurst(ox,oy,16,'#b070f0');
  P.x-=Math.cos(P.face)*150;P.y-=Math.sin(P.face)*150;clampArena(P);
  leafBurst(P.x,P.y,10,'#b070f0');
  S.shake=Math.max(S.shake,4);vib(30);flashFx(.1);}
/* ============ SERAPHIM — the visitor from the place above ============ */
let rays=[]; // {x,y,a,len,w,t,judge}
function seraphSlash(){ // angelic spear: thrust, sweep, and at lvl 6 the three heads feed
  P.atkRecover=atkRec();P.ft.slash++;
  if(P.comboT<=0)P.combo=0;
  const st=P.combo;P.atkPose=st;P.combo=(P.combo+1)%3;P.comboT=1.2;
  if(st===2&&lvl()>=6){ // TRIUNE MAW — all three heads lunge and bite; the spear rests
    P.atkRecover=atkRec()*1.25;
    const dmg=Math.round((rollDice(diceN(),8)+dmgBonus())*1.35);
    swings.push({x:P.x,y:P.y,a:P.face,arc:2.4,range:74,t:.16,heavy:true,col:'#ffe9a8'});
    let dealt=0;
    for(const e of enemies){if(e.dead)continue;
      const d=dist(P,e);if(d>74+e.r)continue;
      let da=Math.atan2(e.y-P.y,e.x-P.x)-P.face;
      while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
      if(Math.abs(da)>1.2)continue;
      dealt+=dmg;hitEnemy(e,dmg,true,P.face);}
    if(dealt>0){const hl=Math.max(3,Math.round(dealt*0.2));
      P.hp=Math.min(maxHP(),P.hp+hl);popup(P.x,P.y-56,'+'+hl+' — the heads are fed','#ffe9a8',12);}
    S.shake=Math.max(S.shake,6);vib(30);return;}
  // thrust (long, narrow) then sweep (wide)
  const arc=st===1?1.9:0.7, range=st===1?92:108, mult=st===1?1:1.1;
  const dmg=Math.round((rollDice(diceN(),8)+dmgBonus())*mult*0.92);
  swings.push({x:P.x,y:P.y,a:P.face,arc,range,t:.14,heavy:false,col:'#f0ead0',style:st===1?0:2});
  strike(P.face,arc,range,dmg,false);}
function fireRay(){ // the halo unmakes in a line — a lance of dawn through everything
  autoFace();
  const judge=lvl()>=8, w=judge?70:44, len=900;
  const dmg=Math.round((rollDice(diceN()*2,8)+dmgBonus())*(judge?1.6:1.15));
  rays.push({x:P.x,y:P.y-14,a:P.face,len,w,t:.45,judge});
  flashFx(judge?.3:.18);S.shake=Math.max(S.shake,judge?12:8);vib(judge?[50,40,90]:40);
  showBanner(judge?'HALO JUDGEMENT':'HALO RAY',judge?'the verdict is wide':'',900,'#ffe9a8');
  const ca=Math.cos(P.face),sa=Math.sin(P.face);
  for(const e of enemies){if(e.dead)continue;
    const rx=e.x-P.x,ry=(e.y-14)-(P.y-14);
    const proj=rx*ca+ry*sa, perp=Math.abs(-rx*sa+ry*ca);
    if(proj<-e.r||proj>len||perp>w/2+e.r)continue;
    e.hp-=dmg;e.flash=.18;blood(e.x,e.y,8);
    popup(e.x,e.y-30,dmg,'#ffe9a8',17);
    if(lvl()>=3&&e.hp>0){e.stunT=Math.max(e.stunT||0,1.6); // CHAINS OF DECREE
      popup(e.x,e.y-46,'CHAINED','#ffd870',12);}
    if(e.hp<=0)killEnemy(e,true);}
  for(let k=0;k<22&&particles.length<240;k++){const pd=rnd(20,len*0.6);
    particles.push({x:P.x+ca*pd+rnd(-w/2,w/2)*-sa,y:P.y-14+sa*pd+rnd(-w/2,w/2)*ca,
      vx:rnd(-30,30),vy:rnd(-60,-10),t:rnd(.3,.6),col:k%2?'#ffe9a8':'#fff6dc',r:rnd(1.5,3),noG:true});}}
function ascend(){ // the wings answer: above the sand, above the blades
  autoFace();P.parryCD=6;P.ascendT=1.1;P.wardT=1.5;P.ft.rolls++;
  leafBurst(P.x,P.y,16,'#fff6dc');
  popup(P.x,P.y-58,'ASCEND','#ffe9a8',14);
  S.shake=Math.max(S.shake,4);vib(25);flashFx(.1);}
function seraphSlam(){ // the landing is the sentence
  const dmg=Math.round((rollDice(diceN(),8)+dmgBonus())*1.2);
  swings.push({x:P.x,y:P.y,a:0,arc:7,range:120,t:.2,heavy:true,col:'#ffe9a8',ring:true});
  S.shake=Math.max(S.shake,9);vib([40,40,70]);flashFx(.16);
  leafBurst(P.x,P.y,20,'#ffe9a8');
  for(const e of enemies){if(e.dead)continue;
    if(dist(P,e)>120+e.r)continue;
    const pa=ang(P,e);e.x+=Math.cos(pa)*60;e.y+=Math.sin(pa)*60;clampArena(e);
    e.stunT=Math.max(e.stunT||0,0.8);
    hitEnemy(e,dmg,true,pa);}}
function updRays(dt){for(let i=rays.length-1;i>=0;i--){rays[i].t-=dt;if(rays[i].t<=0)rays.splice(i,1);}}
function updWolves(dt){
  for(let i=wolves.length-1;i>=0;i--){const w=wolves[i];
    w.life-=dt;
    if(w.life<=0||w.hp<=0){leafBurst(w.x,w.y,10,'#9ab8a0');wolves.splice(i,1);continue;}
    w.cool-=dt;
    const tgt=enemies.filter(e=>!e.dead).sort((a,b)=>dist(w,a)-dist(w,b))[0];
    if(!tgt)continue;
    if(w.lungeT>0){w.lungeT-=dt;
      w.x+=Math.cos(w.lungeA)*330*dt;w.y+=Math.sin(w.lungeA)*330*dt;
      if(!w.bit&&dist(w,tgt)<w.r+tgt.r+6){w.bit=true;
        const d=rollDice(Math.max(1,Math.ceil(diceN()/2)),6)+Math.floor(dmgBonus()/2);
        tgt.hp-=d;tgt.flash=.12;blood(tgt.x,tgt.y,5);
        popup(tgt.x,tgt.y-26,d,'#9ab8a0',13);
        if(tgt.hp<=0)killEnemy(tgt,false);}
      if(w.lungeT<=0)w.bit=false;}
    else{const d=dist(w,tgt);w.face=ang(w,tgt);
      if(d>w.r+tgt.r+12){w.x+=Math.cos(w.face)*210*dt;w.y+=Math.sin(w.face)*210*dt;}
      if(w.cool<=0&&d<110){w.cool=rnd(1.1,1.8);w.lungeT=.24;w.lungeA=w.face;}}
    clampArena(w);
    const mv=Math.hypot(w.x-(w._lx??w.x),w.y-(w._ly??w.y));
    w.walkP+=mv*.2;w._mv=mv>0.2;w._lx=w.x;w._ly=w.y;}}
function doHeavy(){if(S.mode!=='fight'&&S.mode!=='demo'||P.dead||P.heavyWind>0||P.rollT>0||P.paralyzeT>0)return;
  if(P.char==='druid'){autoFace();druidHeavy();return;} // druid uses per-form cooldowns
  if(P.heavyCD>0)return;
  if(P.char==='warlock'){
    if(P.devilT>0){devilStrike(1.0,true);return;} // BITE — moderate, feeds him
    startChannel();return;}
  if(P.char==='seraph'){ // HALO RAY: the crown leaves his brow and charges
    autoFace();P.heavyWind=.55;P.heavyCD=5;P.heavyCDmax=5;P.ft.heavy++;
    popup(P.x,P.y-52,'THE HALO RISES','#ffe9a8',12);return;}
  autoFace();P.heavyWind=.55;P.heavyCD=2.2;P.heavyCDmax=2.2;}
function heavyRelease(){if(P.char==='warlock')releaseChannel();}
function heavyLand(){P.ft.heavy++;
  swings.push({x:P.x,y:P.y,a:P.face,arc:2.1,range:92,t:.18,heavy:true,col:'#e7b450'});
  S.shake=Math.max(S.shake,8);vib(40);
  strike(P.face,2.1,92+roninTier()*14,Math.round((rollDice(diceN()*2,8)+dmgBonus())*0.88),true);}
function doRoll(){if(S.mode!=='fight'&&S.mode!=='demo'||P.dead||P.rollCD>0||P.rollT>0||P.channel||P.paralyzeT>0)return;
  if(P.char==='warlock'){autoFace();blink();return;}
  P.rollT=.32*MODS.dodgeWin;P.rollCD=rollCDmax();P.heavyWind=0;P.ft.rolls++;
  let mx=stick.dx,my=stick.dy;
  if(keys['w'])my=-1;if(keys['s'])my=1;if(keys['a'])mx=-1;if(keys['d'])mx=1;
  if(Math.hypot(mx,my)<.2){mx=Math.cos(P.face);my=Math.sin(P.face);}
  const m=Math.hypot(mx,my);P.rollDX=mx/m;P.rollDY=my/m;}
function strike(a,arc,range,dmg,heavy){
  for(const e of enemies){if(e.dead)continue;
    const d=dist(P,e);if(d>range+e.r)continue;
    let da=Math.atan2(e.y-P.y,e.x-P.x)-a;
    while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
    if(Math.abs(da)>arc/2)continue;
    hitEnemy(e,dmg,heavy,a);}}
function hitEnemy(e,dmg,heavy,a){
  // Door's shield: frontal block (heavy strikes break the guard)
  if(e.type==='door'&&!(e.brokenT>0)){
    let fd=Math.atan2(P.y-e.y,P.x-e.x)-e.face;
    while(fd>Math.PI)fd-=2*Math.PI;while(fd<-Math.PI)fd+=2*Math.PI;
    if(Math.abs(fd)<0.9){
      if(heavy){e.brokenT=2.0;popup(e.x,e.y-34,'GUARD BROKEN','#e7b450',15);
        S.shake=Math.max(S.shake,7);vib(40);}
      else{dmg=Math.max(2,Math.floor(dmg*0.25));
        popup(e.x,e.y-30,'CLANG — flank or HEAVY','#9aa0a8',12);S.shake=Math.max(S.shake,3);}}}
  // Grave Count parry
  if(e.type==='grave'&&e.stance==='parry'){
    popup(e.x,e.y-30,'PARRIED','#e7b450',13);
    e.tele=0.25;e.teleMax=0.25;e.stance='riposte';vib(20);return;}
  e.hp-=dmg;e.flash=.12;e.x+=Math.cos(a)*7;e.y+=Math.sin(a)*7;
  popup(e.x+rnd(-8,8),e.y-26,dmg,heavy?'#e7b450':'#d8cdb8',heavy?18:14);
  blood(e.x,e.y,heavy?14:7);S.hitPause=Math.max(S.hitPause,heavy?.06:.03);vib(heavy?30:12);
  if(e.hp<=0)killEnemy(e,heavy);}
function gibs(e,n){for(let i=0;i<n&&particles.length<240;i++){
  const a=rnd(0,Math.PI*2),s=rnd(80,260);
  particles.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,t:rnd(.45,.9),col:e.col,r:rnd(2.5,5.5),chunk:true});}}
function drawLimbShape(c,L){ // c = a 2d context (main or decal)
  c.save();c.translate(L.x,L.y);c.rotate(L.rot);
  c.strokeStyle='#000';c.lineWidth=1.5;
  if(L.kind==='head'){
    c.fillStyle=L.skin;c.fillRect(-5,-5,10,10);c.strokeRect(-5,-5,10,10);
    c.fillStyle='#1c1611';c.fillRect(-5,-5,10,4); // hair
    c.fillStyle='#000';c.fillRect(-3,1,2,2);c.fillRect(1,1,2,2); // eyes
  }else if(L.kind==='arm'){
    c.fillStyle='#1c1611';c.fillRect(-8,-2.5,13,5);c.strokeRect(-8,-2.5,13,5);
    c.fillStyle=L.skin;c.fillRect(5,-3,5,6); // hand
  }else{ // leg
    c.fillStyle='#15100c';c.fillRect(-9,-3,15,6);c.strokeRect(-9,-3,15,6);
    c.fillStyle='#0c0e14';c.fillRect(6,-4,6,8); // boot
  }
  // trailing blood while flying
  c.restore();
}
function stampLimb(L){ // limb comes to rest: permanent on the sand
  drawLimbShape(dctx,L);
  dctx.fillStyle='rgba(96,18,14,.6)';
  dctx.beginPath();dctx.ellipse(L.x+rnd(-4,4),L.y+rnd(-3,3),rnd(4,8),rnd(2,4),rnd(0,3),0,7);dctx.fill();
}
function dismember(e,full){
  // head flies (decapitation) + limbs
  const headA=rnd(-2.4,-0.7),hs=rnd(160,260);
  limbs.push({x:e.x,y:e.y-e.r,vx:Math.cos(headA)*hs,vy:Math.sin(headA)*hs,
    rot:rnd(0,6),vr:rnd(-9,9),t:rnd(.9,1.3),kind:'head',col:e.col,skin:'#caa27a'});
  const n=full?3:1+Math.floor(Math.random()*2);
  for(let i=0;i<n&&limbs.length<28;i++){
    const a=rnd(0,Math.PI*2),s=rnd(120,240);
    limbs.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      rot:rnd(0,6),vr:rnd(-11,11),t:rnd(.7,1.1),
      kind:Math.random()<.5?'arm':'leg',col:e.col,skin:'#caa27a'});}
}
function killEnemy(e,heavy){
  e.dead=true;bloodPool(e.x,e.y,e.r*1.6);blood(e.x,e.y,26);gibs(e,heavy?13:6);
  S.shake=Math.max(S.shake,heavy?13:9);S.hitPause=Math.max(S.hitPause,heavy?.16:.12);vib(heavy?[40,40,80]:[30,40,60]);
  // ---- cinematic kill resolution ----
  const fatality=!e.minion&&(heavy||Math.random()<0.22);
  const dismembered=fatality||Math.random()<0.4;
  if(dismembered)dismember(e,fatality);
  kwIdx=(kwIdx+1)%KILLWORDS.length;
  const word=dismembered&&Math.random()<.5?'DECAPITATED':KILLWORDS[kwIdx];
  if(!e.minion){
    popup(e.x,e.y-66,word,fatality?'#ff3d5a':'#f0a83d',fatality?26:20);
    if(fatality){
      S.slow=1.6;S.fatal=true;
      camFocus(e.x,e.y,2.1,1.5);
      showBanner('FATALITY',word.toLowerCase()+' — the crowd loses it',1500,'#ff3d5a');
      flashFx(.32);
    }else{
      S.slow=.9;S.fatal=false;
      camFocus(e.x,e.y,1.55,.85);
      showBanner(word,'',850,'#f0a83d');
      flashFx(.18);
    }
  }
  if(e.minion){P.hp=Math.min(maxHP(),P.hp+5);popup(e.x,e.y-34,'+5 HP','#7fbf6a',13);
    if(P.char==='ronin'){ // summons feed the ronin's blade too
      P.kills++;
      popup(e.x,e.y-50,'+2 ALL STATS','#3df0c8',15);
      UI.stats(diceN()+'d8','KILLS '+P.kills);
      checkRoninForm();}
    else{P.kills++;popup(e.x,e.y-50,'+1.5 LVL','#3df0c8',13);gainLevel();}}
  else{P.kills++;const hpUp=maxHP();P.hp=Math.min(hpUp,P.hp+10);
    if(P.char==='ronin'){
      popup(e.x,e.y-50,'+2 ALL STATS','#3df0c8',18);
      popup(e.x,e.y-28,'KATANA  '+diceN()+'d8','#3df0c8',14);
      UI.stats(diceN()+'d8','KILLS '+P.kills);
      checkRoninForm();}
    else{popup(e.x,e.y-50,'+1.5 LVL','#3df0c8',16);gainLevel();}}
  if(e.type==='champ')for(const t of enemies)if(t.minion)t.hp=0,t.dead=true;
  if(enemies.filter(x=>!x.minion).every(x=>x.dead)){
    for(const t of enemies)if(t.minion)t.dead=true;
    setTimeout(()=>{if(S.mode==='fight')winFight();},650);}}

/* ============ FX ============ */
function popup(x,y,txt,col,sz){popups.push({x,y,txt:''+txt,col,sz,t:1});}
function blood(x,y,n){for(let i=0;i<n&&particles.length<240;i++){
  const a=rnd(0,Math.PI*2),s=rnd(40,210);
  particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:rnd(.3,.7),col:'#8a1f1c',r:rnd(1.5,3.5)});}}
function bloodPool(x,y,r){dctx.fillStyle='rgba(96,18,14,0.75)';
  for(let i=0;i<7;i++){dctx.beginPath();dctx.arc(x+rnd(-r*.5,r*.5),y+rnd(-r*.4,r*.4),rnd(r*.25,r*.55),0,7);dctx.fill();}}
function flashFx(o){UI.flash(o);}
function showBanner(t1,t2,ms,col){UI.banner(t1,t2||'',ms||1600,col||null);}

/* ============ ENEMIES ============ */
function mkEnemy(o){return Object.assign({x:arena.x,y:arena.y-arena.r*.55,r:18,hp:50,maxhp:50,face:Math.PI/2,
  spd:90,dead:false,flash:0,attackT:0,cool:rnd(.5,1.2),tele:0,teleMax:0,stance:'',deathT:0,minion:false,
  col:'#9a8a72',wpn:'#777'},o);}
const FIGHTS=[
 {name:'THE DOOR',rec:'31 — 0 vs newcomers',taunt:'"No banner, no name. I\'ll make it quick, little nobody."',
  spawn:i=>[mkEnemy({type:'door',r:26,hp:90,maxhp:90,spd:52,col:'#7d7468',wpn:'#5a5248'})]},
 {name:'TWIN HOOKS',rec:'19 — 2, always together',taunt:'"Left or right, nobody? Pick which of us kills you."',
  spawn:i=>[mkEnemy({type:'hook',x:arena.x-90,hp:48*i,maxhp:48*i,spd:150,r:14,col:'#8a6a4a'}),
            mkEnemy({type:'hook',x:arena.x+90,hp:48*i,maxhp:48*i,spd:150,r:14,col:'#8a6a4a'})]},
 {name:'THE CHAIN',rec:'24 — 1, reach of nine feet',taunt:'"The sand inside my circle belongs to me."',
  spawn:i=>[mkEnemy({type:'chain',hp:95*i,maxhp:95*i,spd:78,r:18,col:'#6f7a6a'})]},
 {name:'PYRE',rec:'17 — 0, three burned alive',taunt:'"The Pit was a quarry. I will make it a kiln."',
  spawn:i=>[mkEnemy({type:'pyre',hp:85*i,maxhp:85*i,spd:95,r:15,col:'#a4502c'})]},
 {name:'THE POWDER SAINT',rec:'13 — 0, all from forty feet',taunt:'"The Pit banned powder. The Pit also takes my bribes."',
  spawn:i=>[mkEnemy({type:'gunner',hp:78*i,maxhp:78*i,spd:115,r:14,col:'#5e5a72'})]},
 {name:'THE GRAVE COUNT',rec:'40 — 0, all by riposte',taunt:'"Swing wildly, please. My blade prefers volunteers."',
  spawn:i=>[mkEnemy({type:'grave',hp:120*i,maxhp:120*i,spd:105,r:16,col:'#5a5e6e',stance:'open',stanceT:1})]},
 {name:'THE STITCHER',rec:'Her two brutes have died nine times between them. They look fine.',taunt:'"Break them, nobody. I\'ll just sew faster."',
  spawn:i=>[mkEnemy({type:'stitch',hp:70*i,maxhp:70*i,spd:125,r:13,col:'#7a8a6a'}),
            mkEnemy({type:'brute',minion:true,x:arena.x-85,hp:75*i,maxhp:75*i,spd:72,r:21,col:'#6a5440'}),
            mkEnemy({type:'brute',minion:true,x:arena.x+85,hp:75*i,maxhp:75*i,spd:72,r:21,col:'#6a5440'})]},
 {name:'HOUND MASTER',rec:'22 — 3, hounds eat the losers',taunt:'"They haven\'t been fed, nobody. Apologies."',
  spawn:i=>[mkEnemy({type:'master',hp:100*i,maxhp:100*i,spd:70,r:17,col:'#7a6048'}),
            mkEnemy({type:'hound',minion:true,x:arena.x-110,hp:66*i,maxhp:66*i,spd:200,r:11,col:'#4a4038'}),
            mkEnemy({type:'hound',minion:true,x:arena.x+110,hp:66*i,maxhp:66*i,spd:200,r:11,col:'#4a4038'}),
            mkEnemy({type:'hound',minion:true,x:arena.x,y:arena.y-arena.r*.7,hp:66*i,maxhp:66*i,spd:200,r:11,col:'#4a4038'})]},
 {name:'THE GRAVEDIGGER',rec:'His own record: 0 — 0. His corpses: 44 — 12.',taunt:'"The Pit buries its losers shallow. Convenient for me."',
  spawn:i=>[mkEnemy({type:'necro',hp:92*i,maxhp:92*i,spd:100,r:15,col:'#4a5444'})]},
 {name:'THE KENNEL & THE NEEDLE',rec:'A healer, a handler, and everything off its leash.',taunt:'"Patch the hounds, Sawbones. Let the famous one tire himself."',
  spawn:i=>[mkEnemy({type:'master',hp:200*i,maxhp:200*i,spd:70,r:17,col:'#7a6048'}),
            mkEnemy({type:'stitch',hp:140*i,maxhp:140*i,spd:125,r:13,col:'#7a8a6a'}),
            mkEnemy({type:'hound',minion:true,x:arena.x-110,hp:66*i,maxhp:66*i,spd:200,r:11,col:'#4a4038'}),
            mkEnemy({type:'hound',minion:true,x:arena.x+110,hp:66*i,maxhp:66*i,spd:200,r:11,col:'#4a4038'})]},
 {name:'LEAD & BONE',rec:'Forty feet of powder. Four feet of grave dirt.',taunt:'"You shoot, I raise. The Pit loves a partnership."',
  spawn:i=>[mkEnemy({type:'gunner',hp:156*i,maxhp:156*i,spd:115,r:14,col:'#5e5a72'}),
            mkEnemy({type:'necro',hp:184*i,maxhp:184*i,spd:100,r:15,col:'#4a5444'})]},
 {name:'THE WALL HOLDS',rec:'The Door came back. He brought a kiln and a needle.',taunt:'"Little nobody got bigger. The Door got friends."',
  spawn:i=>[mkEnemy({type:'door',r:26,hp:180*i,maxhp:180*i,spd:52,col:'#7d7468',wpn:'#5a5248'}),
            mkEnemy({type:'pyre',hp:170*i,maxhp:170*i,spd:95,r:15,col:'#a4502c'}),
            mkEnemy({type:'stitch',hp:140*i,maxhp:140*i,spd:125,r:13,col:'#7a8a6a'})]},
 {name:'THE COUNT\'S COMPANY',rec:'The riposte hired the hooks. Bad news travels in threes.',taunt:'"Swing wildly, please. My associates insist."',
  spawn:i=>[mkEnemy({type:'grave',hp:240*i,maxhp:240*i,spd:105,r:16,col:'#5a5e6e',stance:'open',stanceT:1}),
            mkEnemy({type:'hook',x:arena.x-90,hp:96*i,maxhp:96*i,spd:150,r:14,col:'#8a6a4a'}),
            mkEnemy({type:'hook',x:arena.x+90,hp:96*i,maxhp:96*i,spd:150,r:14,col:'#8a6a4a'})]},
 {name:'POWDER & THE WALL',rec:'A wall that walks. A gun that waits behind it.',taunt:'"Stand behind me, Saint. Make the legend come to us."',
  spawn:i=>[mkEnemy({type:'door',r:26,hp:180*i,maxhp:180*i,spd:52,col:'#7d7468',wpn:'#5a5248'}),
            mkEnemy({type:'gunner',hp:156*i,maxhp:156*i,spd:115,r:14,col:'#5e5a72'})]},
 {name:'THE COVEN OF KILNS',rec:'Two kilns, one needle. The Pit floor is still warm.',taunt:'"Fire, frost, or lightning — pick your last word."',
  spawn:i=>[mkEnemy({type:'pyre',x:arena.x-90,hp:170*i,maxhp:170*i,spd:95,r:15,col:'#a4502c'}),
            mkEnemy({type:'pyre',x:arena.x+90,hp:170*i,maxhp:170*i,spd:95,r:15,col:'#b4602c'}),
            mkEnemy({type:'stitch',hp:140*i,maxhp:140*i,spd:125,r:13,col:'#7a8a6a'})]},
 {name:'THE UNDYING WALL',rec:'The Door, sewn twice over. Nobody has out-lasted the needlework.',taunt:'"Cut him down. We\'ll have him standing before you catch your breath."',
  spawn:i=>[mkEnemy({type:'door',r:26,hp:180*i,maxhp:180*i,spd:52,col:'#7d7468',wpn:'#5a5248'}),
            mkEnemy({type:'stitch',x:arena.x-100,hp:140*i,maxhp:140*i,spd:125,r:13,col:'#7a8a6a'}),
            mkEnemy({type:'stitch',x:arena.x+100,hp:140*i,maxhp:140*i,spd:125,r:13,col:'#8a9a7a'})]},
 {name:'THE DUELIST\'S SECOND',rec:'The Count answers blades. The Saint answers everything else.',taunt:'"Swing and I counter. Hesitate and he fires. Choose."',
  spawn:i=>[mkEnemy({type:'grave',hp:240*i,maxhp:240*i,spd:105,r:16,col:'#5a5e6e',stance:'open',stanceT:1}),
            mkEnemy({type:'gunner',hp:156*i,maxhp:156*i,spd:115,r:14,col:'#5e5a72'})]},
 {name:'SIEGE WORKS',rec:'A wall, a gun, a kiln, a needle. Bellow sold out the stands.',taunt:'"This isn\'t a fight, nobody. It\'s a demolition."',
  spawn:i=>[mkEnemy({type:'door',r:26,hp:180*i,maxhp:180*i,spd:52,col:'#7d7468',wpn:'#5a5248'}),
            mkEnemy({type:'gunner',hp:156*i,maxhp:156*i,spd:115,r:14,col:'#5e5a72'}),
            mkEnemy({type:'pyre',hp:170*i,maxhp:170*i,spd:95,r:15,col:'#a4502c'}),
            mkEnemy({type:'stitch',hp:140*i,maxhp:140*i,spd:125,r:13,col:'#7a8a6a'})]},
 {name:'THE FORMER CHAMPION',rec:'112 — 1. The 1 was retirement.',taunt:'"I know what the Pit gave you, nobody. It gave it to me first."',
  spawn:i=>[mkEnemy({type:'champ',hp:200*i,maxhp:200*i,spd:115,r:20,col:'#8a3a3a',feeds:0,thrallT:2})]},
 {name:"BELLOW'S SECRET",rec:'Undefeated. Unfed. Unwise.',taunt:'Bellow, sweating: "You weren\'t supposed to get this far."',
  spawn:i=>[mkEnemy({type:'beast',hp:340*i,maxhp:340*i,spd:88,r:30,col:'#3f3a44',phase:1})]}
];
function spawnFight(){
  const i=1+S.fight*0.30; // difficulty scale
  enemies=FIGHTS[S.fight].spawn(i).map(e=>{e.dmgScale=1+S.fight*0.16;return e;});
  zones=[];swings=[];particles=[];popups=[];bullets=[];limbs=[];wolves=[];P.wolfCD=0;P.glaive=null;
  demons=[];fireballs=[];tracers=[];P.channel=null;P.slowT=0;P.paralyzeT=0;P.wardT=0;
  if(P.devilT>0){P.devilT=0;P.r=16;updateLabels();}
  if(P.char==='druid'){P.form='human';P.r=16;P.formT=0;P.humanCD=0;updateLabels();}
  cam.x=cam.tx=W/2;cam.y=cam.ty=H/2;cam.z=cam.tz=1;cam.hold=0;S.fatal=false;
  P.x=arena.x;P.y=arena.y+arena.r*0.55;P.hp=maxHP();P.dead=false;P.rollT=0;P.rollCD=0;P.heavyCD=0;P.heavyWind=0;
  P.parryT=0;P.parryCD=0;P.ripoT=0;P.combo=0;P.comboT=0;
  P.hexCD=0;P.cdVines=0;P.cdRoar=0;P.cdHowl=0;P.humanCD=0;P.wolfCD=0;P.formCD=0; // all skills fresh each fight (Hiro)
  P.ft={dmgTaken:0,heavy:0,slash:0,rolls:0,parries:0,t0:NOW(),low:false};
  UI.boss(S.fight>=18,FIGHTS[S.fight].name);
}
function hurtPlayer(dmg,from){
  if(P.rollT>0||P.dead)return;
  if(P.wardT>0){popup(P.x,P.y-40,'WARDED','#5ad2ff',12);return;}
  const tb=demonTaunt(); // the claw fiend soaks hits aimed near it
  if(tb&&from&&dist(from,tb)<dist(from,P)){hurtDemon(tb,Math.round(dmg),from);return;}
  if(P.channel){P.channel=null;popup(P.x,P.y-46,'INTERRUPTED','#b070f0',14);vib(40);}
  if(P.parryT>0&&from){
    P.parryT=0;P.ft.parries++;
    popup(P.x,P.y-36,'PARRY','#e7b450',17);
    S.hitPause=Math.max(S.hitPause,.1);flashFx(.12);vib(35);
    // heal 15% of max health
    const hl=Math.round(maxHP()*0.20);
    P.hp=Math.min(maxHP(),P.hp+hl);
    popup(P.x,P.y-52,'+'+hl,'#7fbf6a',14);
    // ranged air slash — 1.5x damage, pierces everything in its line
    const af=from&&!from.dead?ang(P,from):P.face;P.face=af;
    fireballs.push({x:P.x+Math.cos(af)*16,y:P.y-16+Math.sin(af)*16,
      vx:Math.cos(af)*520,vy:Math.sin(af)*520,r:15,kind:'slash',
      dmg:Math.round((rollDice(diceN(),8)+dmgBonus())*1.5),hit:{}});
    popup(P.x,P.y-66,'AIR SLASH','#e7d9a8',13);
    for(let i=0;i<8;i++)particles.push({x:P.x+Math.cos(P.face)*20,y:P.y+Math.sin(P.face)*20,
      vx:rnd(-160,160),vy:rnd(-160,-40),t:rnd(.2,.4),col:'#e7b450',r:rnd(1,2.5)});
    if(!from.dead&&dist(from,P)<140){from.stunT=from.type==='beast'?0.6:1.2;
      from.attacking=false;from.tele=0;
      popup(from.x,from.y-30,'STAGGERED','#9aa0a8',12);}
    return;}
  if(P.char==='druid'&&P.form==='bear')dmg=Math.round(dmg*0.65);
  if(S.mode==='demo'&&P.hp-dmg<=8){P.hp=Math.round(maxHP()*.8);return;}
  dmg=Math.round(dmg);P.hp-=dmg;P.flash=.15;P.ft.dmgTaken+=dmg;
  if(P.hp/maxHP()<.1)P.ft.low=true;
  popup(P.x,P.y-30,dmg,'#c8443a',15);blood(P.x,P.y,8);
  S.shake=Math.max(S.shake,6);vib(50);
  if(from){const a=ang(from,P);P.x+=Math.cos(a)*14;P.y+=Math.sin(a)*14;}
  if(P.hp<=0){P.dead=true;bloodPool(P.x,P.y,30);
    setTimeout(()=>{if(S.mode==='fight')lose();},900);}
}
function telegraphThenHit(e,dt,wind,fn){
  e.tele-=dt;
  if(e.tele<=0){fn();e.cool=rnd(1.0,1.8);e.tele=0;e.attacking=false;}
}

/* enemy AI update */
function updEnemy(e,dt){
  if(!e.dead){ // damage-over-time ticks (hex + poison) run at real speed
    if(e.hexT>0){e.hexT-=dt;e.hexTick=(e.hexTick||0)-dt;
      if(e.hexTick<=0){e.hexTick=.5;dotDamage(e,15,'#b070f0');}}
    if(e.poisonT>0){e.poisonT-=dt;e.poisonTick=(e.poisonTick||0)-dt;
      if(e.poisonTick<=0){e.poisonTick=.6;dotDamage(e,2+Math.floor(P.kills/2),'#7fd05a');}}
    if(e.vined>0){e.vineTick=(e.vineTick||0)-dt; // thorns bite while the vines hold
      if(e.vineTick<=0){e.vineTick=.7;dotDamage(e,3+Math.floor(lvl()/2),'#7fbf6a');}}}
  // hexed enemies act at 60% speed; a taunting claw fiend steals their focus
  updEnemyVs(e,e.hexT>0?dt*0.6:dt,demonTaunt()||P);}
function dotDamage(e,d,col){if(e.dead)return;
  e.hp-=d;e.flash=Math.max(e.flash,.05);
  popup(e.x+rnd(-7,7),e.y-22,d,col,11);
  if(e.hp<=0)killEnemy(e,false);}
function updEnemyVs(e,dt,P){
  if(e.dead){e.deathT+=dt;return;}
  if(e.stunT>0){e.stunT-=dt;e.flash=Math.max(e.flash,.04);
    if(e.vined)e.vined=Math.max(0,e.vined-dt);return;}
  e.vined=0;
  e.flash=Math.max(0,e.flash-dt);
  const dToP=dist(e,P);
  const chase=(speedMul=1,stopAt=e.r+P.r+26)=>{
    if(dToP>stopAt){const a=ang(e,P);e.face=a;
      e.x+=Math.cos(a)*e.spd*speedMul*dt;e.y+=Math.sin(a)*e.spd*speedMul*dt;}
    else e.face=ang(e,P);};
  const beginAttack=(wind)=>{e.attacking=true;e.tele=wind;e.teleMax=wind;e.lockA=ang(e,P);};
  e.cool-=dt;

  switch(e.type){
   case 'door':
    e.brokenT=Math.max(0,(e.brokenT||0)-dt);
    if(e.attacking){e.tele-=dt;
      if(e.tele<=0){e.attacking=false;e.cool=1.6;
        S.shake=Math.max(S.shake,5);
        if(dToP<e.r+58){let da=ang(e,P)-e.lockA;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
          if(Math.abs(da)<1.2)hurtPlayer(rnd(10,15)*e.dmgScale,e);}
        // dust ring
        for(let i=0;i<10;i++)particles.push({x:e.x+Math.cos(e.lockA)*40,y:e.y+Math.sin(e.lockA)*40,
          vx:rnd(-60,60),vy:rnd(-60,60),t:.4,col:'#6b5d4f',r:2.5});}}
    else{
      // slow turn: flanking is real
      const want=ang(e,P);let dd=want-e.face;
      while(dd>Math.PI)dd-=2*Math.PI;while(dd<-Math.PI)dd+=2*Math.PI;
      const tr=(e.brokenT>0?0.8:2.0)*dt;
      e.face+=Math.abs(dd)<tr?dd:Math.sign(dd)*tr;
      if(dToP>e.r+P.r+34){e.x+=Math.cos(e.face)*e.spd*dt;e.y+=Math.sin(e.face)*e.spd*dt;}
      if(e.cool<=0&&dToP<e.r+72)beginAttack(.5);}
    break;
   case 'hook':
    if(e.attacking)telegraphThenHit(e,dt,0,()=>{if(dToP<e.r+P.r+34)hurtPlayer(rnd(6,10)*e.dmgScale,e);});
    else{ // circle to flank
      const a=ang(e,P),side=e.sideDir||(e.sideDir=Math.random()<.5?1:-1);
      if(dToP>70){e.x+=Math.cos(a)*e.spd*dt;e.y+=Math.sin(a)*e.spd*dt;}
      else{e.x+=Math.cos(a+side*1.5)*e.spd*.7*dt;e.y+=Math.sin(a+side*1.5)*e.spd*.7*dt;}
      e.face=a;if(e.cool<=0&&dToP<74){beginAttack(.38);}}
    break;
   case 'chain':
    if(e.attacking)telegraphThenHit(e,dt,0,()=>{
      if(dToP<150&&dToP>40)hurtPlayer(rnd(9,14)*e.dmgScale,e);
      swings.push({x:e.x,y:e.y,a:0,arc:Math.PI*2,range:150,t:.2,heavy:true,col:'#9aa0a8',ring:true});});
    else{chase(1,120);if(e.cool<=0&&dToP<150)beginAttack(.6);}
    break;
   case 'pyre':
    {const a=ang(e,P);e.face=a;
     if(e.castT>0){ // 2-second spell channel — damage interrupts
       if(e.hp<e._castHp){e.castT=0;e.cool=1.6;popup(e.x,e.y-32,'INTERRUPTED','#c8443a',12);break;}
       if(Math.random()<.4&&particles.length<240){const ca=rnd(0,6.3),cr=rnd(16,30);
         particles.push({x:e.x+Math.cos(ca)*cr,y:e.y+Math.sin(ca)*cr*.5,vx:-Math.cos(ca)*40,vy:-20,
           t:.3,col:['#e08030','#5ad2ff','#f0e05a'][e.spell||0],r:2,noG:true});}
       e.castT-=dt;
       if(e.castT<=0){
         const sp2=e.spell||0;e.spell=(sp2+1)%3;e.cool=2.6;
         if(sp2===0)zones.push({x:P.x,y:P.y,r:54,tele:.75,life:3.5,type:'fire'});
         else if(sp2===1)zones.push({x:P.x,y:P.y,r:62,tele:.75,life:.1,type:'ice',dmg:4*e.dmgScale});
         else zones.push({x:P.x,y:P.y,r:70,tele:.75,life:.1,type:'bolt'});
         if(!e.mageShield){e.mageShield=true;e.hp+=e.maxhp;e.maxhp*=2; // shield on successful cast
           popup(e.x,e.y-34,'SHIELDED','#5ad2ff',13);}}
       break;}
     if(dToP<170){e.x-=Math.cos(a)*e.spd*dt;e.y-=Math.sin(a)*e.spd*dt;}
     if(e.cool<=0){e.castT=2;e._castHp=e.hp;
       popup(e.x,e.y-32,'CASTING','#e08030',11);}}
    break;
   case 'grave':
    e.stanceT=(e.stanceT||1)-dt;
    if(e.stance==='riposte'){e.tele-=dt;e.face=ang(e,P);
      if(e.tele<=0){e.stance='open';e.stanceT=1.1;
        if(dToP<e.r+P.r+44)hurtPlayer(rnd(12,17)*e.dmgScale,e);
        swings.push({x:e.x,y:e.y,a:ang(e,P),arc:1.6,range:64,t:.15,heavy:true,col:'#e7b450'});}}
    else{
      if(e.stanceT<=0){e.stance=e.stance==='parry'?'open':'parry';e.stanceT=e.stance==='parry'?1.3:1.0;}
      chase(e.stance==='parry'?.4:1);
      if(e.stance==='open'&&e.cool<=0&&dToP<e.r+P.r+40){e.cool=1.4;
        if(P.rollT<=0)hurtPlayer(rnd(7,11)*e.dmgScale,e);
        swings.push({x:e.x,y:e.y,a:ang(e,P),arc:1.4,range:58,t:.13,heavy:false,col:'#9aa0a8'});}}
    break;
   case 'hound':
    if(e.attacking){e.tele-=dt;
      if(e.tele<=0){e.attacking=false;e.cool=rnd(1.2,2);
        e.lungeT=.28;e.lungeA=ang(e,P);}}
    else if(e.lungeT>0){e.lungeT-=dt;
      e.x+=Math.cos(e.lungeA)*340*dt;e.y+=Math.sin(e.lungeA)*340*dt;
      if(dToP<e.r+P.r+4&&!e.bit){e.bit=true;hurtPlayer(rnd(4,7)*e.dmgScale,e);}
      if(e.lungeT<=0)e.bit=false;}
    else{chase(1,90);if(e.cool<=0&&dToP<140)beginAttack(.42);}
    break;
   case 'master':
    {chase(.8,170);
     if(e.cool<=0){e.cool=1.5;const packAlive=enemies.filter(x=>x.type==='hound'&&!x.dead);
       if(packAlive.length<6&&Math.random()<.6){
         for(let h=0;h<2;h++)enemies.push(mkEnemy({type:'hound',minion:true,x:e.x+rnd(-40,40),y:e.y+rnd(-40,40),
           hp:66*e.dmgScale,maxhp:66*e.dmgScale,spd:200,r:11,col:'#4a4038',dmgScale:e.dmgScale}));
         popup(e.x,e.y-30,'RELEASE ×2','#c8923a',12);}
       else if(dToP<200){zones.push({x:P.x,y:P.y,r:44,tele:.6,life:.1,type:'whipcrack',dmg:8*e.dmgScale});}}}
    break;
   case 'gunner':
    {const a=ang(e,P);e.face=e.aiming?e.aimA:a;
     if(!e.aiming){
       if(dToP<190){e.x-=Math.cos(a)*e.spd*dt;e.y-=Math.sin(a)*e.spd*dt;}
       else if(dToP>300){e.x+=Math.cos(a)*e.spd*.6*dt;e.y+=Math.sin(a)*e.spd*.6*dt;}
       if(e.cool<=0){e.aiming=true;e.aimT=.8;e.aimA=a;}}
     else{e.aimT-=dt;
       if(e.aimT>.28)e.aimA=ang(e,P); // tracks, then locks — sidestep the lock
       if(e.aimT<=0){e.aiming=false;e.cool=2.0;S.shake=Math.max(S.shake,4);
         bullets.push({x:e.x+Math.cos(e.aimA)*(e.r+6),y:e.y+Math.sin(e.aimA)*(e.r+6),
           vx:Math.cos(e.aimA)*470,vy:Math.sin(e.aimA)*470,r:4,dmg:27*e.dmgScale,src:e});
         for(let i=0;i<6;i++)particles.push({x:e.x+Math.cos(e.aimA)*(e.r+8),y:e.y+Math.sin(e.aimA)*(e.r+8),
           vx:Math.cos(e.aimA+rnd(-.5,.5))*rnd(60,160),vy:Math.sin(e.aimA+rnd(-.5,.5))*rnd(60,160),
           t:rnd(.15,.3),col:'#c8923a',r:rnd(1,2.5)});}}}
    break;
   case 'necro':
    {const a=ang(e,P);e.face=a;
     if(dToP<240){e.x-=Math.cos(a)*e.spd*dt;e.y-=Math.sin(a)*e.spd*dt;}
     e.raiseT=(e.raiseT===undefined?1.2:e.raiseT)-dt;
     if(e.raiseT<=0){e.raiseT=1.9;
       const skels=enemies.filter(x=>x.type==='skel'&&!x.dead).length;
       if(skels<8){
         for(let k2=0;k2<2;k2++){const ra=rnd(0,Math.PI*2);
           const sx=e.x+Math.cos(ra)*60,sy=e.y+Math.sin(ra)*60;
           enemies.push(mkEnemy({type:'skel',minion:true,x:sx,y:sy,hp:48*e.dmgScale,maxhp:48*e.dmgScale,
             spd:125,r:11,col:'#b8b0a0',dmgScale:e.dmgScale}));
           popup(sx,sy-20,'RISE','#7a8a6a',13);
           for(let i=0;i<6;i++)particles.push({x:sx,y:sy,vx:rnd(-50,50),vy:rnd(-110,-30),t:rnd(.3,.6),col:'#4a5444',r:rnd(1.5,3)});}}}}
    break;
   case 'skel':
    if(e.attacking)telegraphThenHit(e,dt,0,()=>{if(dToP<e.r+P.r+34)hurtPlayer(rnd(5,8)*e.dmgScale,e);});
    else{chase(1,e.r+P.r+10);if(e.cool<=0&&dToP<e.r+P.r+32)beginAttack(.4);}
    break;
   case 'stitch':
    {const a=ang(e,P);e.face=a;
     if(e.beam)e.beam.t-=dt;
     // RESURRECTION: 2s channel over any fallen named ally — real damage interrupts
     if(e.resT>0){
       if(e.hp<e._resHp-2){e.resT=0;e.resTgt=null;popup(e.x,e.y-32,'INTERRUPTED','#c8443a',12);break;}
       e._resHp=e.hp;
       if(!e.resTgt||!e.resTgt.dead){e.resT=0;e.resTgt=null;break;}
       e.resT-=dt;
       if(Math.random()<.35&&particles.length<240)
         particles.push({x:e.resTgt.x+rnd(-14,14),y:e.resTgt.y,vx:0,vy:-rnd(20,50),t:rnd(.3,.6),col:'#7fbf6a',r:2});
       if(e.resT<=0){const t2=e.resTgt;
         t2.dead=false;t2.deathT=0;t2.hp=Math.round(t2.maxhp*0.6);t2.stunT=0.5;t2.flash=.2;
         popup(t2.x,t2.y-30,'RAISED','#7fbf6a',16);
         showBanner('RESURRECTION','the needle undoes your work',1100,'#7fbf6a');
         e.beam={to:t2,t:.5};e.resTgt=null;}
       break;}
     const fallen=enemies.find(o=>o.dead&&o!==e&&!o.minion);
     if(fallen){e.resT=2;e._resHp=e.hp;e.resTgt=fallen;
       popup(e.x,e.y-32,'RAISING...','#7fbf6a',13);break;}
     if(dToP<210){e.x-=Math.cos(a)*e.spd*dt;e.y-=Math.sin(a)*e.spd*dt;}
     // SHIELD AURA on its own clock — doubles an unshielded ally's health pool
     e.shieldT=(e.shieldT===undefined?2:e.shieldT)-dt;
     if(e.shieldT<=0){e.shieldT=5;
       const tgt=enemies.find(o=>!o.dead&&o!==e&&!o.minion&&!o.healerShield);
       if(tgt){tgt.healerShield=true;tgt.hp+=tgt.maxhp;tgt.maxhp*=2;
         popup(tgt.x,tgt.y-34,'SHIELDED','#5ad2ff',14);e.beam={to:tgt,t:.5};}}
     // tripled heal — never on herself
     e.healT=(e.healT===undefined?1.5:e.healT)-dt;
     if(e.healT<=0){e.healT=2.3;
       let ally=null,worst=1;
       for(const o of enemies){if(o.dead||o===e)continue;
         const r=o.hp/o.maxhp;if(r<worst){worst=r;ally=o;}}
       if(ally&&worst<1){const amt=Math.round(39*e.dmgScale);
         ally.hp=Math.min(ally.maxhp,ally.hp+amt);
         popup(ally.x,ally.y-30,'+'+amt,'#7fbf6a',14);e.beam={to:ally,t:.45};}}}
    break;
   case 'brute':
    if(e.attacking){e.tele-=dt;
      if(e.tele<=0){e.attacking=false;e.cool=1.7;S.shake=Math.max(S.shake,5);
        if(dToP<e.r+56){let da=ang(e,P)-e.lockA;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
          if(Math.abs(da)<1.25)hurtPlayer(rnd(10,14)*e.dmgScale,e);}
        swings.push({x:e.x,y:e.y,a:e.lockA,arc:1.8,range:e.r+48,t:.16,heavy:true,col:'#9aa0a8'});}}
    else{chase(1,e.r+P.r+30);if(e.cool<=0&&dToP<e.r+66)beginAttack(.55);}
    break;
   case 'champ':
    e.thrallT-=dt;
    if(e.thrallT<=0){e.thrallT=3.25;
      for(let k2=0;k2<2;k2++){const a=rnd(0,Math.PI*2);
        enemies.push(mkEnemy({type:'thrall',minion:true,x:arena.x+Math.cos(a)*arena.r*.8,y:arena.y+Math.sin(a)*arena.r*.8,
          hp:42,maxhp:42,spd:46,r:12,col:'#6a6258',dmgScale:e.dmgScale}));}
      showBanner('THRALLS ARE THROWN IN','kill them before he does',1300);}
    {const th=enemies.find(x=>x.type==='thrall'&&!x.dead);
     if(th&&dist(e,th)<dToP*1.4){ // go feed
       const a=ang(e,th);e.face=a;e.x+=Math.cos(a)*e.spd*1.1*dt;e.y+=Math.sin(a)*e.spd*1.1*dt;
       if(dist(e,th)<e.r+th.r+8){th.hp=0;th.dead=true;bloodPool(th.x,th.y,16);
         e.feeds++;e.hp=Math.min(e.maxhp,e.hp+22);e.spd+=8;e.dmgScale+=.18;e.r+=1;
         popup(e.x,e.y-44,'HE FEEDS  +STATS','#c8443a',16);S.shake=Math.max(S.shake,6);flashFx(.12);}}
     else if(e.attacking)telegraphThenHit(e,dt,0,()=>{
        if(dToP<e.r+P.r+46){let da=ang(e,P)-e.lockA;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
          if(Math.abs(da)<1.3)hurtPlayer(rnd(11,16)*e.dmgScale,e);}
        swings.push({x:e.x,y:e.y,a:e.lockA,arc:1.8,range:e.r+50,t:.15,heavy:true,col:'#c8443a'});});
     else{chase(1);if(e.cool<=0&&dToP<e.r+60)beginAttack(.42);}}
    break;
   case 'thrall':
    {const a=rnd(0,Math.PI*2);e.x+=Math.cos(a)*e.spd*dt*.5;e.y+=Math.sin(a)*e.spd*dt*.5;}
    break;
   case 'beast':
    if(e.hp<e.maxhp*.5&&e.phase===1){e.phase=2;e.spd*=1.5;e.col='#5a2a34';
      showBanner('IT SHEDS ITS CHAINS','phase two',1500);S.shake=12;flashFx(.25);}
    if(e.attacking){e.tele-=dt;
      if(e.tele<=0){e.attacking=false;e.cool=e.phase===2?1.0:1.7;
        // slam AOE
        S.shake=Math.max(S.shake,11);vib(60);
        if(dToP<e.r+85)hurtPlayer(rnd(13,19)*e.dmgScale,e);
        swings.push({x:e.x,y:e.y,a:0,arc:Math.PI*2,range:e.r+85,t:.22,heavy:true,col:'#c8443a',ring:true});
        if(e.phase===2){zones.push({x:P.x,y:P.y,r:50,tele:.55,life:.1,type:'whipcrack',dmg:10*e.dmgScale});}}}
    else if(e.chargeT>0){e.chargeT-=dt;
      e.x+=Math.cos(e.chargeA)*430*dt;e.y+=Math.sin(e.chargeA)*430*dt;
      if(dToP<e.r+P.r+4&&!e.rammed){e.rammed=true;hurtPlayer(rnd(12,18)*e.dmgScale,e);}
      if(e.chargeT<=0)e.rammed=false;}
    else{chase(1,e.r+P.r+38);
      if(e.cool<=0){
        if(e.phase===2&&dToP>200&&Math.random()<.5){e.tele=.5;e.teleMax=.5;e.attacking=false;
          setTimeout(()=>{if(!e.dead){e.chargeT=.5;e.chargeA=ang(e,P);}},500);
          e.cool=2.2;showBanner('','',1);popup(e.x,e.y-50,'!','#c8443a',26);}
        else if(dToP<e.r+95)beginAttack(.62);}}
    break;
  }
  clampArena(e);
  // separation
  for(const o of enemies){if(o===e||o.dead)continue;const d=dist(e,o);
    if(d<e.r+o.r&&d>0){const a=ang(o,e);e.x+=Math.cos(a)*30*dt;e.y+=Math.sin(a)*30*dt;}}
}

/* ============ FIGHT FLOW ============ */
function show(id,data){UI.screen(id||null,data||null);}
function statRows(prevK,nowK){
  const rows=[];
  if(P.char==='ronin'){
    const defs=[['STR (damage)','STR'],['DEX (speed / roll)','DEX'],['CON (health)','CON'],['ATK (attack speed)','ATK']];
    for(const[lbl,k]of defs){
      const a=P.base[k]+prevK*2,b=P.base[k]+nowK*2;
      rows.push([lbl,''+b,b>a?'+'+(b-a)+' \u25b2':'']);}
    const da=1+prevK,db=1+nowK;
    rows.push(['KATANA',db+'d8',db>da?'+'+(db-da)+' die \u25b2':'']);
    rows.push(['MAX HP',''+maxHP(),'']);
    return rows;}
  const L=lvl(),pl=Math.min(10,Math.floor(1+prevK*1.5));
  rows.push(['LEVEL',L+' / 10',L>pl?'+'+(L-pl)+' \u25b2':'']);
  rows.push([P.char==='druid'?'GLAIVE':P.char==='seraph'?'SPEAR':'SPELLS',diceN()+'d8','']);
  rows.push(['MAX HP',''+maxHP(),'']);
  const UL=P.char==='druid'?[['BEAR FORM',3],['WOLF FORM',6]]
    :P.char==='seraph'?[['CHAINS OF DECREE',3],['TRIUNE MAW',6],['HALO JUDGEMENT',8]]
    :[['BONE DRAGON',3],['SUCCUBI',5],['ARCH DEVIL',8]];
  for(const[nm,req]of UL){const got=L>=req;
    rows.push([nm,got?'UNLOCKED':'level '+req,got?'\u2713':'']);}
  return rows;}
let prevKills=0;
function toBoard(){
  S.mode='board';UI.hud(false);UI.controls(false);
  const f=FIGHTS[S.fight];
  const oddsAgainst=Math.max(1,12-P.kills*1.5);
  let oddsTxt='ODDS: '+(oddsAgainst<=1?'EVEN MONEY. The Pit fears you.':oddsAgainst.toFixed(0)+'-to-1 against you');
  if(P.char!=='ronin'){oddsTxt+='   ·   LEVEL '+lvl()+'/10';
    if(P.unlockMsg){oddsTxt+='  —  '+P.unlockMsg;
      setTimeout(()=>showBanner(P.unlockMsg,'',1400,'#3df0c8'),400);P.unlockMsg=null;}}
  const rows=statRows(prevKills,P.kills);prevKills=P.kills;
  show('board',{foeName:f.name,foeRec:f.rec,foeTaunt:f.taunt,odds:oddsTxt,rows,crowd:'The crowd calls you: '+nickname});}
function startFight(){
  S.mode='fight';show(null);
  UI.hud(true);UI.controls(true);UI.name(nickname);
  UI.stats(diceN()+'d8',(P.char==='ronin'?'':'LV '+lvl()+' · ')+'KILLS '+P.kills);
  spawnFight();showBanner(FIGHTS[S.fight].name,'fight '+(S.fight+1)+' of '+FIGHTS.length,1500);}
const NICKBANKS={
 ronin:{styles:{
   untouched:['THE UNTOUCHED','THE GHOST','SMOKE ITSELF','NEVER THERE'],
   headsman:['THE HEADSMAN','THE EXECUTIONER','THE GUILLOTINE','THE LAST WORD'],
   quicksand:['QUICKSAND','THE BLUR','UNCATCHABLE','AFTERIMAGE'],
   breath:['ONE BREATH','HALF A BREATH','THE INSTANT','BEFORE THE BELL'],
   corpse:['THE STUBBORN CORPSE','HALF-DEAD AND WINNING','THE UNKILLABLE','DEATH\'S BAD DEBT'],
   mirror:['THE MIRROR','THE ANSWER','EVERY BLADE TURNED','THE PERFECT ECHO']},
  fallback:['SOMEBODY','THE PROBLEM','THE MAIN EVENT','THE WHOLE DAMN SHOW']},
 druid:{styles:{
   untouched:['WIND THROUGH LEAVES','THE UNGRASPED','NO TRACK LEFT','THE FOREST\'S FAVORITE'],
   headsman:['THE THORN','THE LANDSLIDE','NATURE\'S VERDICT','THE EXTINCTION EVENT'],
   quicksand:['THE HARE','RIVER-FOOT','THE STAMPEDE','MIGRATION SEASON'],
   breath:['FIRST FROST','THE FLASH FLOOD','LIGHTNING-STRUCK','THE AVALANCHE'],
   corpse:['THE GNARLED ROOT','DEADWOOD STILL GROWING','THE WINTER SURVIVOR','THE LAST OAK STANDING'],
   mirror:['THE BRIAR','THE TURNED THORN','THE THICKET','NO WAY THROUGH']},
  fallback:['THE STRAY','THE WILD THING','THE GREEN TIDE','THE SEASON ITSELF']},
 warlock:{styles:{
   untouched:['NOT QUITE THERE','THE VEILWALKER','ALREADY ELSEWHERE','THE UNSIGNED CLAUSE'],
   headsman:['THE SUMMONS','THE OPEN DOOR','THE LEGION\'S LANDLORD','HELL\'S QUARTERMASTER'],
   quicksand:['THE FLICKER','WRONG SIDE OF THE EYE','NOWHERE TWICE','THE UNCHASED'],
   breath:['THE SHORT CONTRACT','SIGNED IN SECONDS','THE QUICK CLAUSE','INSTANT TERMS'],
   corpse:['THE BAD INVESTMENT','STILL OWED A SOUL','THE UNCOLLECTED DEBT','FORECLOSURE PENDING'],
   mirror:['THE REFLECTED CURSE','THE RETURN POLICY','SENDER UNKNOWN','PAID IN KIND']},
  fallback:['THE DARK ELF','THE BOOKKEEPER','THE PIT\'S LAWYER','MANAGEMENT']},
 seraph:{styles:{
   untouched:['NOT OF THIS SAND','THE SPOTLESS WING','NO BLOOD ABOVE','THE UNTOUCHED HOST'],
   headsman:['THE VERDICT','THE LAST LIGHT','HEAVEN\'S SENTENCE','THE FINAL PSALM'],
   quicksand:['THE WHITE BLUR','BETWEEN WINGBEATS','THE PASSING LIGHT','GONE GLORYWARD'],
   breath:['ONE PSALM','THE SHORT SERMON','AMEN ALREADY','BEFORE THE CHOIR'],
   corpse:['THE STUBBORN MIRACLE','NOT TODAY EITHER','THE UNFALLEN','GRACE WITH SCARS'],
   mirror:['THE TURNED CHEEK','THE ANSWERED PRAYER','WRATH RETURNED','THE GATE THAT HOLDS']},
  fallback:['THE VISITOR','THE THREE-HEADED SAINT','THE CROWD\'S NEW RELIGION','THE PIT\'S OWN ANGEL']}};
function computeNickname(){
  const t=(NOW()-P.ft.t0)/1000;
  // decay old scores so recent fights drive the name — names evolve instead of sticking
  for(const k in styleScore)styleScore[k]*=.6;
  if(P.ft.low)styleScore.corpse+=2;
  if(P.ft.dmgTaken===0)styleScore.untouched+=2;
  if(t<30)styleScore.breath+=2;
  if(P.ft.heavy>P.ft.slash*0.6)styleScore.headsman+=1.3;
  if(P.ft.rolls>=6)styleScore.quicksand+=1.3;
  if(P.ft.parries>=3)styleScore.mirror+=2;
  const bank=NICKBANKS[P.char]||NICKBANKS.ronin;
  const tier=Math.min(3,Math.floor((S.fight+1)/5)); // fights 1-4, 5-9, 10-14, 15+
  let bk=null,bv=0.8;
  for(const k in styleScore)if(styleScore[k]>bv){bv=styleScore[k];bk=k;}
  const prev=nickname;
  nickname=bk?bank.styles[bk][tier]:bank.fallback[tier];
  return nickname!==prev;}
let encounterCb=null;
function addAlly(o){ // companion fighting alongside — rides the wolf AI loyally
  wolves.push(Object.assign({x:P.x+40,y:P.y+30,r:13,face:0,hp:60+P.kills*4,maxhp:60+P.kills*4,
    life:9999,cool:rnd(.4,1),lungeT:0,bit:false,walkP:0},o));}
function startEncounter(list,cb){
  encounterCb=cb||null;
  enemies=list.map(o=>mkEnemy(o));
  zones=[];swings=[];particles=[];popups=[];bullets=[];limbs=[];wolves=[];P.wolfCD=0;P.glaive=null;
  demons=[];fireballs=[];tracers=[];P.channel=null;P.slowT=0;P.paralyzeT=0;P.wardT=0;
  if(P.devilT>0){P.devilT=0;P.r=16;updateLabels();}
  if(P.char==='druid'){P.form='human';P.r=16;P.formT=0;P.humanCD=0;updateLabels();}
  cam.x=cam.tx=W/2;cam.y=cam.ty=H/2;cam.z=cam.tz=1;cam.hold=0;S.fatal=false;
  P.x=arena.x;P.y=arena.y+arena.r*0.55;P.hp=maxHP();P.dead=false;P.rollT=0;P.rollCD=0;P.heavyCD=0;P.heavyWind=0;
  P.parryT=0;P.parryCD=0;P.ripoT=0;P.combo=0;P.comboT=0;
  P.hexCD=0;P.cdVines=0;P.cdRoar=0;P.cdHowl=0;P.humanCD=0;P.wolfCD=0;P.formCD=0; // all skills fresh each fight (Hiro)
  P.ascendT=0;rays=[]; // the angel lands; the light fades
  P.ft={dmgTaken:0,heavy:0,slash:0,rolls:0,parries:0,t0:NOW(),low:false};
  S.mode='fight';UI.hud(true);UI.controls(true);UI.name(nickname);
  UI.stats(diceN()+'d8',(P.char==='ronin'?'':'LV '+lvl()+' · ')+'KILLS '+P.kills);
  UI.boss(false,'');}
function winFight(){
  if(encounterCb){const cb=encounterCb;encounterCb=null;
    computeNickname();S.mode='title';UI.hud(false);UI.controls(false);cb(true);return;}
  const renamed=computeNickname();
  S.fight++;
  if(S.fight>=FIGHTS.length){
    S.mode='victory';UI.hud(false);UI.controls(false);
    show('victory',{stats:P.kills+' kills · '+(P.char==='ronin'?'katana '+diceN()+'d8':'level '+lvl()+' · '+diceN()+'d8')+' · they call you '+nickname});return;}
  showBanner(nickname,renamed?'the crowd renames you':'the crowd roars',1700);flashFx(.15);
  setTimeout(toBoard,1500);}
let dqOrder=[],dqIdx=0;
function lose(){
  if(encounterCb){const cb=encounterCb;encounterCb=null;
    S.mode='title';UI.hud(false);UI.controls(false);cb(false);return;}
  S.mode='death';UI.hud(false);UI.controls(false);
  const _deathStats=P.kills+' kills · died to '+FIGHTS[S.fight].name;
  const q=['Bellow chalks a line through the word NOBODY.',
    '"Sand\'s cheap," someone says. "Names are cheaper."',
    'The crowd is already betting on the next one.',
    'The Door nods once. Professional respect.',
    'Your katana is sold at auction by Thursday. It refuses to stay sold.',
    'The pit rats eat well tonight. Bellow charges them admission.',
    '"He almost had a name," a child says. Almost is the Pit\'s favorite word.',
    'Wager slips fall from the tiers like grey snow. Yours among them.',
    'The Stitcher offers to sew you back together. Bellow asks who pays.'];
  if(dqOrder.length===0){dqOrder=q.map((_,i)=>i).sort(()=>Math.random()-.5);dqIdx=0;}
  const _deathQuote=q[dqOrder[dqIdx]];
  dqIdx=(dqIdx+1)%dqOrder.length;if(dqIdx===0)dqOrder=[];
  const HINTS={
    ronin:'HINTS — every kill (even summons): +2 all stats, +1 katana die. '
         +'PARRY deflects, heals 20% of your health, and fires a piercing air slash.',
    druid:'HINTS — wolf form: HOWL heals you and the pack. '
         +'Bear form hits hardest and shrugs off damage. '
         +'Human form: VINES traps everyone near you while you hop to safety.',
    warlock:'HINTS — PORTAL grants 3s of immunity after the swap. BLINK stuns everything around your departure point. '
         +'HOLD the summon button: demons arrive at 3s / 4s / 6s in one channel. '
         +'As the ARCH DEVIL, bite a succubus to ascend her — faster, and she explodes where she stands.',
    seraph:'HINTS — HALO RAY pierces every foe in the line; from level 3 it CHAINS what it touches. '
         +'ASCEND lifts you above harm — the landing staggers the circle. '
         +'At level 6 the spear\'s third strike becomes the TRIUNE MAW: three heads bite, and you are fed.'};
  show('death',{stats:_deathStats,quote:_deathQuote,hints:HINTS[P.char]||''});}
/* ============ CHARACTER INTROS (automated demos) ============ */
const BIOS={
 ronin:'The wandering samurai — said to have never lost a duel. He has traveled from the far east to become the greatest swordsman in the world. No magic. No levels. No enchantments or tricks. Just pure skill, and the vigor of defeated foes.',
 druid:'From a grove far away, she comes seeking what nature could not teach her. She hates the city — but she has strength to prove, and there is no better place than the kitchen… I mean, the arena…',
 warlock:'A dark elf from even darker realms, beneath the dark recesses of the land. His book is disconcerting. His staff is ominous. More lurks behind his portals than the city guard should logically allow. Welp — too late. He\'s in the arena.',
 seraph:'He is not from the city. He is from the place above, as most angels are. Giant wings. Runic chains. Three heads, and every one of them watching a different sin. He says great evil brews in the land and he has come to find warriors worthy of the cleansing. The crowd believes him completely. Bellow, privately, is not so sure.'};
const demo={char:'',t:0,step:0,script:null};
function demoFoe(dx,dy,hp){enemies.push(mkEnemy({type:'hook',x:arena.x+dx,y:arena.y+dy,
  hp:hp||220,maxhp:hp||220,spd:85,r:14,col:'#8a6a4a',dmgScale:.4}));}
const DEMOS={
 ronin:[
  {at:.2,cap:'THE RONIN — pure skill. Nothing else.',run:()=>{demoFoe(130,0,320);}},
  {at:1.6,cap:'SLASH — a three-cut kendo combo.',run:()=>doSlash()},
  {at:2.2,run:()=>doSlash()},
  {at:2.8,run:()=>doSlash()},
  {at:4.4,cap:'HEAVY — the overhead finisher.',run:()=>doHeavy()},
  {at:6.8,cap:'PARRY — deflect a blow: heal 20% and loose an AIR SLASH.',
   run:()=>{doParry();setTimeout(()=>{const e=enemies.find(x=>!x.dead);
     if(e&&S.mode==='demo')hurtPlayer(12,e);},300);}},
  {at:10,cap:'Every kill — even summons — feeds him: +2 ALL STATS, +1 KATANA DIE.',
   run:()=>{const e=enemies.find(x=>!x.dead);if(e)e.hp=1;doSlash();}},
  {at:12.5,cap:'When his stats double, the blade EVOLVES — NODACHI.',
   run:()=>{P.kills=5;checkRoninForm();demoFoe(150,40,420);}},
  {at:15.5,cap:'Double again — ODACHI. There is no cap. There is no ceiling.',
   run:()=>{P.kills=15;checkRoninForm();}},
  {at:17,run:()=>doSlash()},
  {at:17.9,run:()=>doHeavy()},
  {at:20.5,cap:'No tricks. Just the duel. — tap ENTER THE PIT'}],
 druid:[
  {at:.2,cap:'THE DRUID — the grove sent its sharpest thorn.',run:()=>{demoFoe(150,-35,280);demoFoe(155,55,280);}},
  {at:1.6,cap:'GLAIVE — a thrown twin blade. PIERCE: it cuts going out AND coming back.',run:()=>druidSlash()},
  {at:3.6,cap:'CRESCENT — a sweeping arc across her front.',run:()=>druidSlash()},
  {at:5.6,cap:'CYCLONE — it orbits her twice, shredding the circle.',run:()=>druidSlash()},
  {at:8,cap:'VINES — roots everything near her, and hops her to safety.',run:()=>druidHeavy()},
  {at:10.6,cap:'BEAR FORM — armored, slow, hits like a landslide.',run:()=>{P.humanCD=0;enterForm('bear');}},
  {at:11.7,cap:'CLAW.',run:()=>druidSlash()},
  {at:12.8,cap:'ROAR — staggers and shoves everything around her.',run:()=>druidHeavy()},
  {at:14.6,cap:'WOLF FORM — fast, and three spirit wolves answer the call.',run:()=>{P.wolfCD=0;enterForm('wolf');}},
  {at:15.8,cap:'HOWL — heals her and the whole pack.',run:()=>druidHeavy()},
  {at:17.2,run:()=>druidSlash()},
  {at:19.8,cap:'She hates the city. The arena will do. — tap ENTER THE PIT'}],
 warlock:[
  {at:.2,cap:'THE WARLOCK — what follows him should not fit through doors.',run:()=>{demoFoe(165,-45,320);demoFoe(175,60,320);}},
  {at:1.6,cap:'HEX — a bolt that slows its mark and rots it.',run:()=>hexBolt()},
  {at:3.4,cap:'BLINK — he vanishes backward; everything nearby is stunned.',run:()=>blink()},
  {at:5.8,cap:'PORTAL — swap places with the furthest foe. Untouchable for 3 seconds.',run:()=>portal()},
  {at:8.2,cap:'HOLD SUMMON — the ladder answers. First: the CLAW FIEND.',run:()=>summonDemons('brute')},
  {at:10.2,cap:'Then the BONE DRAGON — its breath lingers as paralytic gas.',run:()=>summonDemons('dragon')},
  {at:12.2,cap:'Then the COVEN. And then... the pact turns.',run:()=>{summonDemons('succubus');enterDevil();}},
  {at:13.8,cap:'ARCH DEVIL — CLAW lunges to his own demons and DEVOURS them.',run:()=>devilClaw()},
  {at:15.2,run:()=>devilClaw()},
  {at:16.8,cap:'BITE a succubus — no harm done. She ASCENDS instead.',
   run:()=>{const sc2=demons.find(d=>d.type==='succubus'&&d.hp>0);
     if(sc2){P.x=sc2.x-34;P.y=sc2.y;}devilStrike(1.0,true);}},
  {at:18.4,cap:'She holds her ground. Seven seconds later — she BURSTS.'},
  {at:25,cap:'Welp. Too late — he\'s in the arena. — tap ENTER THE PIT'}],
 seraph:[
  {at:.2,cap:'THE SERAPHIM — the place above sent a recruiter.',run:()=>{demoFoe(150,-40,320);demoFoe(160,50,320);}},
  {at:1.6,cap:'SPEAR — a thrust longer than any blade in the Pit.',run:()=>seraphSlash()},
  {at:2.3,run:()=>seraphSlash()},
  {at:3.6,cap:'HALO RAY — the crown leaves his brow and UNMAKES the line.',run:()=>doHeavy()},
  {at:6.2,cap:'From level 3 the ray binds — CHAINS OF DECREE hold what it touches.',run:()=>{demoFoe(170,-60,300);demoFoe(180,0,300);}},
  {at:7.4,run:()=>doHeavy()},
  {at:9.8,cap:'ASCEND — the wings answer. Above the sand, above the blades.',run:()=>ascend()},
  {at:11.4,cap:'The landing is the sentence.'},
  {at:13.2,cap:'TRIUNE MAW — at level 6, all three heads lunge. And are fed.',run:()=>{P.combo=2;P.comboT=1;seraphSlash();}},
  {at:15,run:()=>{P.combo=2;P.comboT=1;seraphSlash();}},
  {at:17,cap:'He seeks the worthy. The Pit will do for a start. — tap ENTER THE PIT'}]};
function demoReset(){
  const ch=demo.char;
  P.char=ch;P.kills=0;P.level=ch==='ronin'?1:10;P.bladeTier=0;P.form='human';P.r=16;
  P.dead=false;P.channel=null;P.glaive=null;P.devilT=0;P.wardT=0;P.slowT=0;P.paralyzeT=0;
  P.formT=0;P.humanCD=0;P.wolfCD=0;P.cdVines=0;P.cdRoar=0;P.cdHowl=0;
  P.parryCD=0;P.parryT=0;P.heavyCD=0;P.heavyWind=0;P.rollCD=0;P.rollT=0;P.atkRecover=0;P.flash=0;P.hexCD=0;
  P.ascendT=0;rays=[];
  P.combo=0;P.comboT=0;P.ft={dmgTaken:0,heavy:0,slash:0,rolls:0,parries:0,t0:NOW(),low:false};
  P.hp=maxHP();
  wolves=[];demons=[];fireballs=[];tracers=[];enemies=[];zones=[];swings=[];particles=[];popups=[];bullets=[];limbs=[];
  dctx.clearRect(0,0,W,H);
  P.x=arena.x-arena.r*.3;P.y=arena.y;
  cam.x=cam.tx=W/2;cam.y=cam.ty=H/2;cam.z=cam.tz=1;cam.hold=0;S.fatal=false;S.slow=0;
  demo.t=0;demo.step=0;
  UI.stats(diceN()+'d8',ch==='ronin'?'KILLS 0':'LV '+lvl());
  updateLabels();}
function startIntro(ch){
  demo.char=ch;demo.script=DEMOS[ch];
  S.mode='demo';
  show(null);
  demoReset();
  UI.hud(true);UI.controls(false);UI.boss(false,'');
  UI.name({ronin:'THE RONIN',druid:'THE DRUID',warlock:'THE WARLOCK',seraph:'THE SERAPHIM'}[ch]);
  UI.demoCap('');
  UI.intro(true,{name:{ronin:'THE RONIN',druid:'THE DRUID',warlock:'THE WARLOCK',seraph:'THE SERAPHIM'}[ch],bio:BIOS[ch]});}
function endIntro(){
  UI.intro(false);
  S.mode='title';
  fullReset(demo.char);}
function fullReset(ch){
  S.fight=0;P.kills=0;prevKills=0;nickname='NOBODY';
  if(ch)P.char=ch;
  P.form='human';P.r=16;P.wolfCD=0;P.formT=0;P.humanCD=0;P.bladeTier=0;P.slowT=0;P.paralyzeT=0;P.wardT=0;P.devilT=0;P.hexCD=0;P.level=1;P.unlockMsg=null;P.cdVines=0;P.cdRoar=0;P.cdHowl=0;wolves=[];demons=[];fireballs=[];P.channel=null;P.glaive=null;P.ascendT=0;rays=[];
  styleScore={untouched:0,headsman:0,quicksand:0,breath:0,corpse:0,mirror:0};
  updateLabels();
  dctx.clearRect(0,0,W,H);toBoard();}


/* ============ UPDATE ============ */
let last=NOW();
function tick(now){
  let dt=Math.min(.05,(now-last)/1000);last=now;
  // camera: tween toward target, release to neutral when hold expires
  cam.hold=Math.max(0,cam.hold-dt);
  if(cam.hold<=0){cam.tx=W/2;cam.ty=H/2;cam.tz=1;}
  cam.x+=(cam.tx-cam.x)*.11;cam.y+=(cam.ty-cam.y)*.11;cam.z+=(cam.tz-cam.z)*.11;
  S.time+=dt;
  if(S.hitPause>0){S.hitPause-=dt;draw();return;}
  if(S.slow>0){S.slow-=dt;dt*=(S.fatal?0.16:0.35);if(S.slow<=0)S.fatal=false;}
  // limbs fly even outside fight mode (epilogue twitch)
  for(let i=limbs.length-1;i>=0;i--){const L=limbs[i];
    L.t-=dt;L.x+=L.vx*dt;L.y+=L.vy*dt;L.vx*=.93;L.vy*=.93;L.rot+=L.vr*dt;L.vr*=.95;
    if(L.t<=0){stampLimb(L);limbs.splice(i,1);}}
  if(S.mode!=='fight'&&S.mode!=='demo'){draw();return;}
  if(S.mode==='demo'){ // automated intro: fire script steps, keep the star alive
    demo.t+=dt;
    if(P.hp<maxHP()*.45)P.hp=Math.round(maxHP()*.8);
    const sc=demo.script;
    while(demo.step<sc.length&&demo.t>=sc[demo.step].at){
      const st=sc[demo.step++];
      if(st.cap)UI.demoCap(st.cap);
      if(st.run)st.run();}
    if(demo.step>=sc.length&&demo.t>=sc[sc.length-1].at+5)demoReset(); // loop the show
  }

  // player
  if(!P.dead){
    P.rollCD=Math.max(0,P.rollCD-dt);P.heavyCD=Math.max(0,P.heavyCD-dt);
    P.parryT=Math.max(0,P.parryT-dt);P.parryCD=Math.max(0,P.parryCD-dt);
    P.formCD=Math.max(0,P.formCD-dt);P.wolfCD=Math.max(0,P.wolfCD-dt);
    P.slowT=Math.max(0,(P.slowT||0)-dt);P.wardT=Math.max(0,(P.wardT||0)-dt);P.hexCD=Math.max(0,(P.hexCD||0)-dt);
    if(P.devilT>0){P.devilT-=dt;if(P.devilT<=0)exitDevil();}
    P.cdVines=Math.max(0,(P.cdVines||0)-dt);P.cdRoar=Math.max(0,(P.cdRoar||0)-dt);P.cdHowl=Math.max(0,(P.cdHowl||0)-dt);
    if(P.paralyzeT>0){P.paralyzeT-=dt;
      if(Math.random()<.3&&particles.length<240)particles.push({x:P.x+rnd(-12,12),y:P.y-20+rnd(-10,10),
        vx:rnd(-40,40),vy:rnd(-40,40),t:.15,col:'#f0e05a',r:2});}
    if(P.char==='druid'){
      P.humanCD=Math.max(0,P.humanCD-dt);
      if(P.form!=='human'){P.formT-=dt;if(P.formT<=0)revertToHuman();}}
    P.ripoT=Math.max(0,P.ripoT-dt);P.comboT=Math.max(0,P.comboT-dt);
    P.atkRecover=Math.max(0,P.atkRecover-dt);P.flash=Math.max(0,P.flash-dt);
    if(P.heavyWind>0){P.heavyWind-=dt;autoFace();if(P.heavyWind<=0){if(P.char==='seraph')fireRay();else heavyLand();}}
    if(P.char==='seraph'&&P.ascendT>0){P.ascendT-=dt;if(P.ascendT<=0)seraphSlam();}
    if(P.channel){const c=P.channel;c.t+=dt;
      if(c.t>=3&&!c.b){c.b=true;
        if(!demons.some(d=>d.type==='brute'&&d.hp>0)){c.any=true;summonDemons('brute');}
        else popup(P.x,P.y-58,'FIEND LIVES','#8a93a8',11);}
      if(c.t>=4&&!c.d){c.d=true;
        if(lvl()<3)popup(P.x,P.y-58,'DRAGON AT LEVEL 3','#8a93a8',11);
        else if(!demons.some(d=>d.type==='dragon'&&d.hp>0)){c.any=true;summonDemons('dragon');}
        else popup(P.x,P.y-58,'DRAGON LIVES','#8a93a8',11);}
      if(c.t>=6){
        if(lvl()<5)popup(P.x,P.y-58,'COVEN AT LEVEL 5','#8a93a8',11);
        else if(!demons.some(d=>d.type==='succubus'&&d.hp>0)){c.any=true;summonDemons('succubus');enterDevil();}
        else popup(P.x,P.y-58,'COVEN LIVES','#8a93a8',11);
        P.channel=P.devilT>0?null:{t:0,b:false,d:false,any:true};}} // ladder restarts unless he transformed
    if(P.rollT>0){P.rollT-=dt;
      P.x+=P.rollDX*430*dt;P.y+=P.rollDY*430*dt;}
    else if(!P.channel&&!(P.paralyzeT>0)){
      let mx=stick.dx,my=stick.dy,mg=stick.mag;
      if(keys['w']){my=-1;mg=1}if(keys['s']){my=1;mg=1}
      if(keys['a']){mx=-1;mg=1}if(keys['d']){mx=1;mg=1}
      const m=Math.hypot(mx,my);
      if(m>.15){const fm=(P.char==='druid'?(P.form==='bear'?0.75:P.form==='wolf'?1.38:1):1)*(P.slowT>0?0.5:1);
        const sp=moveSpd()*fm*(P.heavyWind>0?.3:1)*Math.min(1,mg);
        P.x+=mx/m*sp*dt;P.y+=my/m*sp*dt;}
    }
    // always square up to the nearest real enemy (the arch devil eyes his own demons first)
    {let nf=null;
     if(P.devilT>0){let bd=1e9;
       for(const d of demons){if(d.hp<=0||d.arch)continue;const dd2=dist(P,d);if(dd2<bd){bd=dd2;nf=d;}}}
     if(!nf)nf=nearestRealFoe();
     if(nf&&P.atkRecover<=0)P.face=ang(P,nf);}
    clampArena(P);
  }
  // enemies
  for(const e of enemies)updEnemy(e,dt);
  // spirit wolves
  updWolves(dt);
  // demons & their projectiles
  updDemons(dt);updFireballs(dt);updRays(dt);
  for(let i=tracers.length-1;i>=0;i--){tracers[i].t-=dt;if(tracers[i].t<=0)tracers.splice(i,1);}
  // thrown glaive
  updGlaive(dt);
  // zones
  for(let i=zones.length-1;i>=0;i--){const z=zones[i];
    if(z.tele>0){z.tele-=dt;
      if(z.tele<=0&&z.type==='whipcrack'){
        if(dist(z,P)<z.r)hurtPlayer(z.dmg,null);
        swings.push({x:z.x,y:z.y,a:0,arc:7,range:z.r,t:.15,heavy:false,col:'#c8923a',ring:true});
        zones.splice(i,1);}
      else if(z.tele<=0&&z.type==='ice'){
        if(dist(z,P)<z.r&&P.rollT<=0&&!(P.wardT>0)){hurtPlayer(z.dmg,null);P.slowT=3;
          popup(P.x,P.y-44,'CHILLED','#5ad2ff',13);}
        swings.push({x:z.x,y:z.y,a:0,arc:7,range:z.r,t:.18,heavy:false,col:'#5ad2ff',ring:true});
        zones.splice(i,1);}
      else if(z.tele<=0&&z.type==='bolt'){
        if(dist(z,P)<z.r&&P.rollT<=0&&!(P.wardT>0)){P.paralyzeT=3;
          if(P.channel){P.channel=null;}
          popup(P.x,P.y-44,'PARALYZED','#f0e05a',15);vib(60);}
        swings.push({x:z.x,y:z.y,a:0,arc:7,range:z.r,t:.18,heavy:false,col:'#f0e05a',ring:true});
        flashFx(.12);
        zones.splice(i,1);} continue;}
    if(z.type==='fire'){z.life-=dt;
      if(dist(z,P)<z.r&&P.rollT<=0){z.tick=(z.tick||0)-dt;
        if(z.tick<=0){z.tick=.45;hurtPlayer(4*(1+S.fight*.2),null);}}
      if(z.life<=0)zones.splice(i,1);}
    else if(z.type==='gas'){z.life-=dt;
      z.tick=(z.tick||0)-dt;
      if(z.tick<=0){z.tick=.5;
        for(const e of enemies){if(e.dead)continue;
          if(dist(z,e)<z.r){e.stunT=Math.max(e.stunT||0,2);
            dotDamage(e,1,'#7fd05a');}}}
      if(z.life<=0)zones.splice(i,1);}}
  // bullets
  for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    const tb=demonTaunt();
    if(tb&&Math.hypot(b.x-tb.x,b.y-tb.y)<tb.r+b.r){
      hurtDemon(tb,Math.round(b.dmg),b.src);bullets.splice(i,1);continue;}
    if(dist(b,P)<P.r+b.r){
      if(P.rollT<=0)hurtPlayer(b.dmg,b.src);
      bullets.splice(i,1);continue;}
    if(Math.hypot(b.x-arena.x,b.y-arena.y)>arena.r+30)bullets.splice(i,1);}
  // particles & popups & swings
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.t-=dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;
    if(p.t<=0){
      if(p.col==='#8a1f1c'&&Math.random()<.5){dctx.fillStyle='rgba(96,18,14,.5)';dctx.beginPath();dctx.arc(p.x,p.y,p.r,0,7);dctx.fill();}
      if(p.chunk){dctx.fillStyle='rgba(44,24,16,.65)';dctx.beginPath();dctx.ellipse(p.x,p.y,p.r,p.r*.6,rnd(0,3),0,7);dctx.fill();}
      particles.splice(i,1);}}
  for(let i=popups.length-1;i>=0;i--){const p=popups[i];p.t-=dt*1.1;p.y-=34*dt;if(p.t<=0)popups.splice(i,1);}
  for(let i=swings.length-1;i>=0;i--){swings[i].t-=dt;if(swings[i].t<=0)swings.splice(i,1);}
  S.shake=Math.max(0,S.shake-dt*30);
  // hud
  UI.hpbar(Math.max(0,P.hp/maxHP()));
  const boss=enemies.find(e=>!e.minion&&!e.dead);
  if(S.fight>=18&&boss)UI.bossbar(Math.max(0,boss.hp/boss.maxhp));
  UI.cds({
    roll:P.rollCD>0?P.rollCD/(P.char==='warlock'?2.2:rollCDmax()):0,
    slash:(P.char==='warlock'&&!(P.devilT>0)&&P.hexCD>0)?(P.hexCD||0)/10:0,
    heavy:(()=>{let hv=P.heavyCD,hm=P.heavyCDmax||2.2;
      if(P.char==='druid'){hv=P.form==='human'?P.cdVines:(P.form==='bear'?P.cdRoar:P.cdHowl);
        hm=P.form==='human'?3:(P.form==='bear'?4:6);}
      return hv>0?hv/hm:0;})(),
    parry:(()=>{let pv=P.parryCD,pm=1.4;
      if(P.char==='druid'){pv=P.form==='human'?P.humanCD:0;pm=5;}
      else if(P.char==='warlock')pm=3;
      else if(P.char==='seraph')pm=6;
      return pv>0?pv/pm:0;})()
  });
  draw();
}

/* ============ DRAW ============ */
function drawFighter(x,y,r,face,col,o={}){
  const t=S.time,flash=o.flash>0,C=v=>flash?'#fff':v;
  const SKIN=C('#caa27a'),LIMB=C(o.skull?'#cfc6b4':'#1c1611');
  // shadow
  ctx.save();ctx.globalAlpha=o.dead?Math.max(0,.4-o.deathT*.3):.45;
  ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y+r*.6,r*1.1,r*.42,0,0,7);ctx.fill();ctx.restore();
  /* ---- corpse: sprawled, weapon dropped ---- */
  if(o.dead){
    const sd=(Math.floor(x*13+y*7))%6;
    ctx.save();ctx.translate(x,y);ctx.rotate(sd);
    ctx.globalAlpha=Math.max(.15,1-o.deathT*.55);
    if(o.wpnLen){ctx.strokeStyle=C(o.wpnCol||'#cfd3d8');ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(r*1.1,r*.6);ctx.lineTo(r*1.1+o.wpnLen,r*.6+4);ctx.stroke();}
    ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;ctx.lineCap='round';
    for(const a of[.7,2.5,3.8,5.6]){ctx.beginPath();ctx.moveTo(0,0);
      ctx.lineTo(Math.cos(a)*r*1.15,Math.sin(a)*r*1.15);ctx.stroke();}
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,r*.9,r*.55,.4,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=C(o.skull?'#d8cdb8':'#1c1611');
    ctx.beginPath();ctx.arc(r*.78,-r*.42,r*.4,0,7);ctx.fill();ctx.stroke();
    ctx.restore();return;}
  const walk=o.phase||0,moving=o.moving;
  const bob=(moving?Math.sin(walk*2)*1.2:Math.sin(t*2.2+x*.02)*.6);
  ctx.save();ctx.translate(x,y+bob*.35);ctx.lineCap='round';
  /* ---- roll: tucked ball ---- */
  if(o.roll){ctx.rotate(o.rollSpin||0);
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,r*.85,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=LIMB;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(0,0,r*.55,.5,2.6);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,r*.55,3.6,5.7);ctx.stroke();
    ctx.restore();return;}
  const perp=face+Math.PI/2;
  /* ---- blob (mountain slimes) ---- */
  if(o.blob){
    const sq=1+Math.sin(t*4+x*.05)*.12; // idle wobble
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.globalAlpha=.92;
    ctx.beginPath();ctx.ellipse(0,r*.15,r*1.05*sq,r*.8/sq,0,0,7);ctx.fill();ctx.stroke();
    ctx.globalAlpha=.55;ctx.fillStyle=C('#ffffff');
    ctx.beginPath();ctx.ellipse(-r*.3,-r*.15,r*.22,r*.14,-.5,0,7);ctx.fill(); // glisten
    ctx.globalAlpha=1;
    ctx.fillStyle=C('#1a141e'); // something half-digested floats inside
    ctx.beginPath();ctx.arc(r*.15,r*.1,r*.16,0,7);ctx.fill();
    ctx.restore();return;}
  /* ---- quadruped (hounds) ---- */
  if(o.quad){ctx.rotate(face);
    ctx.fillStyle=C('#15100c');
    for(const s of[[1,1],[1,-1],[-1,1],[-1,-1]]){
      const ph=Math.sin(walk+(s[0]*s[1]>0?0:Math.PI))*r*.3*(moving?1:0);
      ctx.beginPath();ctx.ellipse(s[0]*r*.6+ph,s[1]*r*.5,r*.16,r*.12,0,0,7);ctx.fill();}
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,r*1.15,r*.5,0,0,7);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*1.1,0);ctx.lineTo(-r*1.6,Math.sin(t*9)*r*.18);
    ctx.strokeStyle=C(col);ctx.lineWidth=2.5;ctx.stroke(); // tail
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(r*1.15,0,r*.4,0,7);ctx.fill();ctx.stroke(); // head
    ctx.fillStyle=C('#0a0806'); // ears
    ctx.beginPath();ctx.ellipse(r*1.0,-r*.32,r*.14,r*.2,-.4,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(r*1.0,r*.32,r*.14,r*.2,.4,0,7);ctx.fill();
    ctx.restore();return;}
  /* ---- hulk (the beast / bear form) ---- */
  if(o.hulk){
    const kn=Math.sin(walk)*r*.25*(moving?1:0);
    // knuckle-walk arms with big fists
    for(const s of[-1,1]){
      const fx=Math.cos(face)*r*.9+Math.cos(perp)*r*.95*s,
            fy=Math.sin(face)*r*.9+Math.sin(perp)*r*.95*s+kn*s;
      ctx.strokeStyle=LIMB;ctx.lineWidth=6;
      ctx.beginPath();ctx.moveTo(Math.cos(perp)*r*.7*s,Math.sin(perp)*r*.7*s);
      ctx.lineTo(fx,fy);ctx.stroke();
      ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(fx,fy,r*.32,0,7);ctx.fill();ctx.stroke();
      if(o.bear){ctx.strokeStyle=C('#e8e0d0');ctx.lineWidth=1.5; // claws
        for(let c2=-1;c2<=1;c2++){ctx.beginPath();
          ctx.moveTo(fx+Math.cos(face+c2*.4)*r*.3,fy+Math.sin(face+c2*.4)*r*.3);
          ctx.lineTo(fx+Math.cos(face+c2*.4)*r*.48,fy+Math.sin(face+c2*.4)*r*.48);ctx.stroke();}}}
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2.5;
    ctx.save();ctx.rotate(perp);
    ctx.beginPath();ctx.ellipse(0,0,r*1.0,r*.8,0,0,7);ctx.fill();ctx.stroke();ctx.restore();
    if(!o.bear){ // spines (beast only)
      ctx.strokeStyle=C('#1a141e');ctx.lineWidth=2.5;
      for(let i=-2;i<=2;i++){const a=face+Math.PI+i*.3;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.6,Math.sin(a)*r*.6);
        ctx.lineTo(Math.cos(a)*r*1.05,Math.sin(a)*r*1.05);ctx.stroke();}}
    ctx.fillStyle=C(o.headCol||'#2a2030');ctx.strokeStyle='#000';ctx.lineWidth=2;
    const bhx=Math.cos(face)*r*.75,bhy=Math.sin(face)*r*.75;
    ctx.beginPath();ctx.arc(bhx,bhy,r*.34,0,7);ctx.fill();ctx.stroke();
    if(o.bear){ // round ears + snout
      ctx.fillStyle=C(col);
      for(const s of[-1,1]){ctx.beginPath();
        ctx.arc(bhx+Math.cos(perp)*r*.26*s,bhy+Math.sin(perp)*r*.26*s-r*.18,r*.13,0,7);
        ctx.fill();ctx.stroke();}
      ctx.fillStyle=C('#3a2a18');
      ctx.beginPath();ctx.arc(bhx+Math.cos(face)*r*.24,bhy+Math.sin(face)*r*.24,r*.13,0,7);ctx.fill();}
    // eyes
    ctx.fillStyle=flash?'#fff':(o.bear?'#f0b03d':'#c8443a');
    for(const s of[-1,1])ctx.fillRect(bhx+Math.cos(face)*r*.07+Math.cos(perp)*4*s-1.5,
      bhy+Math.sin(face)*r*.07+Math.sin(perp)*4*s-1.5,3,3);
    ctx.restore();return;}
  /* ---- humanoid ---- */
  // feet (or robe skirt)
  if(o.robe){
    ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,r*.3,r*.78+Math.sin(t*3)*1,r*.5,0,0,7);ctx.fill();ctx.stroke();}
  else{
    const step=Math.sin(walk)*r*.5*(moving?1:.12);
    ctx.fillStyle=C('#15100c');ctx.strokeStyle='#000';ctx.lineWidth=1.5;
    for(const s of[-1,1]){
      const fx=Math.cos(perp)*r*.42*s+Math.cos(face)*step*s,
            fy=Math.sin(perp)*r*.42*s+Math.sin(face)*step*s+r*.45;
      ctx.beginPath();ctx.ellipse(fx,fy,r*.27,r*.17,face,0,7);ctx.fill();ctx.stroke();}}
  // torso (shoulder axis perpendicular to facing)
  ctx.save();ctx.rotate(perp);
  ctx.fillStyle=C(col);ctx.strokeStyle='#000';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,r*.92,r*.6,0,0,7);ctx.fill();ctx.stroke();
  if(o.samurai){ // lacquered do plates
    ctx.strokeStyle=C('#1c1410');ctx.lineWidth=2;
    for(const off of[-r*.42,0,r*.42]){ctx.beginPath();ctx.moveTo(off,-r*.45);ctx.lineTo(off,r*.45);ctx.stroke();}
    ctx.fillStyle=C('#c8923a');ctx.beginPath();ctx.arc(0,0,r*.16,0,7);ctx.fill();}
  ctx.restore();
  // shoulders / pauldrons
  const s1x=Math.cos(perp)*r*.85,s1y=Math.sin(perp)*r*.85,
        s2x=-s1x,s2y=-s1y;
  ctx.fillStyle=C(o.samurai?'#3a4452':col);ctx.strokeStyle='#000';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(s1x,s1y,r*.3,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(s2x,s2y,r*.3,0,7);ctx.fill();ctx.stroke();
  // arms + held weapon
  if(o.gun){ // both hands forward on the long gun
    const gx=Math.cos(face)*r*1.05,gy=Math.sin(face)*r*1.05;
    const g2x=gx+Math.cos(face)*r*.8,g2y=gy+Math.sin(face)*r*.8;
    ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(s1x,s1y);ctx.lineTo(gx,gy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(s2x,s2y);ctx.lineTo(g2x,g2y);ctx.stroke();
    ctx.strokeStyle=C('#3a3630');ctx.lineWidth=4.5;
    ctx.beginPath();ctx.moveTo(gx-Math.cos(face)*r*.4,gy-Math.sin(face)*r*.4);
    ctx.lineTo(gx+Math.cos(face)*r*1.9,gy+Math.sin(face)*r*1.9);ctx.stroke();
    ctx.fillStyle=SKIN;
    ctx.beginPath();ctx.arc(gx,gy,r*.16,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(g2x,g2y,r*.16,0,7);ctx.fill();}
  else if(o.wpnLen){
    const sw=o.wpnSwing||0,raised=sw<-1.3;
    const ga=face+sw*.55,wa=face+sw;
    const gd=raised?r*.55:r*1.0;
    const gx=Math.cos(ga)*gd,gy=Math.sin(ga)*gd-(raised?r*.45:0);
    if(o.twin){ // double-bladed glaive held at the balance point
      const hx2=Math.cos(wa),hy2=Math.sin(wa);
      ctx.strokeStyle=C('#5a4a36');ctx.lineWidth=3.5; // long handle both ways
      ctx.beginPath();ctx.moveTo(gx-hx2*16,gy-hy2*16);ctx.lineTo(gx+hx2*16,gy+hy2*16);ctx.stroke();
      ctx.strokeStyle=C('#d8e4d0');ctx.lineWidth=2.6; // crescents at each end
      ctx.beginPath();ctx.arc(gx+hx2*20,gy+hy2*20-4,8,Math.PI*0.4,Math.PI*1.25);ctx.stroke();
      ctx.beginPath();ctx.arc(gx-hx2*20,gy-hy2*20+4,8,Math.PI*1.4,Math.PI*2.25);ctx.stroke();
      // arms: both hands on the haft
      const h2x=gx-hx2*r*.4,h2y=gy-hy2*r*.4;
      ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;
      ctx.beginPath();ctx.moveTo(s1x,s1y);ctx.lineTo(gx,gy);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s2x,s2y);ctx.lineTo(h2x,h2y);ctx.stroke();
      ctx.fillStyle=SKIN;
      ctx.beginPath();ctx.arc(gx,gy,r*.15,0,7);ctx.fill();
      ctx.beginPath();ctx.arc(h2x,h2y,r*.15,0,7);ctx.fill();
    }else{
    // blade
    ctx.strokeStyle=C(o.wpnCol||'#cfd3d8');ctx.lineWidth=o.thickWpn?5:3;
    ctx.beginPath();ctx.moveTo(gx,gy);
    ctx.lineTo(gx+Math.cos(wa)*o.wpnLen,gy+Math.sin(wa)*o.wpnLen);ctx.stroke();
    if(o.samurai){ctx.fillStyle=C('#8a6a2a'); // tsuba
      ctx.beginPath();ctx.arc(gx+Math.cos(wa)*6,gy+Math.sin(wa)*6,2.8,0,7);ctx.fill();}
    if(o.staffTip){ // staff head: glowing orb (green for druid, set tipCol to override)
      const tipC=o.tipCol||'#7fbf6a';
      const tx2=gx+Math.cos(wa)*o.wpnLen,ty2=gy+Math.sin(wa)*o.wpnLen;
      const sg=ctx.createRadialGradient(tx2,ty2,1,tx2,ty2,8);
      sg.addColorStop(0,tipC+'cc');sg.addColorStop(1,'transparent');
      ctx.fillStyle=sg;ctx.beginPath();ctx.arc(tx2,ty2,8,0,7);ctx.fill();
      ctx.fillStyle=C(tipC);ctx.beginPath();ctx.arc(tx2,ty2,3,0,7);ctx.fill();}
    if(o.thickWpn){ctx.fillStyle=C(o.wpnCol||'#5a5248'); // maul/club head
      ctx.beginPath();ctx.arc(gx+Math.cos(wa)*o.wpnLen,gy+Math.sin(wa)*o.wpnLen,r*.3,0,7);ctx.fill();
      ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.stroke();}
    // arms: lead hand on grip, rear hand lower on handle (two-hand kendo grip)
    const h2x=gx-Math.cos(wa)*r*.45,h2y=gy-Math.sin(wa)*r*.45;
    ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(s1x,s1y);ctx.lineTo(gx,gy);ctx.stroke();
    if(o.twoHand!==false){ctx.beginPath();ctx.moveTo(s2x,s2y);ctx.lineTo(h2x,h2y);ctx.stroke();}
    ctx.fillStyle=SKIN;
    ctx.beginPath();ctx.arc(gx,gy,r*.15,0,7);ctx.fill();
    if(o.twoHand!==false){ctx.beginPath();ctx.arc(h2x,h2y,r*.15,0,7);ctx.fill();}}}
  else{ // unarmed idle arms
    ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;
    const sw2=Math.sin(walk)*r*.25*(moving?1:0);
    for(const[sx,sy,s]of[[s1x,s1y,1],[s2x,s2y,-1]]){
      const hx=sx+Math.cos(face)*r*.5+Math.cos(face)*sw2*s,
            hy=sy+Math.sin(face)*r*.5+Math.sin(face)*sw2*s;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(hx,hy);ctx.stroke();
      ctx.fillStyle=o.skull?C('#d8cdb8'):SKIN;
      ctx.beginPath();ctx.arc(hx,hy,r*.14,0,7);ctx.fill();}}
  // off-hand shield (held, with arm)
  if(o.shield){
    const shx=Math.cos(face)*r*.72,shy=Math.sin(face)*r*.72;
    ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(s2x,s2y);ctx.lineTo(shx,shy);ctx.stroke();
    ctx.save();ctx.rotate(face);
    ctx.fillStyle=C('#4a4238');ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.rect(r*.6,-r*.95,r*.4,r*1.9);ctx.fill();ctx.stroke();
    ctx.strokeStyle=C('#2c2820');ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(r*.8,-r*.7);ctx.lineTo(r*.8,r*.7);ctx.stroke();
    ctx.restore();}
  // head
  const hx=Math.cos(face)*r*.26,hy=Math.sin(face)*r*.26-r*.16;
  ctx.fillStyle=C(o.skull?'#d8cdb8':(o.warlock?'#8a8aa4':(o.headCol&&!o.warlock?o.headCol:o.headCol||'#1c1611')));
  ctx.strokeStyle='#000';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(hx,hy,r*.42,0,7);ctx.fill();ctx.stroke();
  if(o.warlock){ // dark elf: pointed ears + white hair + the book
    ctx.fillStyle=C('#8a8aa4');
    for(const s of[-1,1]){ // long pointed ears
      const ex=hx+Math.cos(perp)*r*.4*s,ey=hy+Math.sin(perp)*r*.4*s;
      ctx.beginPath();ctx.moveTo(ex,ey+2);
      ctx.lineTo(ex+Math.cos(perp)*r*.34*s,ey-r*.22);
      ctx.lineTo(ex-1*s,ey-2);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.fillStyle=C('#e8e8f0'); // white hair, swept back
    ctx.beginPath();ctx.arc(hx,hy-r*.08,r*.44,Math.PI*.95,Math.PI*2.05);ctx.fill();
    ctx.beginPath();ctx.ellipse(hx-Math.cos(face)*r*.4,hy-Math.sin(face)*r*.4+r*.14,
      r*.16,r*.4,face+Math.PI/2,0,7);ctx.fill();
    // open demonology book floating at the off-hand
    const bx=-Math.cos(face)*r*.2+Math.cos(perp)*r*1.05,
          by=-Math.sin(face)*r*.2+Math.sin(perp)*r*1.05-r*1.1+Math.sin(t*2.5)*1.5;
    ctx.save();ctx.translate(bx,by);ctx.rotate(face*.1);
    ctx.fillStyle=C('#2a1828');ctx.strokeStyle='#000';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(0,-3);ctx.lineTo(9,0);ctx.lineTo(9,3);ctx.lineTo(0,1);ctx.lineTo(-9,3);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle=C('#d8cdc0'); // pages
    ctx.beginPath();ctx.moveTo(-8,-.5);ctx.lineTo(0,-3);ctx.lineTo(8,-.5);ctx.lineTo(0,-1.5);ctx.closePath();ctx.fill();
    ctx.fillStyle='#b070f0'; // glowing runes rising
    ctx.fillRect(-4,-5-Math.sin(t*4)*2,2,2);ctx.fillRect(3,-6-Math.sin(t*4+2)*2,2,2);
    ctx.restore();
    // arm to the book
    ctx.strokeStyle=LIMB;ctx.lineWidth=3.5;
    ctx.beginPath();ctx.moveTo(s2x,s2y);ctx.lineTo(bx,by+5);ctx.stroke();}
  if(o.skull){ctx.fillStyle=flash?'#888':'#1c1611'; // eye sockets
    for(const s of[-1,1])ctx.beginPath(),
      ctx.arc(hx+Math.cos(face)*r*.18+Math.cos(perp)*r*.15*s,
              hy+Math.sin(face)*r*.18+Math.sin(perp)*r*.15*s,r*.08,0,7),ctx.fill();}
  if(o.druid){ // long auburn hair flowing behind + leaf circlet
    ctx.fillStyle=C('#7a4424');
    ctx.beginPath();ctx.arc(hx,hy-r*.06,r*.46,Math.PI*.9,Math.PI*2.1);ctx.fill();
    ctx.beginPath();ctx.ellipse(hx-Math.cos(face)*r*.42,hy-Math.sin(face)*r*.42+r*.16,
      r*.2,r*.46,face+Math.PI/2,0,7);ctx.fill();
    ctx.strokeStyle=C('#7fbf6a');ctx.lineWidth=1.6; // circlet
    ctx.beginPath();ctx.arc(hx,hy-r*.04,r*.44,Math.PI*1.05,Math.PI*1.95);ctx.stroke();
    ctx.fillStyle=C('#7fbf6a');ctx.fillRect(hx-1.5,hy-r*.5,3,3);}
  if(o.seraphim){ // giant wings, halo, runic chains, and the two other heads
    const wf=Math.sin(t*(o.flying?13:4))*(o.flying?6:2.5);
    ctx.fillStyle=C('#efe9da');ctx.strokeStyle='#000';ctx.lineWidth=1.5;
    for(const s of[-1,1]){ // feathered wings sweeping back from the shoulders
      const ax=Math.cos(perp)*r*.7*s,ay=Math.sin(perp)*r*.7*s;
      const bx2=ax+Math.cos(perp)*r*1.5*s-Math.cos(face)*r*.9,
            by2=ay+Math.sin(perp)*r*1.5*s-Math.sin(face)*r*.9-(8+wf);
      const cx2=ax+Math.cos(perp)*r*.9*s-Math.cos(face)*r*1.6,
            cy2=ay+Math.sin(perp)*r*.9*s-Math.sin(face)*r*1.6+2;
      ctx.beginPath();ctx.moveTo(ax,ay);
      ctx.quadraticCurveTo(bx2,by2,cx2,cy2);
      ctx.quadraticCurveTo(ax+Math.cos(perp)*r*.7*s-Math.cos(face)*r*.7,ay+Math.sin(perp)*r*.7*s-Math.sin(face)*r*.7+4,ax,ay);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=C('#cfc6ae');ctx.lineWidth=1; // feather lines
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo((ax+cx2)/2,(ay+cy2)/2-3);ctx.stroke();
      ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.fillStyle=C('#efe9da');}
    ctx.strokeStyle=C('#e7b450');ctx.lineWidth=1.6; // runic chains: waist, chest, arms
    ctx.setLineDash([3,2]);
    ctx.beginPath();ctx.arc(0,0,r*.7,0,7);ctx.stroke();
    ctx.beginPath();ctx.arc(0,-r*.2,r*.55,0,7);ctx.stroke();
    ctx.setLineDash([]);
    for(const s of[-1,1]){ // the flanking hound heads (sister-heads of the cerberus)
      const dhx=hx+Math.cos(perp)*r*.62*s,dhy=hy+Math.sin(perp)*r*.62*s+r*.1;
      ctx.fillStyle=C(o.headCol||'#e8e4da');ctx.strokeStyle='#000';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(dhx,dhy,r*.26,0,7);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(dhx+Math.cos(face)*r*.2,dhy+Math.sin(face)*r*.2,r*.13,r*.09,face,0,7);ctx.fill();ctx.stroke(); // muzzle
      ctx.fillStyle=C('#9a8f80'); // ears
      ctx.beginPath();ctx.ellipse(dhx-Math.cos(face)*r*.12,dhy-Math.sin(face)*r*.12-r*.2,r*.08,r*.14,0,0,7);ctx.fill();
      ctx.fillStyle=flash?'#fff':'#ffd870';
      ctx.fillRect(dhx+Math.cos(face)*r*.1-1,dhy+Math.sin(face)*r*.1-1,2,2);}
    const hg=0.55+0.25*Math.sin(t*3); // the halo (dims while the ray is loose)
    if(!o.haloGone){ctx.strokeStyle='rgba(255,222,120,'+hg+')';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(hx,hy-r*.72,r*.5,r*.16,0,0,7);ctx.stroke();
      ctx.strokeStyle='rgba(255,246,220,.35)';ctx.lineWidth=5;
      ctx.beginPath();ctx.ellipse(hx,hy-r*.72,r*.5,r*.16,0,0,7);ctx.stroke();}}
  if(o.samurai){ // kabuto crest + brim
    ctx.strokeStyle=C('#e7b450');ctx.lineWidth=o.armor>=2?3.5:2;
    ctx.beginPath();ctx.arc(hx,hy,r*(o.armor>=2?.6:.52),Math.PI*1.1,Math.PI*1.9);ctx.stroke();
    ctx.strokeStyle=C('#3a4452');ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(hx,hy,r*.46,face+2.3,face+4.0);ctx.stroke();
    if(o.armor>=1){ // sode — lacquered shoulder plates
      ctx.fillStyle=C('#3a2430');ctx.strokeStyle='#000';ctx.lineWidth=1.5;
      for(const sd of[[s1x,s1y],[s2x,s2y]]){
        ctx.save();ctx.translate(sd[0],sd[1]);ctx.rotate(perp);
        ctx.fillRect(-r*.32,-r*.2,r*.64,r*.4);ctx.strokeRect(-r*.32,-r*.2,r*.64,r*.4);
        ctx.strokeStyle=C('#e7b450');ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(-r*.32,0);ctx.lineTo(r*.32,0);ctx.stroke();
        ctx.restore();}}
    if(o.armor>=2){ // odachi tier: mempo war mask + gold horns
      ctx.fillStyle=C('#1a1216');
      ctx.beginPath();ctx.arc(hx+Math.cos(face)*r*.18,hy+Math.sin(face)*r*.18+r*.1,r*.26,0,7);ctx.fill();
      ctx.strokeStyle=C('#e7b450');ctx.lineWidth=2.5;
      for(const hs of[-1,1]){
        ctx.beginPath();ctx.moveTo(hx+Math.cos(perp)*r*.3*hs,hy-r*.3);
        ctx.quadraticCurveTo(hx+Math.cos(perp)*r*.62*hs,hy-r*.75,hx+Math.cos(perp)*r*.5*hs,hy-r*.9);
        ctx.stroke();}}}
  if(o.hood){ctx.strokeStyle=C('#0e0b08');ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(hx,hy,r*.44,face+2.0,face+4.3);ctx.stroke();}
  ctx.restore();
}
function draw(){
  if(!ctx)return;
  ctx.clearRect(0,0,W,H);
  // arcade-black backdrop with rivet stars (Girder Ape style)
  ctx.fillStyle=THEME.backdrop;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=THEME.star;
  for(let i=0;i<44;i++){ctx.fillRect((i*53)%W,(i*97)%H,2,2);}
  // crowd tiers — neon girder rings
  for(let i=4;i>=1;i--){
    ctx.strokeStyle='rgba('+THEME.ringCol+','+(THEME.ringBase-i*THEME.ringStep)+')';ctx.lineWidth=arena.r*.085;
    ctx.beginPath();ctx.arc(arena.x,arena.y,arena.r+arena.r*.11*i+8,0,7);ctx.stroke();
    // flicker crowd dots
    if((S.mode==='fight'||S.mode==='demo')&&THEME.showCrowd){ctx.fillStyle='rgba('+THEME.crowdCol+','+(0.10+0.04*Math.sin(S.time*3+i))+')';
      for(let j=0;j<14;j++){const a=j/14*Math.PI*2+i*.4+S.time*.02;
        ctx.fillRect(arena.x+Math.cos(a)*(arena.r+arena.r*.11*i+8)-2,arena.y+Math.sin(a)*(arena.r+arena.r*.11*i+8)-2,4,4);}}}
  // cinematic camera + shake
  ctx.save();
  ctx.translate(W/2,H/2);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
  if(S.shake>0)ctx.translate(rnd(-S.shake,S.shake),rnd(-S.shake,S.shake));
  // pit floor — dark steel-blue with pink girder rim + rivets
  ctx.fillStyle=THEME.floor;ctx.strokeStyle=THEME.rim;ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(arena.x,arena.y,arena.r,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=THEME.rivet;
  for(let i=0;i<26;i++){const a=i/26*Math.PI*2;
    ctx.fillRect(arena.x+Math.cos(a)*arena.r-1.5,arena.y+Math.sin(a)*arena.r-1.5,3,3);}
  ctx.fillStyle='rgba(0,0,0,0.18)';
  ctx.beginPath();ctx.arc(arena.x,arena.y,arena.r,0,7);ctx.fill();
  // torch glow patches
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.6;
    const tg=ctx.createRadialGradient(arena.x+Math.cos(a)*arena.r,arena.y+Math.sin(a)*arena.r,0,
      arena.x+Math.cos(a)*arena.r,arena.y+Math.sin(a)*arena.r,110);
    const fl=.10+.03*Math.sin(S.time*7+i*2);
    tg.addColorStop(0,'rgba(200,146,58,'+fl+')');tg.addColorStop(1,'rgba(200,146,58,0)');
    ctx.fillStyle=tg;ctx.beginPath();ctx.arc(arena.x+Math.cos(a)*arena.r,arena.y+Math.sin(a)*arena.r,110,0,7);ctx.fill();}
  // blood decals
  ctx.save();ctx.beginPath();ctx.arc(arena.x,arena.y,arena.r,0,7);ctx.clip();
  if(D.decalCanvas)ctx.drawImage(D.decalCanvas,0,0,W,H);ctx.restore();
  if(S.mode!=='fight'&&S.mode!=='demo'){ctx.restore();return;}
  // zones
  for(const z of zones){
    if(z.tele>0){
      const zc=z.type==='fire'?'220,110,40':(z.type==='ice'?'90,210,255':(z.type==='bolt'?'240,224,90':'200,68,58'));
      ctx.strokeStyle='rgba('+zc+',.85)';
      ctx.lineWidth=3;ctx.setLineDash([6,6]);
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba('+zc+',.12)';
      ctx.beginPath();ctx.arc(z.x,z.y,z.r*(1-z.tele/( z.type==='whipcrack'?.6:.75)),0,7);ctx.fill();}
    else if(z.type==='gas'){
      ctx.fillStyle='rgba(127,208,90,'+(0.16+0.06*Math.sin(S.time*5))+')';
      for(let g3=0;g3<3;g3++){const ga2=S.time*.7+g3*2.1;
        ctx.beginPath();ctx.arc(z.x+Math.cos(ga2)*z.r*.25,z.y+Math.sin(ga2)*z.r*.18,z.r*.62,0,7);ctx.fill();}
      if(particles.length<240&&Math.random()<.3)particles.push({x:z.x+rnd(-z.r,z.r)*.6,y:z.y+rnd(-z.r,z.r)*.4,
        vx:rnd(-15,15),vy:-rnd(10,30),t:rnd(.4,.8),col:'#7fd05a',r:rnd(2,4),noG:true});}
    else if(z.type==='fire'){
      ctx.fillStyle='rgba(220,110,40,'+(0.25+0.1*Math.sin(S.time*14))+')';
      ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,7);ctx.fill();
      for(let i=0;i<2;i++)if(particles.length<240)particles.push({x:z.x+rnd(-z.r,z.r)*.7,y:z.y+rnd(-z.r,z.r)*.7,
        vx:0,vy:-rnd(30,70),t:rnd(.2,.5),col:'#e08030',r:rnd(1.5,3)});}}
  // enemies
  for(const e of enemies){
    if(e.dead&&e.deathT>2)continue;
    // walk cycle tracking
    const mvd=Math.hypot(e.x-(e._lx??e.x),e.y-(e._ly??e.y));
    e.walkP=(e.walkP||0)+mvd*.18;e._mv=mvd>0.25;e._lx=e.x;e._ly=e.y;
    // telegraph indicator
    if(e.tele>0&&e.teleMax>0){
      const pr=1-e.tele/e.teleMax;
      ctx.strokeStyle='rgba(200,68,58,.9)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r+10+8*Math.sin(S.time*20),0,7*pr);ctx.stroke();}
    const T=e.type;
    drawFighter(e.x,e.y,e.r,e.face,e.col,{dead:e.dead,deathT:e.deathT,flash:e.flash,
      phase:e.walkP,moving:e._mv,
      shield:T==='door'&&!e.dead&&!(e.brokenT>0),
      twoHand:(T==='door'||T==='brute'||T==='hook')?false:undefined,
      thickWpn:T==='door'||T==='brute'||T==='chain',
      wpnLen:(T==='hound'||T==='beast'||T==='gunner'||T==='thrall'||T==='stitch')?0:
        (T==='necro'?e.r*1.6:e.r*1.2),
      wpnCol:T==='grave'&&e.stance==='parry'?'#e7b450':
        (T==='necro'?'#5a4a3a':(T==='skel'?'#b8b0a0':e.wpn)),
      wpnSwing:e.attacking?Math.sin(S.time*26)*.18-.4:0,
      gun:T==='gunner',robe:T==='necro'||T==='stitch',hood:T==='necro',
      quad:T==='hound',hulk:T==='beast',skull:T==='skel',
      headCol:T==='beast'?'#2a2030':(T==='champ'?'#3a1c1c':null)});
    // champ aura
    if(e.type==='champ'&&e.feeds>0&&!e.dead){
      ctx.strokeStyle='rgba(200,68,58,'+(0.25+0.1*Math.sin(S.time*6))+')';ctx.lineWidth=2+e.feeds;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r+8+e.feeds*2,0,7);ctx.stroke();}
    // grasping vines on rooted enemies
    if(e.vined>0&&!e.dead){
      ctx.strokeStyle='rgba(127,191,106,.85)';ctx.lineWidth=2.5;
      for(let i=0;i<3;i++){const a=S.time*1.5+i*2.1;
        ctx.beginPath();ctx.arc(e.x,e.y+e.r*.3,e.r*(.6+i*.25),a,a+3.6);ctx.stroke();}
      ctx.fillStyle='#7fbf6a';
      for(let i=0;i<4;i++){const a=i*1.57+S.time;
        ctx.fillRect(e.x+Math.cos(a)*e.r-1.5,e.y+e.r*.3+Math.sin(a)*e.r*.5-1.5,3,3);}}
    // resurrection channel: green progress arc on the healer
    if(e.resT>0&&!e.dead){
      ctx.strokeStyle='#7fbf6a';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(e.x,e.y-6,e.r+10,-Math.PI/2,-Math.PI/2+(1-e.resT/2)*Math.PI*2);ctx.stroke();}
    // shield aura (healer / mage): cyan ring
    if((e.healerShield||e.mageShield)&&!e.dead){
      ctx.strokeStyle='rgba(90,210,255,'+(0.45+0.2*Math.sin(S.time*6))+')';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(e.x,e.y-6,e.r+9,0,7);ctx.stroke();}
    // hex (slow + dot): purple sigil ring
    if(e.hexT>0&&!e.dead){
      ctx.strokeStyle='rgba(176,112,240,'+(0.4+0.2*Math.sin(S.time*5))+')';
      ctx.lineWidth=1.6;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.arc(e.x,e.y+2,e.r+6,S.time*2,S.time*2+5.2);ctx.stroke();
      ctx.setLineDash([]);}
    // poison: green drips
    if(e.poisonT>0&&!e.dead&&Math.random()<.15&&particles.length<240)
      particles.push({x:e.x+rnd(-e.r,e.r)*.6,y:e.y-e.r,vx:0,vy:rnd(20,50),t:rnd(.3,.6),col:'#7fd05a',r:2});
    // parry glow
    if(e.type==='grave'&&e.stance==='parry'&&!e.dead){
      ctx.strokeStyle='rgba(231,180,80,.7)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r+7,0,7);ctx.stroke();}
    // gunner aim line
    if(e.type==='gunner'&&e.aiming&&!e.dead){
      const locked=e.aimT<=.28;
      ctx.strokeStyle=locked?'rgba(200,68,58,.9)':'rgba(200,68,58,.3)';
      ctx.lineWidth=locked?2.5:1.5;ctx.setLineDash(locked?[]:[8,8]);
      ctx.beginPath();ctx.moveTo(e.x,e.y);
      ctx.lineTo(e.x+Math.cos(e.aimA)*700,e.y+Math.sin(e.aimA)*700);ctx.stroke();ctx.setLineDash([]);}
    // healer beam
    if(e.type==='stitch'&&e.beam&&e.beam.t>0&&!e.beam.to.dead){
      ctx.strokeStyle='rgba(127,191,106,'+(e.beam.t*1.6)+')';ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.beam.to.x,e.beam.to.y);ctx.stroke();}
    // hp bar
    if(!e.dead&&S.fight<18){ctx.fillStyle='#000';ctx.fillRect(e.x-18,e.y-e.r-16,36,5);
      ctx.fillStyle='#a8352d';ctx.fillRect(e.x-17,e.y-e.r-15,34*Math.max(0,e.hp/e.maxhp),3);}}
  // player
  {
    // flying dismembered limbs (drawn under the living, above the floor)
    for(const L of limbs){
      drawLimbShape(ctx,L);
      if(Math.random()<.35&&particles.length<240) // blood trail off flying limbs
        particles.push({x:L.x,y:L.y,vx:rnd(-20,20),vy:rnd(-20,20),t:rnd(.2,.4),col:'#8a1f1c',r:rnd(1.5,2.5)});}
    // spirit wolves (and humanoid allies riding the same loyal AI)
    for(const w of wolves){
      if(w.humanLook){
        drawFighter(w.x,w.y,w.r,w.face,w.col||'#4a3c30',Object.assign({phase:w.walkP,moving:w._mv},w.humanLook));
        if(w.nameTag){ctx.font='bold 10px "Courier New",monospace';ctx.textAlign='center';
          ctx.fillStyle='#000';ctx.fillText(w.nameTag,w.x+1,w.y-w.r-14+1);
          ctx.fillStyle='#e7b450';ctx.fillText(w.nameTag,w.x,w.y-w.r-14);}
        ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(w.x-14,w.y-w.r-10,28,3);
        ctx.fillStyle='#7fbf6a';ctx.fillRect(w.x-13,w.y-w.r-9,26*Math.max(0,w.hp/w.maxhp),1.5);
        continue;}
      ctx.globalAlpha=Math.min(1,w.life/2)*0.85; // spectral, fade out at end
      drawFighter(w.x,w.y,w.r,w.face,'#5a6a5c',{quad:true,phase:w.walkP,moving:w._mv});
      ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(127,191,106,.4)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(w.x,w.y,w.r+4,0,7);ctx.stroke();}
    // demons
    for(const d of demons){
      if(d.type==='brute'){
        drawFighter(d.x,d.y,d.r,d.face,'#7a2a3a',{hulk:true,flash:d.flash,
          phase:d.walkP,moving:d._mv,headCol:'#3a1018'});
      }else if(d.type==='dragon'){
        const bob=Math.sin(S.time*3)*3;
        ctx.save();ctx.translate(d.x,d.y+bob);
        ctx.fillStyle='rgba(0,0,0,.4)';
        ctx.beginPath();ctx.ellipse(0,16-bob,d.r,d.r*.3,0,0,7);ctx.fill();
        // wings — bone struts flapping
        const fl=Math.sin(S.time*8)*.5;
        ctx.strokeStyle=d.flash>0?'#fff':'#cfc6b4';ctx.lineWidth=2.5;ctx.lineCap='round';
        for(const s of[-1,1]){
          ctx.beginPath();ctx.moveTo(0,-6);
          ctx.lineTo(s*16,-14-fl*8);ctx.lineTo(s*26,-6-fl*12);ctx.stroke();
          ctx.beginPath();ctx.moveTo(s*16,-14-fl*8);ctx.lineTo(s*14,-2);ctx.stroke();}
        // spine segments
        ctx.fillStyle=d.flash>0?'#fff':'#cfc6b4';ctx.strokeStyle='#000';ctx.lineWidth=1.5;
        for(let k=0;k<4;k++){const sx=-Math.cos(d.face)*k*7,sy=-Math.sin(d.face)*k*7;
          ctx.beginPath();ctx.arc(sx,sy,6-k,0,7);ctx.fill();ctx.stroke();}
        // skull
        const hx=Math.cos(d.face)*10,hy=Math.sin(d.face)*10-4;
        ctx.fillRect(hx-5,hy-5,10,9);ctx.strokeRect(hx-5,hy-5,10,9);
        ctx.fillStyle='#7fd05a';
        ctx.fillRect(hx-3,hy-2,2.5,2.5);ctx.fillRect(hx+1,hy-2,2.5,2.5); // green eye sockets
        ctx.restore();
      }else{ // succubus
        drawFighter(d.x,d.y,d.r,d.face,'#502438',{robe:true,flash:d.flash,
          phase:d.walkP,moving:true,headCol:'#caa27a'});
        // little wings (the arch succubus has grown into hers)
        const wsc=d.arch?1.6:1;
        ctx.strokeStyle='rgba(240,106,160,.8)';ctx.lineWidth=d.arch?3:2;
        const wf=Math.sin(S.time*9+d.slot)*3;
        for(const s of[-1,1]){
          ctx.beginPath();ctx.moveTo(d.x+s*6*wsc,d.y-18*wsc);
          ctx.quadraticCurveTo(d.x+s*16*wsc,d.y-(26+wf)*wsc,d.x+s*13*wsc,d.y-14*wsc);ctx.stroke();}
        if(d.arch){ // pulsing fuse ring — faster as she nears the burst
          const urg=Math.max(0,1-d.archT/7);
          ctx.strokeStyle='rgba(208,58,74,'+(0.4+0.45*Math.abs(Math.sin(S.time*(4+urg*14))))+')';
          ctx.lineWidth=3.5+urg*2;
          ctx.beginPath();ctx.arc(d.x,d.y-6,d.r+14+urg*10,0,7);ctx.stroke();
          ctx.strokeStyle='rgba(208,58,74,.18)';ctx.lineWidth=2; // blast radius hint
          ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(d.x,d.y,175,0,7);ctx.stroke();ctx.setLineDash([]);
          if(d.archT<=5){const fz=22+urg*12;
            ctx.font='bold '+fz+'px "Courier New",monospace';ctx.textAlign='center';
            ctx.fillStyle='#000';ctx.fillText(Math.ceil(d.archT),d.x+2,d.y-d.r-30+2);
            ctx.fillStyle='#d03a4a';ctx.fillText(Math.ceil(d.archT),d.x,d.y-d.r-30);}}}
      // demon hp bar + lifespan
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(d.x-14,d.y-d.r-18,28,4);
      ctx.fillStyle='#b070f0';ctx.fillRect(d.x-13,d.y-d.r-17,26*Math.max(0,d.hp/d.maxhp),2);}
    // heal/shield beams
    for(const tr of tracers){
      ctx.strokeStyle=tr.col;ctx.globalAlpha=Math.min(1,tr.t*3);ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(tr.x1,tr.y1);ctx.lineTo(tr.x2,tr.y2);ctx.stroke();ctx.globalAlpha=1;}
    // fireballs & hex bolts & air slashes
    for(const b of fireballs){
      if(b.kind==='slash'){ // flying crescent
        const va=Math.atan2(b.vy,b.vx);
        ctx.save();ctx.translate(b.x,b.y);ctx.rotate(va);
        ctx.strokeStyle='#e7d9a8';ctx.lineWidth=4;ctx.lineCap='round';
        ctx.beginPath();ctx.arc(-6,0,b.r,-1.1,1.1);ctx.stroke();
        ctx.strokeStyle='rgba(231,180,80,.5)';ctx.lineWidth=7;
        ctx.beginPath();ctx.arc(-10,0,b.r,-0.9,0.9);ctx.stroke();
        ctx.restore();
        continue;}
      const col=b.kind==='hex'?'#b070f0':'#f0883d';
      const g2=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*2.6);
      g2.addColorStop(0,col);g2.addColorStop(1,'transparent');
      ctx.fillStyle=g2;ctx.beginPath();ctx.arc(b.x,b.y,b.r*2.6,0,7);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r*.5,0,7);ctx.fill();}
    // halo rays — lances of dawn (drawn under the fighters)
    for(const ry of rays){
      const pr=ry.t/.45,ca2=Math.cos(ry.a),sa2=Math.sin(ry.a);
      const ex2=ry.x+ca2*ry.len,ey2=ry.y+sa2*ry.len;
      ctx.save();ctx.globalAlpha=pr;
      ctx.strokeStyle=ry.judge?'#fff6dc':'#ffe9a8';ctx.lineWidth=ry.w*pr;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(ry.x,ry.y);ctx.lineTo(ex2,ey2);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(2,ry.w*.3*pr);
      ctx.beginPath();ctx.moveTo(ry.x,ry.y);ctx.lineTo(ex2,ey2);ctx.stroke();
      ctx.restore();}
    const pmv=Math.hypot(P.x-(P._lx??P.x),P.y-(P._ly??P.y));
    P.walkP=(P.walkP||0)+pmv*.18;P._mv=pmv>0.25;P._lx=P.x;P._ly=P.y;
    if(P.char==='seraph'){
      const lift=P.ascendT>0?Math.sin(Math.min(Math.PI,(1.1-P.ascendT)/1.1*Math.PI))*26:0;
      if(P.wardT>0&&P.ascendT<=0){ // grace lingers after the landing
        ctx.strokeStyle='rgba(255,233,168,'+(0.4+0.2*Math.sin(S.time*9))+')';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(P.x,P.y-8,P.r+15,0,7);ctx.stroke();}
      if(lift>2){ctx.save();ctx.globalAlpha=.4; // shadow stays on the sand
        ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(P.x,P.y+P.r*.6,P.r*.9,P.r*.34,0,0,7);ctx.fill();ctx.restore();}
      drawFighter(P.x,P.y-lift,P.r,P.face,'#cfd6e4',{seraphim:true,robe:true,flash:P.flash,
        dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv,
        flying:P.ascendT>0,haloGone:P.heavyCD>3.8,
        wpnLen:42,wpnCol:'#f0ead0',twoHand:false,headCol:'#e8e4da',
        wpnSwing:P.heavyWind>0?-1.0:(P.atkRecover>0?[0.7,-0.7,-1.5][P.atkPose||0]:0)});
    }else if(P.char==='warlock'&&P.devilT>0){
      // ARCH DEVIL: hulking horned thing where the dark elf stood
      const fl2=Math.sin(S.time*7)*.5;
      ctx.strokeStyle='rgba(208,58,74,.9)';ctx.lineWidth=3;ctx.lineCap='round';
      for(const sw2 of[-1,1]){ // ragged wings
        ctx.beginPath();ctx.moveTo(P.x,P.y-18);
        ctx.lineTo(P.x+sw2*26,P.y-34-fl2*6);ctx.lineTo(P.x+sw2*40,P.y-20-fl2*10);ctx.stroke();
        ctx.beginPath();ctx.moveTo(P.x+sw2*26,P.y-34-fl2*6);ctx.lineTo(P.x+sw2*24,P.y-10);ctx.stroke();}
      drawFighter(P.x,P.y,P.r,P.face,'#5a1a24',{hulk:true,flash:P.flash,
        dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv,headCol:'#2a0c12'});
      { // horns
        const hx3=P.x+Math.cos(P.face)*P.r*.75,hy3=P.y+Math.sin(P.face)*P.r*.75;
        ctx.strokeStyle='#e8d8c0';ctx.lineWidth=3;
        const pp=P.face+Math.PI/2;
        for(const hs of[-1,1]){
          ctx.beginPath();ctx.moveTo(hx3+Math.cos(pp)*7*hs,hy3-6);
          ctx.quadraticCurveTo(hx3+Math.cos(pp)*15*hs,hy3-18,hx3+Math.cos(pp)*11*hs,hy3-24);ctx.stroke();}}
      // form timer
      {const bw3=48,bx3=P.x-bw3/2,by3=P.y-P.r-30;
       ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(bx3,by3,bw3,5);
       ctx.fillStyle='#d03a4a';ctx.fillRect(bx3+1,by3+1,(bw3-2)*Math.max(0,P.devilT/10),3);}
      if(P.wardT>0){
        ctx.strokeStyle='rgba(90,210,255,'+(0.5+0.25*Math.sin(S.time*9))+')';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.arc(P.x,P.y-8,P.r+16,0,7);ctx.stroke();}
    }else if(P.char==='warlock'){
      if(P.wardT>0){ // shimmering ward bubble
        ctx.strokeStyle='rgba(90,210,255,'+(0.5+0.25*Math.sin(S.time*9))+')';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.arc(P.x,P.y-8,P.r+16,0,7);ctx.stroke();
        ctx.fillStyle='rgba(90,210,255,.07)';
        ctx.beginPath();ctx.arc(P.x,P.y-8,P.r+16,0,7);ctx.fill();}
      drawFighter(P.x,P.y,P.r,P.face,'#241a30',{warlock:true,robe:true,flash:P.flash,
        dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv,
        wpnLen:30,wpnCol:'#3a3046',staffTip:true,tipCol:'#b070f0',twoHand:false,
        headCol:'#9a9ab0',
        wpnSwing:P.channel?-1.0:(P.atkRecover>0?0.6:0)});
      // channel bar with summon thresholds
      if(P.channel){
        const t=P.channel.t,bw=64;
        const bx=P.x-bw/2,by=P.y-46;
        ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(bx,by,bw,7);
        ctx.fillStyle='#b070f0';ctx.fillRect(bx+1,by+1,(bw-2)*Math.min(1,t/6),5);
        ctx.fillStyle='#fff'; // threshold ticks at 3s / 4s / 6s
        for(const th of[3,4])ctx.fillRect(bx+(bw-2)*(th/6),by-1,2,9);
        const tier=t>=6?'SUCCUBI':(t>=4?'BONE DRAGON':(t>=3?'CLAW FIEND':''));
        if(tier){ctx.font='bold 11px "Courier New",monospace';ctx.textAlign='center';
          ctx.fillStyle='#000';ctx.fillText(tier,P.x+1,by-5+1);
          ctx.fillStyle=t>=6?'#f06aa0':(t>=4?'#7fd05a':'#b070f0');
          ctx.fillText(tier,P.x,by-5);}
        // gathering motes
        if(particles.length<240&&Math.random()<.5){
          const a=rnd(0,Math.PI*2),rr=rnd(20,44);
          particles.push({x:P.x+Math.cos(a)*rr,y:P.y-14+Math.sin(a)*rr*.5,
            vx:-Math.cos(a)*60,vy:-Math.sin(a)*30,t:.4,col:'#b070f0',r:2,noG:true});}}
    }else if(P.char==='druid'){
      if(P.form!=='human'){ // beast-form timer
        const bw2=44,bx2=P.x-bw2/2,by2=P.y-P.r-26;
        ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(bx2,by2,bw2,5);
        ctx.fillStyle='#7fbf6a';ctx.fillRect(bx2+1,by2+1,(bw2-2)*Math.max(0,P.formT/6),3);}
      if(P.form==='bear'){
        drawFighter(P.x,P.y,P.r,P.face,'#6a4a2c',{hulk:true,bear:true,flash:P.flash,
          dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv,headCol:'#4a3420'});
      }else if(P.form==='wolf'){
        drawFighter(P.x,P.y,P.r*1.2,P.face,'#4a5a4c',{quad:true,flash:P.flash,
          dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv});
        ctx.strokeStyle='rgba(127,191,106,.5)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(P.x,P.y,P.r+7,0,7);ctx.stroke();
      }else{
        if(P.glaive)drawGlaive(P.glaive);
        drawFighter(P.x,P.y,P.r,P.face,'#2c4430',{druid:true,flash:P.flash,
          dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv,
          roll:P.rollT>0,rollSpin:P.rollT>0?(1-P.rollT/.32)*Math.PI*2:0,
          wpnLen:P.glaive?0:26,wpnCol:'#d8e4d0',twin:!P.glaive,
          wpnSwing:P.atkRecover>0?0.8:0});}
    }else{
    {const bt=roninTier();
    drawFighter(P.x,P.y,P.r,P.face,'#2c3440',{samurai:true,armor:bt,flash:P.flash,
      dead:P.dead,deathT:P.dead?1:0,phase:P.walkP,moving:P._mv,
      roll:P.rollT>0,rollSpin:P.rollT>0?(1-P.rollT/.32)*Math.PI*2:0,
      wpnLen:bt===2?62:(bt===1?46:Math.min(40,26+P.kills*1.5)),
      thickWpn:bt===2,
      wpnCol:bt===2?'#f0e2b0':(bt===1?'#e7d9a8':(P.kills>=4?'#e7d9a8':'#cfd3d8')),
      wpnSwing:P.heavyWind>0?-1.6+Math.sin(S.time*22)*.1:
        (P.atkRecover>0?[0.95,-0.95,-1.5][P.atkPose||0]:(P.parryT>0?-0.7:0))});
    }
    }
    // parry guard visual
    if(P.parryT>0){ctx.strokeStyle='rgba(231,180,80,.85)';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(P.x,P.y,P.r+13,P.face-1.1,P.face+1.1);ctx.stroke();}
    // heavy windup indicator
    if(P.heavyWind>0){ctx.strokeStyle='rgba(231,180,80,.8)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(P.x,P.y,P.r+12,-Math.PI/2,-Math.PI/2+7*(1-P.heavyWind/.55));ctx.stroke();}
    // katana glow tier
    if(P.kills>=2&&!P.dead){ctx.strokeStyle='rgba(231,180,80,'+Math.min(.5,P.kills*.06)+')';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(P.x,P.y,P.r+5,0,7);ctx.stroke();}}
  // swings
  for(const s of swings){
    const pr=s.t/(s.heavy?.18:.14);
    ctx.strokeStyle=s.col;ctx.globalAlpha=pr;ctx.lineWidth=s.heavy?6:4;
    ctx.beginPath();
    if(s.ring)ctx.arc(s.x,s.y,s.range*(1-pr*.3),0,7);
    else if(s.style===2){ // men: overhead line cut through
      ctx.moveTo(s.x-Math.cos(s.a)*s.range*.2,s.y-Math.sin(s.a)*s.range*.2);
      ctx.lineTo(s.x+Math.cos(s.a)*s.range,s.y+Math.sin(s.a)*s.range);}
    else if(s.style===1) // kesa left: reversed sweep
      ctx.arc(s.x,s.y,s.range*.8,s.a+s.arc/2,s.a-s.arc/2,true);
    else ctx.arc(s.x,s.y,s.range*.8,s.a-s.arc/2,s.a+s.arc/2);
    ctx.stroke();ctx.globalAlpha=1;}
  // bullets
  for(const b of bullets){
    ctx.strokeStyle='rgba(231,180,80,.4)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(b.x-b.vx*.03,b.y-b.vy*.03);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.fillStyle='#3a3a3a';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();
    ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();}
  // particles
  for(const p of particles){ctx.fillStyle=p.col;ctx.globalAlpha=Math.min(1,p.t*3);
    ctx.beginPath();
    if(p.chunk){ctx.ellipse(p.x,p.y,p.r,p.r*.65,p.t*9,0,7);ctx.fill();
      ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();}
    else{ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();}}
  ctx.globalAlpha=1;
  // popups — arcade pixel-font style
  for(const p of popups){ctx.font='bold '+p.sz+'px "Courier New",monospace';ctx.textAlign='center';
    ctx.globalAlpha=Math.min(1,p.t*2);
    ctx.fillStyle='#000';ctx.fillText(p.txt,p.x+2,p.y+2);
    ctx.fillStyle=p.col;ctx.fillText(p.txt,p.x,p.y);}
  ctx.globalAlpha=1;
  ctx.restore();
  // cinematic letterbox (slides in during kill cams)
  const lbT=(cam.z>1.12||S.fatal)?1:0;
  letterbox+=(lbT-letterbox)*.13;
  if(letterbox>.01){ctx.fillStyle='rgba(0,0,2,.93)';
    const bh=H*.085*letterbox;
    ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);}
  // subtle arcade scanlines
  ctx.fillStyle='rgba(0,0,0,.06)';
  for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);
  // vignette
  const v=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
}
/* ============ HOST API ============ */
const api={
  frame:tick,resize,keys,mouse,stick,
  doSlash,doParry,doHeavy,doRoll,heavyRelease,
  startIntro,endIntro,startFight,fullReset,toBoard,
  pointerAttack:(x,y)=>{if(S.mode==='fight'){mouse.x=x;mouse.y=y;P.face=ang(P,mouse);doSlash();}},
  pointerMove:(x,y)=>{mouse.x=x;mouse.y=y;},
  clearDecals:()=>{},
  get S(){return S;},get P(){return P;},get enemies(){return enemies;},
  get demons(){return demons;},get wolves(){return wolves;},
  get nickname(){return nickname;},get FIGHTS(){return FIGHTS;},
  maxHP,lvl,diceN,stat,
  drawFighter, // render-only reuse: city NPCs/player share the arena art style
  startEncounter,setMods,usePotion,mkEnemy,addAlly,
  setPlayerSnapshot:(snap)=>{P.char=snap.char;P.kills=snap.kills;P.level=snap.level;
    P.bladeTier=snap.bladeTier||0;Object.assign(P.base,snap.base);nickname=snap.nickname;
    P.form='human';P.r=[16,19,23][P.bladeTier||0]||16;updateLabels();},
};
return api;
}
if(typeof module!=='undefined'&&module.exports)module.exports={createPitCombat};
else if(typeof window!=='undefined')window.createPitCombat=createPitCombat;
