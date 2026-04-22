/**
 * @module VitalSyncPro
 * @version 2.0.0
 * @description Predictive Health & Wellness Intelligence Engine with Monte Carlo simulation,
 * compound risk modeling, symptom correlation, habit stacking, and periodized fitness.
 * @license MIT
 * ⚠️ EDUCATIONAL ONLY. Not medical advice. Always consult a healthcare provider.
 *
 * VitalSync Pro — Predictive Health & Wellness Intelligence Engine
 * ⚠️ DISCLAIMER: Educational/informational only. NOT medical advice.
 * Always consult a qualified healthcare provider. In emergencies, call 911.
 */
const DISCLAIMER="⚠️ EDUCATIONAL ONLY. Not medical advice. Consult a healthcare provider. Emergency: 911.";
const CRISIS={suicide:"988 Suicide & Crisis Lifeline: call/text 988",crisis:"Crisis Text Line: text HOME to 741741",samhsa:"SAMHSA: 1-800-662-4357",neda:"NEDA: 1-800-931-2237"};


/** Validates user input. Returns {valid,errors,sanitized}. Rejects dangerous ranges, adds age warnings. */
function validateInput(i){const e=[],s={...i};
if(!s.age||typeof s.age!=="number"||s.age<13||s.age>120)e.push("Age must be 13-120");
if(!s.sex||!["male","female"].includes(s.sex))e.push("Sex must be 'male'/'female'");
if(!s.heightCm||s.heightCm<100||s.heightCm>250)e.push("Height 100-250cm");
if(!s.weightKg||s.weightKg<25||s.weightKg>300)e.push("Weight 25-300kg");
s.activityLevel=["sedentary","light","moderate","active","extreme"].includes(s.activityLevel)?s.activityLevel:"sedentary";
s.goal=["weight-loss","muscle-gain","general-health"].includes(s.goal)?s.goal:"general-health";
s.smoker=!!s.smoker;s.diabetes=!!s.diabetes;s.hypertension=!!s.hypertension;s.familyHeartDisease=!!s.familyHeartDisease;
if(s.age&&s.age<18)e.push("⚠️ Under 18: parental/pediatric guidance advised");
if(s.age&&s.age>70)e.push("⚠️ Over 70: consult doctor before fitness programs");
return{valid:e.length===0||e.every(x=>x.startsWith("⚠️")),errors:e,sanitized:s};}

/** BMI = weight(kg)/height(m)². Returns {value,label,risk,healthyRange}. */
function calcBMI(kg,cm){const m=cm/100,v=Math.round(kg/(m*m)*10)/10;const cats=[[16,"SevereUnderweight","critical"],[18.5,"Underweight","high"],[25,"Normal","low"],[30,"Overweight","moderate"],[35,"ObeseI","high"],[40,"ObeseII","very-high"],[Infinity,"ObeseIII","critical"]];const[,l,r]=cats.find(([mx])=>v<mx);return{value:v,label:l,risk:r}}
function calcBMR(kg,cm,age,sex){return Math.round(10*kg+6.25*cm-5*age+(sex==="male"?5:-161))}
function calcTDEE(bmr,act){return Math.round(bmr*({sedentary:1.2,light:1.375,moderate:1.55,active:1.725,extreme:1.9}[act]||1.2))}
function bodyFat(sex,w,n,h,hip){try{return sex==="male"?Math.round((495/(1.0324-0.19077*Math.log10(w-n)+0.15456*Math.log10(h))-450)*10)/10:Math.round((495/(1.29579-0.35004*Math.log10(w+(hip||0)-n)+0.221*Math.log10(h))-450)*10)/10}catch{return null}}
function hrZones(age){const mx=Math.round(208-0.7*age),p=r=>Math.round(mx*r);return{max:mx,zones:[{name:"Recovery",range:[p(.5),p(.6)],use:"Warm-up"},{name:"FatBurn",range:[p(.6),p(.7)],use:"Endurance"},{name:"Aerobic",range:[p(.7),p(.8)],use:"Cardio fitness"},{name:"Threshold",range:[p(.8),p(.9)],use:"Speed"},{name:"Peak",range:[p(.9),mx],use:"Max effort"}]}}

