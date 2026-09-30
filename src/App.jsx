

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Pill, Home, Car, ShowerHead, Lightbulb, RotateCcw, Radiation,  Sparkles, FastForward } from "lucide-react";
const BASE = import.meta.env.BASE_URL;

function Button({
  children,
  className = "",
  variant,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

const ENEMIES=[
 {id:"xe133",round:1,name:"キセノン133",symbol:"Xe-133",epithet:"THE SUBMERSION CLOUD",color:"from-cyan-500 to-blue-700",decay:7,contam:0,hints:["キセノン133は希ガスといって、汚染が身体や地表面に付着することはないよ。外部被ばくだけ考えればいいね。","放射線には遮へいが有効よ。行動を見直してみよう。","キセノン133は時間とともに比較的早く減衰する。それまで被ばくを抑えて耐えよう。"]},
 {id:"cs137",round:2,name:"セシウム137",symbol:"Cs-137",epithet:"THE PERSISTENT AEROSOL",color:"from-amber-500 to-orange-700",decay:100,contam:100,hints:["セシウム137は半減期が長い。待つだけでは戦況はほとんど変わらないよ。","汚染が起こるまでには猶予がある。予兆があったら適切な防護措置で付着を防ごう。","セシウム137攻略の鍵は除染よ。ただし汚染の予兆があれば防護服や屋内退避も忘れずにね。"]},
 {id:"i131",round:3,name:"ヨウ素131",symbol:"I-131",epithet:"THE THYROID SEEKER",color:"from-violet-500 to-fuchsia-800",decay:5,contam:80,hints:["ヨウ素131は減衰は早いけど、その分放射線をたくさん出すよ。ウカウカしているとあっという間にやられてしまう。","放射性ヨウ素による甲状腺内部被ばくには有効な防護措置があるよ。","安定ヨウ素剤と屋内退避を組み合わせて、減衰まで耐えよう。"]}
];
const ACTIONS=[
 {id:"suit",label:"防護服装備",icon:Shield,tone:"bg-sky-600"},{id:"iodine",label:"安定ヨウ素剤",icon:Pill,tone:"bg-violet-600"},{id:"shelter",label:"屋内退避",icon:Home,tone:"bg-emerald-600"},{id:"evacuate",label:"避難",icon:Car,tone:"bg-orange-600"},{id:"decon",label:"除染",icon:ShowerHead,tone:"bg-cyan-700"},{id:"hint",label:"ハカセの助言",icon:Lightbulb,tone:"bg-amber-400 text-slate-950"}
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function Meter({label,value,max=100,color="bg-emerald-400"}){return <div><div className="mb-1 flex justify-between text-xs font-bold"><span>{label}</span><span>{value} / {max}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-950"><motion.div className={`h-full ${color}`} animate={{width:`${clamp(value/max*100,0,100)}%`}} transition={{duration:.6}}/></div></div>}


const Copyright=()=> <div className="fixed right-3 top-2 z-[200] pointer-events-none text-[9px] font-medium tracking-wide text-white/60 sm:text-[10px]">© NUCLEAR SAFETY TECHNOLOGY CENTER</div>;

const HAKASE_IMAGES = {
normal: `${BASE}hakase-normal.png`,
good: `${BASE}hakase-good.png`,
warn: `${BASE}hakase-warn.png`,
hint: `${BASE}hakase-hint.png`
};
 
const AUDIO = {
bgm: [
`${BASE}assets/audio/bgm-xe133.wav`,
`${BASE}assets/audio/bgm-cs137.wav`,
`${BASE}assets/audio/bgm-i131.wav`
],
suit: `${BASE}assets/audio/se-suit.wav`,
iodine: `${BASE}assets/audio/se-iodine.wav`,
shelter: `${BASE}assets/audio/se-shelter.wav`,
evacuate: `${BASE}assets/audio/se-evacuate.wav`,
decon: `${BASE}assets/audio/se-decon.wav`,
hint: `${BASE}assets/audio/se-hint.wav`
};

function HakaseIcon({
mood = "normal",
className = "h-14 w-14 sm:h-16 sm:w-16"
}) {
const imageSrc =
HAKASE_IMAGES[mood] ?? HAKASE_IMAGES.normal;
 
return React.createElement("img", {
src: imageSrc,
alt: "ハカセ",
draggable: false,
className: `shrink-0 rounded-xl bg-slate-800 object-cover ${className}`,
style: {
objectFit: "cover",
objectPosition: "center",
imageRendering: "auto"
}
});
}

export default function App(){
 const [phase,setPhase]=useState("title"),[round,setRound]=useState(0),[hp,setHp]=useState(100),[turn,setTurn]=useState(1);
 const [tutorialStep,setTutorialStep]=useState(0),[encounter,setEncounter]=useState(null),[battleFade,setBattleFade]=useState(0);
 const [surface,setSurface]=useState(false),[intake,setIntake]=useState(false),[internal,setInternal]=useState(false),[iodineTurns,setIodineTurns]=useState(0),[contam,setContam]=useState(0),[pending,setPending]=useState([]),[order,setOrder]=useState(false),[shelterCount,setShelterCount]=useState(0),[logs,setLogs]=useState([]),[busy,setBusy]=useState(false),[result,setResult]=useState(null);
 const [hakase,setHakase]=useState({text:"困ったら、わたしの助言を聞いてね。",mood:"normal"}),[hints,setHints]=useState([0,0,0]),[hintCount,setHintCount]=useState(0);

const [dose,setDose]=useState({external:0,internal:0}),
[history,setHistory]=useState([]),
[soundOn,setSoundOn]=useState(true),
skipRef=useRef(null),
bgmRef=useRef(null);

 const playSound=id=>{if(!soundOn||!AUDIO[id])return;const a=new Audio(AUDIO[id]);a.volume=.55;a.play().catch(()=>{})};

const stopBgm = () => {
  const audio = bgmRef.current;
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  bgmRef.current = null;
};

const prepareBgm = (index) => {
  stopBgm();
  const audio = new Audio(AUDIO.bgm[index]);
  audio.loop = true;
  audio.volume = soundOn ? 0.55 : 0;
  audio.preload = "auto";
  bgmRef.current = audio;
  const promise = audio.play();
  if (promise) promise.catch(error => console.error("BGM start failed:", error));
};

useEffect(() => {
  const audio = bgmRef.current;
  if (!audio) return;
  audio.volume = soundOn ? 0.55 : 0;
  if (phase !== "encounter" && phase !== "battle") stopBgm();
}, [phase, soundOn]);

 const enemy=ENEMIES[round],decayLeft=Math.max(0,enemy.decay-turn+1),iodineActive=iodineTurns>0;
 const gaugeValue=enemy.id==="cs137"?Math.min(contam,100):decayLeft;
 const gaugeMax=enemy.id==="cs137"?100:enemy.decay;
 const pause=()=>new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);skipRef.current=null;resolve()};const timer=setTimeout(finish,5000);skipRef.current=finish});
 const add=(text,kind="normal")=>setLogs(v=>[{text,kind,id:crypto.randomUUID()},...v].slice(0,14));
 const say=(text,mood="normal")=>setHakase({text,mood});
 const playerStatuses=useMemo(()=>[iodineTurns>0&&`甲状腺ブロック 残り${iodineTurns}ターン`,surface&&"体表面汚染",intake&&"体内汚染",internal&&"内部被ばく",order&&"📢 避難指示発令中"].filter(Boolean),[iodineTurns,surface,intake,internal,order]);
 const reset=(i=0,keep=false)=>{setRound(i);if(!keep)setHp(100);setTurn(1);setSurface(false);setIntake(false);setInternal(false);setIodineTurns(0);setContam(ENEMIES[i].contam);setPending([]);setOrder(false);setShelterCount(0);setLogs([]);setBusy(false);setResult(null)};
 const enterBattle=(index,keep,message)=>{reset(index,keep);setBattleFade(0);setPhase("battle");say(message);requestAnimationFrame(()=>requestAnimationFrame(()=>setBattleFade(1)))};
 const showEncounter=(index,after)=>{setEncounter(index);setPhase("encounter");window.setTimeout(()=>{setEncounter(null);after()},2200)};
 const beginRound1=()=>{
  prepareBgm(0);
  setDose({external:0,internal:0});setHistory([]);setHints([0,0,0]);setHintCount(0);
  showEncounter(0,()=>enterBattle(0,false,"コイツはキセノン133よ。比較的半減期は短いけど、γ線を出すから気をつけよう。"));
};

const start = () => { setTutorialStep(0); setPhase("tutorialAsk"); };

 const startTutorial=()=>{setTutorialStep(-1);setPhase("tutorial")};
 const damage=async(n,type)=>{setHp(v=>clamp(v-n,0,100));setDose(v=>({...v,[type]:v[type]+n}));await pause()};
 const hint=()=>{playSound("hint");const n=hints[round];say(enemy.hints[Math.min(n,2)],"hint");setHints(v=>v.map((x,i)=>i===round?Math.min(2,x+1):x));setHintCount(v=>v+1)};
 const attackName=t=>t==="radiation"?"ガンマバースト":t==="surface"?"フォールアウト":"インハレーション";

 const resolve=async(type,shelter,suitActive,iodineEffect)=>{
  add(`${enemy.symbol}の「${attackName(type)}」！`,"enemy");await pause();
  if(type==="radiation"){
   const base=enemy.id==="xe133"?9:enemy.id==="cs137"?17:13,dmg=shelter?Math.ceil(base*.45):base;
   if(shelter){add(`MATCH! 屋内退避で外部被ばくを低減！ ${base} → ${dmg}`,"match");say("いいよ！ 屋内退避はこのターンだけ有効よ。遮へいによって外部被ばくを低減できたよ。","good")}else{add(`外部被ばく！ ${dmg} DAMAGE`,"damage");say(suitActive?"防護服はこのターンの汚染には備えられるけど、放射線そのものは防げないよ。":"有効な行動を考えよう。わからないことは何でもわたしに聞いてね。","warn")}
   await pause();await damage(dmg,"external");return dmg;
  }
  if(type==="surface"){
   const blocked=shelter||suitActive;
   if(blocked){add(`MATCH! ${shelter?"屋内退避":"防護服"}で体表面汚染を防いだ！`,"match");say(`いいよ！ ${shelter?"屋内退避":"防護服"}の効果はこの1ターンだけよ。`,"good")}else{setSurface(true);add("体表面汚染！ CONTAMINATED!","damage");say("体表面が汚染されたよ。早めの除染を考えよう。","warn")}
   await pause();return 0;
  }
  if(shelter){add("MATCH! 屋内退避で体内への取り込みを防いだ！","match");say("いいよ！ 屋内退避の効果はこの1ターンだけよ。次はどうする？","good")}else{setIntake(true);add("体内汚染！ INTAKE!","damage");say(iodineEffect&&enemy.id==="i131"?"取り込んだけど、安定ヨウ素剤が効いている。甲状腺への沈着は低減されるよ。":"次のターンに内部被ばくへ移行する。注意よ。","warn")}
  await pause();return 0;
 };

 const act=async id=>{
  if(busy||result)return;if(id==="hint"){hint();return}playSound(id);setBusy(true);
  const label=ACTIONS.find(a=>a.id===id).label;add(`PLAYER ▶ ${label}`,"player");say(`${label}を選んだね。結果を確認しよう。`);await pause();
  const suitActive=id==="suit",shelter=id==="shelter";let iodineEffect=iodineActive||id==="iodine",clear=null,pendingDamage=0;
  if(intake){setIntake(false);setInternal(true);let d=enemy.id==="i131"?16:9;if(enemy.id==="i131"&&iodineEffect)d=3;add(`体内汚染 → 内部被ばく！ ${d} DAMAGE`,"damage");await pause();await damage(d,"internal");pendingDamage+=d}
  else if(internal){let d=enemy.id==="i131"?(iodineEffect?2:10):6;add(`内部被ばくの継続ダメージ！ ${d} DAMAGE`,"damage");await pause();await damage(d,"internal");pendingDamage+=d}
  if(surface&&Math.random()<.25){setIntake(true);add("体表面汚染から体内侵入が発生！","damage");await pause()}
  if(id==="suit"){add("防護服を装備！ 1 TURN GUARD!","player");say("防護服はこのターンだけ有効よ。体表面への放射性物質の付着を防ぐけど、放射線そのものは防げないよ。","normal")}
  if(id==="iodine"){setIodineTurns(3);iodineEffect=true;add(enemy.id==="i131"?"THYROID GUARD! 3 TURNS":"IODINE GUARD! 3 TURNS",enemy.id==="i131"?"match":"normal");say(enemy.id==="i131"?"安定ヨウ素剤の効果は3ターンよ。放射性ヨウ素による甲状腺内部被ばくを低減するよ。":"安定ヨウ素剤の効果は3ターンよ。ただし、放射性ヨウ素の内部被ばく以外には効果がないよ。",enemy.id==="i131"?"good":"warn")}
  if(id==="shelter"){setShelterCount(v=>v+1);add("屋内へ退避！ 1 TURN SHELTER!","player");say("屋内退避はこのターンだけ有効よ。外部被ばくと放射性物質の取り込みを低減するよ。","normal")}
  if(id==="decon"){
   if(enemy.id==="xe133"){add("NO EFFECT! 除染は効かない！","damage");say("キセノン133は希ガスよ。除染では攻略できないよ。","warn")}
   else{if(surface){setSurface(false);add("体表面汚染を除去！","match")};const power=enemy.id==="cs137"?38:12,next=Math.max(0,contam-power);setContam(next);add(`放射能ゲージ ${contam} → ${next} (-${power})`,"match");if(enemy.id==="cs137"&&next===0)clear="DECONTAMINATION"}
  }
  if(id==="evacuate"){
   const success=order||Math.random()<(enemy.id==="i131"?.12:enemy.id==="cs137"?.25:.35);
   if(success){add(order?"避難指示に従い避難成功！":"EVACUATION SUCCESS!","match");say("避難に成功したよ！","good");clear="EVACUATION"}else{add("EVACUATION FAILED!","damage");say("避難失敗よ！無計画な避難はかえって被ばくしてしまう。タイミングを見極めよう！","warn")}
  }
  await pause();
  if(clear){setHistory(v=>[...v,clear]);setResult({type:"clear",title:`${clear} CLEAR!`,text:`${enemy.name}との戦いに勝利した！`});setBusy(false);return}
  const executing=[...pending];setPending([]);let attacks=[];
  if(enemy.id==="xe133")attacks=["radiation"];
  else{
   if(executing.length)attacks.push(...executing);
   const slots=enemy.id==="i131"?2:1;
   while(attacks.length<slots){const roll=Math.random();if(roll<.36)attacks.push("radiation");else{const charge=roll<.68?"surface":"intake";setPending(v=>[...v,charge]);add(`${enemy.symbol}が「${attackName(charge)}」を準備している！`,"charge");say(charge==="surface"?"次のターンに汚染を起こしそうよ。防護服か屋内退避よ！":"次のターンに汚染を起こしそうよ。屋内退避で備えよう！","warn");break}}
  }
  for(const a of attacks)pendingDamage+=await resolve(a,shelter,suitActive,iodineEffect);
  const next=turn+1;setTurn(next);
  if(enemy.id!=="cs137")add(`時間経過 ▶ 放射能ゲージ ${decayLeft} → ${Math.max(0,decayLeft-1)}`,"decay");
  else add(`時間経過 ▶ 放射能ゲージ ${contam}（長半減期のため自然減衰なし）`,"decay");
  if(iodineTurns>0&&id!=="iodine")setIodineTurns(v=>Math.max(0,v-1));
  await pause();
  const effectiveShelterCount=shelterCount+(id==="shelter"?1:0);const orderChance=Math.min(.12+effectiveShelterCount*.10,.60);const newOrder=Math.random()<orderChance;setOrder(newOrder);if(newOrder){add("📢 避難指示が発令された！","order");say("避難指示よ！ 今なら避難は確実に成功するよ。","good");await pause()}
  if(hp-pendingDamage<=0)setResult({type:"gameover",title:"GAME OVER",text:"防護力が尽きた……。状況によって防護措置を見直そう。"});
  else if(enemy.id!=="cs137"&&next>enemy.decay){setHistory(v=>[...v,"DECAY"]);setResult({type:"clear",title:"DECAY CLEAR!",text:`${enemy.name}は減衰し、力を失った！`})}
  setBusy(false);
 };
 const nextRound=()=>{
  if(round<2){
    const n=round+1;
    const msg=n===1?"次はセシウム137よ。半減期が長く、γ線を出すやっかいな相手よ。":"最後はヨウ素131よ。放射能の減衰は早いけど、強烈な放射線に注意して！";
    prepareBgm(n);
    showEncounter(n,()=>enterBattle(n,true,msg));
  }else setPhase("final");
};

const totalDose = dose.external + dose.internal;
 
const finalFeedback = (() => {
// プレイ結果が良好
if (hp >= 70 && totalDose <= 45) {
return {
level: "excellent",
title: "とても良い判断だったよ！",
mood: "good",
color: "border-emerald-400/40 bg-emerald-500/10",
titleColor: "text-emerald-300",
text:
"放射性物質の特徴や状況を確認しながら、適切な防護措置を選べていたよ。実際の原子力災害でも、状況と行政機関からの情報を確認して、落ち着いて行動しよう！"
};
}
 
// プレイ結果が標準的
if (hp >= 35) {
const mainAdvice =
dose.internal > dose.external
? "今回は内部被ばくが比較的大きかったよ。放射性物質を体内に取り込まないよう、予兆が出たときの屋内退避を意識しよう。放射性ヨウ素には安定ヨウ素剤も有効だけど、実際の効果は24時間程度とされているから、服用は行政機関の指示に従うことが大切よ。"
: "今回は外部被ばくが比較的大きかったよ。放射線そのものに対しては、防護服ではなく、建物による遮へいや放射性物質から距離を取ることが重要なの。屋内退避をうまく使おう！";
 
return {
level: "good",
title: "基本はできているよ！",
mood: "normal",
color: "border-cyan-400/40 bg-cyan-500/10",
titleColor: "text-cyan-300",
text: mainAdvice
};
}
 
// プレイ結果に改善余地あり
return {
level: "review",
title: "防護措置をもう一度確認しよう",
mood: "warn",
color: "border-orange-400/40 bg-orange-500/10",
titleColor: "text-orange-300",
text:
"相手の特徴と予兆に合わない行動が多かったかもしれないね。放射線には被ばくを防ぐ「屋内退避」、体表面汚染には「防護服」、放射性物質の取り込みには「屋内退避」が有効よ。「安定ヨウ素剤」は万能じゃなく、放射性ヨウ素による甲状腺内部被ばくを低減するためのものだって覚えておいてね。"
};
})();

 if(phase==="encounter"&&encounter!==null){const foe=ENEMIES[encounter];return <main className="fixed inset-0 z-[100] overflow-hidden bg-slate-950 text-white"><motion.div initial={{opacity:0}} animate={{opacity:[0,1,1,0]}} transition={{duration:2.2,times:[0,.12,.82,1]}} className={`absolute inset-0 bg-gradient-to-br ${foe.color}`}/><motion.div initial={{x:"-110%"}} animate={{x:["-110%","0%","0%","110%"]}} transition={{duration:2.2,times:[0,.22,.78,1],ease:"easeInOut"}} className="absolute inset-y-0 left-0 w-full -skew-x-6 bg-slate-950/80"/><div className="relative z-10 flex h-[100dvh] items-center justify-center p-5"><motion.div initial={{scale:1.8,opacity:0,rotate:-8}} animate={{scale:1,opacity:1,rotate:0}} transition={{duration:.55}} className="text-center"><motion.div animate={{rotate:[0,12,-12,0],scale:[1,1.12,1]}} transition={{duration:.55,delay:.45}} className={`mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br ${foe.color} ring-4 ring-white/25 sm:h-36 sm:w-36`}><Radiation className="h-16 w-16 sm:h-20 sm:w-20"/></motion.div><p className="mt-6 text-sm font-black tracking-[.3em] text-rose-300">WARNING · ENCOUNTER</p><motion.h1 initial={{x:-80,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:.38,type:"spring"}} className="mt-2 text-4xl font-black sm:text-6xl">{foe.symbol}</motion.h1><motion.p initial={{x:80,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:.5,type:"spring"}} className="mt-1 text-xl font-black text-slate-200 sm:text-3xl">{foe.name}</motion.p><motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:.6,duration:.35}} className="mx-auto mt-5 h-1 w-56 bg-rose-400"/><p className="mt-3 text-sm font-bold tracking-[.2em] text-slate-200">{foe.epithet}</p><motion.p initial={{opacity:0}} animate={{opacity:[0,1,1,0]}} transition={{delay:1,duration:1}} className="mt-6 text-2xl font-black text-amber-300">BATTLE START!</motion.p></motion.div></div></main>}
 if(phase==="tutorialAsk")return <main className="fixed inset-0 z-50 h-[100dvh] overflow-hidden bg-slate-950 p-5 text-white"><div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center text-center">