// Monte Carlo Health Trajectory Simulator
function simulateTrajectory(profile,scenarios,years=2,sims=10){
  const res={};
  for(const sc of scenarios){
    const paths=[];
    for(let s=0;s<sims;s++){
      let wt=profile.weightKg,fit=({sedentary:25,light:40,moderate:60,active:75,extreme:90}[profile.activityLevel]||30),str=profile.stressScore||50;
      const pts=[];
      for(let m=1;m<=years*12;m++){
        const adh=Math.max(.1,Math.min(1,sc.adherence+(Math.random()-.5)*.3));
        const life=Math.random()<.05;
        wt=Math.max(40,wt+sc.wtChange*adh*4.33+(life?-.3:0));
        fit=Math.max(10,Math.min(100,fit+sc.fitGain*adh-(life?3:0)));
        str=Math.max(5,Math.min(100,str-sc.stressRed*adh+(life?15:0)));
        if(m%6===0)pts.push({month:m,wt:Math.round(wt*10)/10,bmi:calcBMI(wt,profile.heightCm).value,fit:Math.round(fit)});
      }
      paths.push(pts);
    }
    const agg=paths[0].map((_,t)=>{
      const ws=paths.map(p=>p[t].wt).sort((a,b)=>a-b);
      const bs=paths.map(p=>p[t].bmi).sort((a,b)=>a-b);
      const fs=paths.map(p=>p[t].fit).sort((a,b)=>a-b);
      const pc=(a,p)=>a[Math.floor(a.length*p)];
      return{month:paths[0][t].month,weight:{p10:pc(ws,.1),p50:pc(ws,.5),p90:pc(ws,.9)},bmi:{p50:pc(bs,.5)},fitness:{p50:pc(fs,.5)}};
    });
    res[sc.name]={desc:sc.desc,projections:agg};
  }
  return res;
}

// Compound Risk Interaction Model
function compoundRisk(p){
  const f={age:p.age>55?2:p.age>45?1.5:p.age>35?1:.5,bmi:p.bmi>35?2.5:p.bmi>30?2:p.bmi>25?1:0,smoke:p.smoker?2.5:0,sedentary:p.activityLevel==="sedentary"?2:p.activityLevel==="light"?1:0,family:p.familyHeartDisease?1.5:0,diabetes:p.diabetes?2:0,htn:p.hypertension?2:0,stress:(p.stressScore||0)>60?1.5:0};
  const ix=[];
  if(f.smoke&&f.bmi>1)ix.push({pair:"Smoking+HighBMI",mult:1.4,note:"Compounds cardiovascular risk significantly"});
  if(f.sedentary&&f.stress)ix.push({pair:"Sedentary+Stress",mult:1.3,note:"Inactivity prevents stress metabolization"});
  if(f.diabetes&&f.bmi>1)ix.push({pair:"Diabetes+HighBMI",mult:1.5,note:"Compounding metabolic strain"});
  const base=Object.values(f).reduce((a,b)=>a+b,0);
  const mult=ix.reduce((m,i)=>m*i.mult,1);
  const score=Math.round(base*mult*10)/10;
  let level,action;
  if(score<4){level="Low";action="Routine checkups"}
  else if(score<8){level="Moderate";action="Schedule comprehensive checkup"}
  else if(score<14){level="Elevated";action="⚠️ See your healthcare provider within a month"}
  else{level="High";action="🚨 Schedule medical appointment ASAP"}
  return{disclaimer:"⚠️ Simplified educational model, NOT clinical assessment.",factors:f,interactions:ix,score,level,action,insight:ix.length>0?`Interacting risks: ${ix.map(i=>i.pair).join(", ")}. Fixing ANY one reduces compound effect on all.`:"No major interactions detected."};
}

// Symptom Correlation Network
function analyzeSymptoms(symptoms){
  const clusters={
    "Stress-Fatigue":{sx:["fatigue","headache","muscle_tension","poor_concentration","irritability"],desc:"HPA axis dysregulation pattern",action:"Stress reduction techniques. If persistent >2 weeks, see provider."},
    "Sleep-Mood":{sx:["insomnia","fatigue","low_mood","anxiety","poor_concentration"],desc:"Bidirectional sleep-mood disruption",action:"Prioritize sleep hygiene. If mood persists, see mental health professional."},
    "Metabolic":{sx:["fatigue","weight_change","thirst","frequent_urination","blurred_vision"],desc:"Possible metabolic changes",action:"⚠️ Get fasting glucose & metabolic panel. Do NOT self-diagnose."},
    "Cardiovascular":{sx:["chest_discomfort","shortness_of_breath","dizziness","fatigue","swelling"],desc:"🚨 Warrants IMMEDIATE evaluation",action:"🚨 If chest pain/SOB, call 911 NOW."},
  };
  const us=new Set(symptoms.map(s=>s.toLowerCase().replace(/\s+/g,"_")));
  const matches=[];
  for(const[name,c]of Object.entries(clusters)){
    const ol=c.sx.filter(s=>us.has(s));
    if(ol.length>=2)matches.push({cluster:name,matched:ol,strength:Math.round(ol.length/c.sx.length*100),...c});
  }
  return{disclaimer:"⚠️ NOT a diagnosis. Educational awareness only.",patterns:matches.sort((a,b)=>b.strength-a.strength),urgent:matches.some(m=>m.cluster==="Cardiovascular")};
}

// Habit Stacking Engine (BJ Fogg / Atomic Habits)
function buildHabitStack(weakDims){
  const lib={
    physical:[{trigger:"After morning coffee",habit:"5 bodyweight squats",time:"30s",d:1},{trigger:"After parking car",habit:"walk extra 2 min",time:"2m",d:1},{trigger:"After lunch",habit:"10-min walk",time:"10m",d:2}],
    mental:[{trigger:"After waking",habit:"write 3 gratitudes",time:"2m",d:1},{trigger:"After sitting for lunch",habit:"5 deep breaths (4-7-8)",time:"1m",d:1},{trigger:"When stressed",habit:"5-4-3-2-1 grounding",time:"3m",d:1}],
    recovery:[{trigger:"At 10PM",habit:"phone in other room",time:"0s",d:2},{trigger:"After brushing teeth",habit:"5-min muscle relaxation",time:"5m",d:1},{trigger:"On waking",habit:"sunlight within 10 min",time:"10m",d:2}],
    nutrition:[{trigger:"Before each meal",habit:"full glass of water",time:"1m",d:1},{trigger:"Opening fridge",habit:"grab veggie/fruit first",time:"0s",d:1},{trigger:"Sunday evening",habit:"prep 3 healthy lunches",time:"30m",d:3}],
  };
  const plan={};
  let week=1;
  for(const dim of weakDims.slice(0,3)){
    const hs=lib[dim]||lib.physical;
    hs.filter(h=>h.d<=week).slice(0,2).forEach(h=>{
      const wk=`week${Math.min(week,4)}`;
      if(!plan[wk])plan[wk]=[];
      plan[wk].push({dim,...h});
    });
    week++;
  }
  return{method:"Habit Stacking: anchor micro-habits to existing routines (BJ Fogg Tiny Habits + Gollwitzer 1999)",plan,tip:"Track streaks. Aim 80% adherence. Never miss two days in a row."};
}

// Wellness Assessment
function assessWellness(resp){
  const domains={stress:{qs:["s1","s2","s3","s4","s5"],wt:[1,1,1,1.2,.8]},sleep:{qs:["sl1","sl2","sl3","sl4","sl5"],wt:[1.2,1,1.1,.9,.8]},mood:{qs:["m1","m2","m3","m4","m5"],wt:[1.3,1.3,1.2,1.1,1]}};
  const out={};
  for(const[d,{qs,wt}]of Object.entries(domains)){
    let sc=0,mx=0;qs.forEach((q,i)=>{sc+=(resp[q]||0)*wt[i];mx+=3*wt[i]});
    const pct=Math.round(sc/mx*100);
    out[d]={pct,level:pct<=20?"Excellent":pct<=40?"Good":pct<=60?"Moderate":pct<=80?"Significant":"Critical — seek support"};
  }
  return out;
}

// Red Flags
function checkRedFlags(p,w){
  const flags=[];
  if(p.bmi<16)flags.push({sev:"CRITICAL",msg:"🚨 Severely low BMI — seek immediate medical attention.",res:CRISIS.neda});
  if(p.bmi>40)flags.push({sev:"HIGH",msg:"⚠️ Class III obesity — medical supervision needed."});
  if(w.mood&&w.mood.pct>75)flags.push({sev:"CRITICAL",msg:"🚨 Significant mood distress. Please reach out:",res:[CRISIS.suicide,CRISIS.crisis,CRISIS.samhsa]});
  if(w.mood&&w.mood.pct>50&&w.mood.pct<=75)flags.push({sev:"HIGH",msg:"⚠️ Elevated mood concerns — consider mental health professional."});
  return flags;
}