<HakaseIcon
mood="normal"
className="h-24 w-24"
/>
<p className="mt-6 text-sm font-black tracking-[.3em] text-amber-300">HAKASE TUTORIAL</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">チュートリアルを見ますか？</h1><p className="mt-4 text-slate-300">ハカセが6つの行動とゲームの基本を簡単に説明します。</p><div className="mt-8 flex gap-4"><Button onClick={startTutorial} className="h-14 min-w-32 bg-cyan-500 text-lg font-black text-slate-950">YES</Button><Button onClick={beginRound1} className="h-14 min-w-32 bg-slate-700 text-lg font-black">NO</Button></div></div></main>;
 if(phase==="tutorial"){const items=[{icon:Shield,title:"防護服装備",text:"体表面への放射性物質の付着を防ぐことができる。ただし放射線そのものは防げない。効果は選択した1ターンよ。",color:"bg-sky-600"},{icon:Pill,title:"安定ヨウ素剤",text:"放射性ヨウ素による甲状腺内部被ばくを低減する。それ以外の被ばくには効かないよ。ゲーム上の効果は3ターンよ。",color:"bg-violet-600"},{icon:Home,title:"屋内退避",text:"外部被ばくを低減し、放射性物質の付着や取り込みも防ぐ。ゲーム上の効果は選択した1ターンよ。",color:"bg-emerald-600"},{icon:Car,title:"避難",text:"成功すれば即勝利よ。ただし失敗した場合、かえって被ばくしちゃうよ。避難指示が出ていれば確実に成功するから、屋内退避をしながら指示発令を待つのが合理的ね。",color:"bg-orange-600"},{icon:ShowerHead,title:"除染",text:"放射性物質を積極的に取り除く。体表面汚染を除去したいときに使おう。さらに相手によっては放射能を減らせるかもね。ただし、体内汚染は除去できないから予防が大事だよ。",color:"bg-cyan-700"},{icon:Lightbulb,title:"ハカセの助言",text:"困ったらいつでも聞いてね。ターンを消費せず、相手の特徴や攻略のヒントを教えるよ。",color:"bg-amber-400 text-slate-950"}];if(tutorialStep===-1)return <main className="fixed inset-0 z-50 h-[100dvh] overflow-hidden bg-slate-950 p-4 text-white"><div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center"><p className="text-xs font-black tracking-[.3em] text-cyan-300">TUTORIAL 0 / 6</p><Card className="mt-4 w-full border-white/10 bg-slate-900 text-white"><CardContent className="p-6 sm:p-10">

<div className="flex flex-col items-center gap-6 sm:flex-row">
 
<HakaseIcon
mood="normal"
className="h-28 w-28"
/>
 
<div className="text-center sm:text-left">
<h2 className="text-3xl font-black">
ゲームの目的
</h2>
 
<p className="mt-4 text-base leading-8 text-slate-200">
こんにちは。私のことはハカセって呼んでね。<br />
このゲームでは、さまざまな放射性物質からの被ばく防護を学べるよ。積極的に敵を倒すんじゃなくて、相手の特徴や状況を見ながら適切な防護措置を選び、被ばくをできるだけ抑えて全3ラウンドをクリアするのが目的よ。一緒に放射性物質への対応を考えよう！
</p>
</div>
 
</div>

</CardContent></Card><div className="mt-6 flex w-full max-w-xl justify-end"><Button onClick={()=>setTutorialStep(0)} className="bg-cyan-500 font-black text-slate-950">選択肢の説明へ</Button></div><Button onClick={beginRound1} variant="ghost" className="mt-4 text-slate-400">チュートリアルをスキップ</Button></div></main>;const item=items[tutorialStep],Icon=item.icon;return <main className="fixed inset-0 z-50 h-[100dvh] overflow-hidden bg-slate-950 p-4 text-white"><div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center"><p className="text-xs font-black tracking-[.3em] text-cyan-300">TUTORIAL {tutorialStep+1} / {items.length}</p><Card className="mt-4 w-full border-white/10 bg-slate-900 text-white"><CardContent className="p-6 sm:p-10"><div className="flex flex-col items-center gap-6 sm:flex-row">

<div className={`grid h-28 w-28 shrink-0 place-items-center rounded-3xl ${item.color}`}><Icon className="h-14 w-14"/></div>

<div className="text-center sm:text-left"><h2 className="text-3xl font-black">{item.title}</h2><p className="mt-4 text-base leading-8 text-slate-200">ハカセ「{item.text}」</p></div></div></CardContent></Card><div className="mt-6 flex w-full max-w-xl items-center justify-between gap-3"><Button onClick={()=>setTutorialStep(v=>v===0?-1:v-1)} className="bg-slate-700">戻る</Button><div className="flex gap-1">{items.map((_,i)=><span key={i} className={`h-2 w-6 rounded-full ${i===tutorialStep?"bg-cyan-300":"bg-slate-700"}`}/>)}</div>{tutorialStep<items.length-1?<Button onClick={()=>setTutorialStep(v=>v+1)} className="bg-cyan-500 font-black text-slate-950">次へ</Button>:<Button onClick={beginRound1} className="bg-amber-400 font-black text-slate-950">ROUND 1へ</Button>}</div><Button onClick={beginRound1} variant="ghost" className="mt-4 text-slate-400">チュートリアルをスキップ</Button></div></main>}
 if(phase==="title")return <main className="relative min-h-screen bg-slate-950 text-white"><div className="absolute right-4 top-4 z-20 rounded-md bg-slate-950/90 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-slate-300 ring-1 ring-white/10 sm:text-xs">© NUCLEAR SAFETY TECHNOLOGY CENTER</div><div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pb-24 text-center"><Radiation className="h-20 w-20 text-cyan-300"/><p className="mt-5 font-black tracking-[.35em] text-cyan-300">PROTECTION BATTLE RPG</p><h1 className="text-5xl font-black md:text-7xl">RAD GUARDIANS</h1><p className="mt-3 text-xl font-bold text-slate-300">放射線教育ゲーム</p><Card className="mt-8 max-w-2xl border-white/10 bg-slate-900 text-slate-200"><CardContent className="p-6 text-left leading-7">放射性物質の特徴をとらえ、防護措置を選択せよ。</CardContent></Card><Button onClick={start} className="mt-8 h-14 bg-cyan-500 px-12 text-lg font-black text-slate-950">BATTLE START</Button></div><div className="absolute inset-x-0 bottom-5 px-5 text-center text-[10px] leading-5 text-slate-500 sm:text-xs"><p>本ゲームは放射線防護の基礎知識を学ぶための教育用コンテンツです。</p><p>ゲームの性格上、放射性物質の動態や防護措置の効果を正確に反映していない場合があることをご了承ください。</p></div></main>;