// Fitness Plan Generator
function fitnessPlan(p){
  const hr=hrZones(p.age);
  const plans={
    "weight-loss":{title:"Progressive Fat Loss",phases:[
      {name:"Foundation (Wk1-2)",sessions:[{days:"M/W/F",type:"Walk",d:`25min HR ${hr.zones[1].range[0]}-${hr.zones[1].range[1]}`},{days:"Tu/Th",type:"Bodyweight",d:"15min: squats, pushups, planks 2×10"}]},
      {name:"Build (Wk3-6)",sessions:[{days:"M/Th",type:"Cardio+Intervals",d:`35min with 3×2min at HR ${hr.zones[2].range[0]}-${hr.zones[2].range[1]}`},{days:"Tu/Fri",type:"Strength",d:"Full-body 3×12 compound"},{days:"Sat",type:"Long cardio",d:"45-60min zone 2"}]},
      {name:"Advance (Wk7-12)",sessions:[{days:"M/Th",type:"HIIT",d:"25min: 30s sprint/90s rest ×8-10"},{days:"Tu/Fri",type:"Strength",d:"Push/pull split 4×10-12"},{days:"Sat",type:"Outdoor",d:"60+min hiking/cycling"}]},
    ]},
    "muscle-gain":{title:"Hypertrophy Program",phases:[
      {name:"Neural (Wk1-3)",sessions:[{days:"M/Th",type:"Upper",d:"Press/row/curl 3×12 RPE 6-7"},{days:"Tu/Fri",type:"Lower",d:"Squat/hinge/lunge 3×12 RPE 6-7"}]},
      {name:"Volume (Wk4-8)",sessions:[{days:"M",type:"Push",d:"Bench/OHP/dips 4×8-12"},{days:"Tu",type:"Pull",d:"Rows/pulldowns/curls 4×8-12"},{days:"Th",type:"Legs",d:"Squat/RDL/press 4×8-12"},{days:"Fri",type:"Upper",d:"Supersets 3×10-12"}]},
      {name:"Intensity (Wk9-12)",sessions:[{days:"M/Th",type:"Heavy",d:"4×5-8 RPE 8-9 compounds"},{days:"Tu/Fri",type:"Hypertrophy",d:"Accessories 3×12-15"}]},
    ]},
    "general-health":{title:"Balanced Wellness",phases:[
      {name:"Habit (Wk1-4)",sessions:[{days:"M/W/F",type:"Mixed",d:"20min: 10 cardio + 10 strength"},{days:"Tu/Th",type:"Flex",d:"20min yoga/stretching"},{days:"Sat",type:"Play",d:"30+min fun activity"}]},
      {name:"Expand (Wk5-12)",sessions:[{days:"M/Th",type:"Cardio",d:`30min zone 2-3 (HR ${hr.zones[1].range[0]}-${hr.zones[2].range[1]})`},{days:"Tu/Fri",type:"Strength",d:"Functional 3×12-15"},{days:"Sat",type:"Adventure",d:"60+min outdoor"}]},
    ]},
  };
  const plan=plans[p.goal]||plans["general-health"];
  const safety=[];
  if(p.age>60)safety.push("⚠️ Get medical clearance. Warm up 10+min.");
  if(p.bmi>35)safety.push("⚠️ Start low-impact (swim/cycle). Protect joints.");
  if(p.activityLevel==="sedentary")safety.push("⚠️ Start at 50% volume for first 2 weeks.");
  safety.push("Stop if chest pain, severe dizziness, or difficulty breathing. Seek medical attention.");
  return{...plan,hrZones:hr.zones,safety};
}

// Nutrition Plan
function nutritionPlan(p){
  let cal,pro,fat,carb;
  if(p.goal==="weight-loss"){cal=Math.round(p.tdee*.8);pro=Math.round(p.weightKg*2)}
  else if(p.goal==="muscle-gain"){cal=Math.round(p.tdee*1.1);pro=Math.round(p.weightKg*2.2)}
  else{cal=p.tdee;pro=Math.round(p.weightKg*1.6)}
  fat=Math.round(cal*.27/9);carb=Math.round((cal-pro*4-fat*9)/4);
  return{disclaimer:"⚠️ General guidance. See a registered dietitian for personalized advice.",calories:cal,protein:`${pro}g (${Math.round(pro*4/cal*100)}%)`,fat:`${fat}g (${Math.round(fat*9/cal*100)}%)`,carbs:`${carb}g (${Math.round(carb*4/cal*100)}%)`,water:`${Math.round(p.weightKg*.033*10)/10}L/day`,
    meals:[{m:"Breakfast",ex:"Oatmeal+berries+nuts+eggs"},{m:"Lunch",ex:"Lean protein+veggies+complex carbs"},{m:"Snack",ex:"Greek yogurt+fruit or hummus+veggies"},{m:"Dinner",ex:"Fish/chicken+roasted veggies+whole grain"}],
    principles:["Protein every meal","Half plate vegetables","Whole grains over refined","Minimize ultra-processed foods","Eat mindfully"]};
}

// === MAIN ASSESSMENT ===
/**
 * Complete health assessment. Pass {age,sex,heightCm,weightKg} + optional fields.
 * @param {Object} input - {age:number,sex:string,heightCm:number,weightKg:number,activityLevel?,goal?,smoker?,diabetes?,hypertension?,familyHeartDisease?,wellnessResponses?,symptoms?}
 * @returns {Object} Full report: profileSummary, wellnessScore, compoundRisk, fitnessPlan, nutritionPlan, habitStack, healthTrajectories, symptomAnalysis, actionPlan
 */
function assess(input){
  console.log("⚠️ "+DISCLAIMER);
  console.log("\n🩺 VitalSync Pro — Predictive Health & Wellness Intelligence Engine\n");
  const bmi=calcBMI(input.weightKg,input.heightCm);
  const bmr=calcBMR(input.weightKg,input.heightCm,input.age,input.sex);
  const tdee=calcTDEE(bmr,input.activityLevel);
  const bf=bodyFat(input.sex,input.waistCm,input.neckCm,input.heightCm,input.hipCm);
  const p={...input,bmi:bmi.value,bmiLabel:bmi.label,bmr,tdee,bodyFat:bf};
  const wellness=input.wellnessResponses?assessWellness(input.wellnessResponses):{};
  p.stressScore=wellness.stress?.pct||0;
  const flags=checkRedFlags(p,wellness);
  if(flags.some(f=>f.sev==="CRITICAL")){console.log("\n🚨 CRITICAL FLAGS:");flags.filter(f=>f.sev==="CRITICAL").forEach(f=>{console.log(f.msg);if(Array.isArray(f.res))f.res.forEach(r=>console.log("  📞 "+r));else if(f.res)console.log("  📞 "+f.res)})}
  const risk=compoundRisk(p);
  const fit=fitnessPlan(p);
  const nutr=nutritionPlan(p);
  const dims={physical:bmi.risk==="low"?80:bmi.risk==="moderate"?60:40,mental:100-(wellness.mood?.pct||30),recovery:100-(wellness.sleep?.pct||30),nutrition:60};
  const weakest=Object.entries(dims).sort((a,b)=>a[1]-b[1]).map(([k])=>k);
  const habits=buildHabitStack(weakest);
  const scenarios=[
    {name:"High Adherence",desc:"Following plan 80%+",adherence:.85,wtChange:input.goal==="weight-loss"?-.15:input.goal==="muscle-gain"?.05:0,fitGain:4,stressRed:3},
    {name:"Moderate",desc:"Following plan ~55%",adherence:.55,wtChange:input.goal==="weight-loss"?-.08:.02,fitGain:2,stressRed:1.5},
    {name:"No Change",desc:"Current lifestyle",adherence:.1,wtChange:.02,fitGain:-.5,stressRed:0},
  ];
  const traj=simulateTrajectory(p,scenarios);
  const symp=input.symptoms?analyzeSymptoms(input.symptoms):null;
  const overall=Math.round(Object.values(dims).reduce((a,b)=>a+b,0)/4);
  const report={disclaimer:DISCLAIMER,crisisResources:CRISIS,redFlags:flags,
    profile:{age:p.age,sex:p.sex,height:`${p.heightCm}cm`,weight:`${p.weightKg}kg`,bmi:`${bmi.value} (${bmi.label})`,bmr:`${bmr}kcal/day`,tdee:`${tdee}kcal/day`,bodyFat:bf?`${bf}%`:"N/A",goal:p.goal},
    wellnessScore:{overall,dims},wellness,compoundRisk:risk,fitness:fit,nutrition:nutr,habitStack:habits,trajectories:traj,symptoms:symp,
    actions:generateActions(dims,flags,risk)};
  printReport(report);
  return report;
}