if (phase === "final") {
const grade =
finalFeedback.level === "excellent"
? "EXCELLENT"
: finalFeedback.level === "good"
? "GOOD"
: "REVIEW";
 
return (
<main className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
<div className="mx-auto max-w-3xl text-center">
 
<Sparkles className="mx-auto h-16 w-16 text-amber-300" />
 
<p className="mt-4 text-xs font-black tracking-[.3em] text-cyan-300">
FINAL RESULT
</p>
 
<h1 className="mt-2 text-5xl font-black text-amber-300 sm:text-6xl">
{grade}
</h1>
 
<Card className="mt-8 border-white/10 bg-slate-900 text-white">
<CardContent className="space-y-5 p-5 sm:p-7">
 
<Meter
label="残存防護力"
value={hp}
/>
 
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
 
<div className="rounded-xl bg-slate-800 p-4">
外部被ばく
<b className="block text-2xl">
{dose.external}
</b>
</div>
 
<div className="rounded-xl bg-slate-800 p-4">
内部被ばく
<b className="block text-2xl">
{dose.internal}
</b>
</div>
 
<div className="rounded-xl bg-slate-800 p-4">
助言使用
<b className="block text-2xl">
{hintCount}回
</b>
</div>
 
<div className="rounded-xl bg-slate-800 p-4">
勝利方法
<b className="block text-sm">
{history.length > 0
? history.join(" / ")
: "記録なし"}
</b>
</div>
 
</div>
 
<div
className={`rounded-2xl border p-4 text-left sm:p-5 ${finalFeedback.color}`}
>
<div className="flex items-start gap-4">
 
<HakaseIcon
mood={finalFeedback.mood}
className="h-20 w-20 sm:h-24 sm:w-24"
/>
 
<div className="min-w-0 flex-1">
 
<p className="text-xs font-black tracking-[.2em] text-amber-300">
ハカセからの講評
</p>
 
<h2
className={`mt-1 text-lg font-black sm:text-xl ${finalFeedback.titleColor}`}
>
{finalFeedback.title}
</h2>
 
<p className="mt-3 text-sm leading-7 text-slate-200">
{finalFeedback.text}
</p>
 
</div>
</div>
</div>
 
</CardContent>
</Card>
 
<Button
onClick={() => setPhase("title")}
className="mt-7 bg-cyan-600"
>
<RotateCcw className="mr-2 h-4 w-4" />
もう一度
</Button>
 
</div>
</main>
);
}

 return <motion.main initial={{opacity:0}} animate={{opacity:battleFade}} transition={{duration:.8,ease:"easeOut"}} className="h-[100dvh] overflow-hidden bg-slate-950 p-2 pb-24 text-white sm:p-3 sm:pb-24 lg:p-4 lg:pb-24"><div className="mx-auto flex h-full max-w-6xl flex-col"><div className="mb-2 flex shrink-0 justify-between"><div><p className="text-[10px] font-black tracking-[.25em] text-cyan-300 sm:text-xs">ROUND {enemy.round} / 3</p><h1 className="text-xl font-black sm:text-2xl lg:text-3xl">{enemy.symbol} <span className="text-slate-400">{enemy.name}</span></h1></div><div className="rounded-xl bg-slate-900 px-4 py-1 text-center"><small className="text-[10px]">TURN</small><b className="block text-xl">{turn}</b></div></div><div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)] gap-3 max-md:grid-cols-1 max-md:grid-rows-[minmax(0,1fr)_auto]"><section className="grid min-h-0 gap-2 grid-rows-[minmax(0,1fr)_auto]"><Card className="relative min-h-0 overflow-hidden border-white/10 bg-slate-900 text-white"><div className={`absolute inset-0 bg-gradient-to-br ${enemy.color} opacity-20`}/><CardContent className="relative flex h-full min-h-0 flex-col items-center justify-center p-2 sm:p-3"><motion.div animate={{y:[0,-5,0]}} transition={{duration:2.8,repeat:Infinity}} className={`grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br ${enemy.color} ring-4 ring-white/20 sm:h-24 sm:w-24 lg:h-28 lg:w-28`}><Radiation className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16"/></motion.div><p className="mt-2 text-xs font-black tracking-[.16em] sm:text-sm">{enemy.epithet}</p>{pending.length>0&&<div className="mt-2 flex flex-wrap justify-center gap-1">{pending.map((p,i)=><motion.span initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} key={`${p}-${i}`} className="rounded-full border border-yellow-300/40 bg-yellow-300/15 px-2 py-1 text-[10px] font-black text-yellow-200 sm:text-xs">⚠ {p==="surface"?"体表面汚染":"体内汚染"} を引き起こしそうだ！</motion.span>)}</div>}<div className="mt-2 w-full max-w-xl"><Meter label="放射能ゲージ" value={gaugeValue} max={gaugeMax} color={enemy.id==="cs137"?"bg-orange-400":"bg-violet-400"}/></div></CardContent></Card><Card className="shrink-0 border-white/10 bg-slate-900 text-white"><CardContent className="p-2 sm:p-3"><Meter label="防護力" value={hp}/><div className="mt-2 flex min-h-6 flex-wrap gap-1">{playerStatuses.length?playerStatuses.map(s=><span key={s} className={`rounded-full px-2 py-1 text-[10px] font-bold sm:text-xs ${s.includes("汚染")||s.includes("被ばく")?"bg-rose-500/20 text-rose-300":"bg-cyan-500/20 text-cyan-200"}`}>{s}</span>):<span className="text-[10px] text-slate-500 sm:text-xs">状態変化なし</span>}</div></CardContent></Card></section><aside className="grid min-h-0 gap-2 grid-rows-[auto_minmax(0,1fr)]"><Card className="shrink-0 border-white/10 bg-slate-900 text-white"><CardContent className="p-2 sm:p-3"><p className="mb-2 text-xs font-black text-cyan-300">ACTION</p><div className="grid grid-cols-3 gap-1 sm:grid-cols-2 sm:gap-2">{ACTIONS.map(({id,label,icon:Icon,tone})=><Button key={id} onClick={()=>act(id)} disabled={busy||!!result} className={`h-12 flex-col px-1 text-[10px] sm:h-14 sm:text-xs lg:h-16 ${tone}`}><Icon className="mb-0.5 h-4 w-4 sm:h-5 sm:w-5"/>{label}</Button>)}</div>{busy&&<Button onClick={()=>skipRef.current?.()} className="mt-2 h-8 w-full bg-slate-700 text-xs"><FastForward className="mr-2 h-4 w-4"/>クリックで進む</Button>}</CardContent></Card><Card className="min-h-0 overflow-hidden border-white/10 bg-slate-900 text-white"><CardContent className="flex h-full min-h-0 flex-col p-2 sm:p-3"><p className="mb-1 shrink-0 text-xs font-black text-slate-400">BATTLE LOG</p><div className="min-h-0 flex-1 space-y-1 overflow-y-auto text-[11px] sm:text-xs">{logs.map(l=><motion.p initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} key={l.id} className={l.kind==="player"?"font-black text-cyan-300":l.kind==="enemy"?"font-black text-orange-300":l.kind==="match"?"font-black text-emerald-300":l.kind==="damage"?"font-black text-rose-300":l.kind==="charge"?"font-black text-yellow-300":l.kind==="order"?"font-black text-sky-300":"text-violet-300"}>{l.text}</motion.p>)}</div></CardContent></Card></aside></div></div><div className="fixed inset-x-0 bottom-0 z-30 h-20 border-t border-amber-300/20 bg-slate-900/95 p-2 backdrop-blur"><div className="mx-auto flex h-full max-w-6xl items-center gap-2 sm:gap-3"><HakaseIcon mood={hakase.mood}/><div className="min-w-0 flex-1"><b className="text-[10px] text-amber-300 sm:text-xs">ハカセ</b><motion.p key={hakase.text} initial={{opacity:0}} animate={{opacity:1}} className="line-clamp-3 text-xs leading-4 sm:text-sm sm:leading-5">{hakase.text}</motion.p></div></div></div>{result&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4"><div className="w-full max-w-lg rounded-3xl bg-slate-900 p-6 text-center"><h2 className={`text-3xl font-black sm:text-4xl ${result.type==="clear"?"text-cyan-300":"text-rose-400"}`}>{result.title}</h2><p className="mt-3 text-sm">{result.text}</p>{result.type==="clear"?<Button onClick={nextRound} className="mt-5 bg-cyan-500 text-slate-950">{round<2?"NEXT ROUND":"FINAL RESULT"}</Button>:<Button onClick={()=>reset(round,false)} className="mt-5 bg-rose-500">RETRY</Button>}</div></div>}</motion.main>;
}