function generateActions(dims,flags,risk){
  const a=[];
  if(flags.length)a.push({p:"🚨",a:"Address red flags. Seek professional help."});
  if(risk.level==="High"||risk.level==="Elevated")a.push({p:"⬆️",a:risk.action});
  Object.entries(dims).sort((x,y)=>x[1]-y[1]).forEach(([d,s])=>{if(s<50)a.push({p:"⬆️",a:`${d}: needs focus — follow habit stack`});else if(s<70)a.push({p:"📋",a:`${d}: room to grow`})});
  a.push({p:"📅",a:"Re-assess monthly. Track habit streaks! Set a calendar reminder for 30 days from now."});
  return a;
}

function printReport(r){
  const l=console.log.bind(console);
  l("═".repeat(60));l("  📊 VITALSYNC PRO WELLNESS REPORT");l("═".repeat(60));
  if(r.redFlags.length){l("\n🚩 RED FLAGS:");r.redFlags.forEach(f=>l(`  [${f.sev}] ${f.msg}`))}
  l("\n📋 PROFILE:");Object.entries(r.profile).forEach(([k,v])=>l(`  ${k}: ${v}`));
  l(`\n🎯 WELLNESS: ${r.wellnessScore.overall}/100`);
  Object.entries(r.wellnessScore.dims).forEach(([d,s])=>{l(`  ${d.padEnd(12)} [${"█".repeat(Math.round(s/5))+"░".repeat(20-Math.round(s/5))}] ${s}`)});
  l(`\n⚡ COMPOUND RISK: ${r.compoundRisk.level}`);l(`  ${r.compoundRisk.insight}`);
  if(r.compoundRisk.interactions.length)r.compoundRisk.interactions.forEach(i=>l(`    • ${i.pair}: ${i.note}`));
  l(`  ${r.compoundRisk.disclaimer}`);
  l(`\n🏋️ ${r.fitness.title}`);
  r.fitness.phases.forEach(ph=>{l(`  📌 ${ph.name}`);ph.sessions.forEach(s=>l(`    ${s.days.padEnd(10)} [${s.type}] ${s.d}`))});
  l("  Safety:");r.fitness.safety.forEach(s=>l(`  ${s}`));
  l("\n💓 HR ZONES:");r.fitness.hrZones.forEach(z=>l(`  ${z.name.padEnd(12)} ${z.range[0]}-${z.range[1]}bpm — ${z.use}`));
  l(`\n🍎 NUTRITION: ${r.nutrition.calories}kcal | P:${r.nutrition.protein} F:${r.nutrition.fat} C:${r.nutrition.carbs} | Water:${r.nutrition.water}`);
  l(`  ${r.nutrition.disclaimer}`);
  l("\n🔗 HABIT STACK:");l(`  ${r.habitStack.method}`);
  Object.entries(r.habitStack.plan).forEach(([w,hs])=>{if(hs.length){l(`  ${w}:`);hs.forEach(h=>l(`    [${h.dim}] ${h.trigger} → ${h.habit} (${h.time})`))}});
  l("\n📈 HEALTH TRAJECTORIES (Monte Carlo, 2yr):");
  Object.entries(r.trajectories).forEach(([n,d])=>{const f=d.projections[d.projections.length-1];l(`  ${n}: wt ${f.weight.p10}-${f.weight.p90}kg (med:${f.weight.p50}) | BMI ${f.bmi.p50} | fit ${f.fitness.p50}`)});
  if(r.symptoms){l("\n🔬 SYMPTOM PATTERNS:");l(`  ${r.symptoms.disclaimer}`);r.symptoms.patterns.forEach(p=>l(`  ${p.cluster} (${p.strength}%): ${p.matched.join(",")} — ${p.action}`))}
  l("\n✅ ACTIONS:");r.actions.forEach(a=>l(`  ${a.p} ${a.a}`));
  l("\n📞 CRISIS:");Object.values(r.crisisResources).forEach(v=>l(`  ${v}`));
  l("\n"+"═".repeat(60));l("⚠️ "+r.disclaimer);l("═".repeat(60));
}

// Demo
const demo=assess({age:35,sex:"male",heightCm:178,weightKg:85,runTrajectories:true,activityLevel:"light",goal:"weight-loss",symptoms:["fatigue","headache","poor_concentration"],wellnessResponses:{s1:2,s2:1,s3:1,sl1:1,sl2:2,sl3:1,m1:1,m2:1,m3:1}});

module.exports={assess,validateInput,calcBMI,calcBMR,calcTDEE,bodyFat,hrZones,simulateTrajectory,compoundRisk,analyzeSymptoms,buildHabitStack,assessWellness,checkRedFlags,fitnessPlan,nutritionPlan,DISCLAIMER,CRISIS};
