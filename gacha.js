// gacha.js
// Chakra Rogue — Naruto-style equivalent gacha system
// Two banners: Standard and Advanced
// Standard rates: 5* = 1%, 4* = 9%, 3* = 90%
// Advanced rates: 5* = 6%, 4* = 24%, 3* = 70% ; Advanced 10x GUARANTEES at least one 4*

/* ------------- Configuration ------------- */
const CURRENCIES = {
  shardsKey: 'shards',            // existing shards currency in your app
  advancedKey: 'advancedStones'  // advanced banner currency (you can give starter stones)
};

const RATES = {
  standard: { star5: 1, star4: 9, star3: 90 },   // percent
  advanced: { star5: 6, star4: 24, star3: 70 }   // percent
};

const COST = {
  standard1: 25,
  standard10: 240,
  advanced1: 50,
  advanced10: 460
};

const STORAGE_KEYS = {
  chars: 'characters',
  pityStandard: 'pity_standard',
  pityAdvanced: 'pity_advanced'
};

/* ------------- Helper utilities ------------- */
function randInt(n){ return Math.floor(Math.random()*n); }
function chance(p){ return Math.random() < p; }
function now(){ return Date.now(); }

function loadJSON(key, fallback){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch(e){ return fallback; }
}
function saveJSON(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }

/* ------------- Character pool ------------- */
/*
  Each character object:
  {
    id: "haruto_vortexheart",
    name: "Haruto Vortexheart",
    rarity: 5,
    element: "Wind",
    skills: [ {id, name, type, power, cooldown, desc}, ... ],
    baseAtk, baseHp, specialFlags: {...}
  }
*/

const POOL = (function buildPool(){
  const list = [];

  // ---------- 5* Mythic (1%) (8 total; some are 'super rare' with 4 skills)
  const mythic = [
    ["haruto_vortexheart","Haruto Vortexheart","Wind"],
    ["sora_kuroblade","Sora Kuroblade","Lightning"],
    ["kaizen_silverstrike","Kaizen Silverstrike","Lightning"],
    ["garo_sandborne","Garo Sandborne","Earth"],
    ["ryuzen_voidrend","Ryuzen Voidrend","Fire"],
    ["elderwood_first","Elderwood First","Wood"],
    ["raijin_flashstep","Raijin Flashstep","Wind"],
    ["zenith_shadowlord","Zenith Shadowlord","Yin"]
  ];

  // helper to create skills (we keep names original-equivalent but unique)
  function mkSkill(id,name,type,power,cooldown,desc){
    return { id, name, type, power, cooldown, desc };
  }

  // Add 5* entries
  mythic.forEach((m, idx)=>{
    const [id,name,element] = m;
    // Most 5* have 4 skills; make some (index 2 and 6) only 3-skill "rare3Skill"
    const rare3 = (idx === 2 || idx === 6); // a couple of 3-skill 5* as requested
    const skills = [];

    // signature skill (big single-target or multi)
    skills.push(mkSkill(id + "_sig", `${name.split(' ')[0]}'s Signature`, "ultimate", 220 + idx*15, 4, "High-impact signature attack."));

    // AoE / support
    skills.push(mkSkill(id + "_skill2", `Prime Technique`, "skill", 120 + idx*8, 3, "Powerful technique - can apply debuff or buff."));

    // Utility / passive
    skills.push(mkSkill(id + "_skill3", `Tactical Move`, "utility", 0, 2, "Applies buff/positioning effect."));

    if(!rare3){
      // 4th skill for super-rare 5* (super-rare = those with 4 skills)
      skills.push(mkSkill(id + "_skill4", `Transcendent Art`, "ultimate2", 180 + idx*10, 5, "A second ultimate: heavy damage or team-wide effect."));
    }

    list.push({
      id, name, rarity:5, element,
      skills,
      baseAtk: 120 + idx*10,
      baseHp: 1100 + idx*80,
      power: 3000 + idx*120,
      specialFlags: { mythic:true, rare3Skill: rare3 }
    });
  });

  // ---------- 4* Elite (15 entries)
  const fourNames = [
    ["hana_seishin","Hana Seishin","Yin"],
    ["ren_byakko","Ren Byakko","Yin"],
    ["tetsu_rockmane","Tetsu Rockmane","Physical"],
    ["kira_galecrest","Kira Galecrest","Wind"],
    ["shinobu_rivermist","Shinobu Rivermist","Water"],
    ["juro_ironroot","Juro Ironroot","Wood"],
    ["mei_frostpetal","Mei Frostpetal","Water"],
    ["sachi_moonbloom","Sachi Moonbloom","Yin"],
    ["ranmaru_shadowthread","Ranmaru Shadowthread","Yin"],
    ["koru_flamefang","Koru Flamefang","Fire"],
    ["arima_nightflash","Arima Nightflash","Yin"],
    ["toru_riverstride","Toru Riverstride","Physical"],
    ["nami_tidesong","Nami Tidesong","Water"],
    ["raiku_bladewind","Raiku Bladewind","Lightning"],
    ["kyoka_stormbloom","Kyoka Stormbloom","Wind"]
  ];

  fourNames.forEach((f, idx)=>{
    const [id,name,element] = f;
    const skills = [
      mkSkill(id + "_skill1", `Basic Strike`, "skill", 90 + idx*6, 1, "Solid single-target attack."),
      mkSkill(id + "_skill2", `Special Move`, "skill", 140 + idx*8, 3, "Signature move for the elite."),
      mkSkill(id + "_skill3", `Tactical Aid`, "utility", 0, 2, "Buff or minor heal.")
    ];
    list.push({
      id,name,rarity:4,element,
      skills,
      baseAtk: 80 + idx*6,
      baseHp: 700 + idx*40,
      power: 900 + idx*60,
      specialFlags: {}
    });
  });

  // ---------- 3* Basic (17 entries) - very simple 3-skill kits
  const threeNames = [
    ["daku_redfang","Daku Redfang","Fire"],
    ["ena_quickstep","Ena Quickstep","Wind"],
    ["oji_stonehelm","Oji Stonehelm","Earth"],
    ["rima_silverdew","Rima Silverdew","Water"],
    ["taro_steelpaw","Taro Steelpaw","Physical"],
    ["yura_lakeshell","Yura Lakeshell","Water"],
    ["rento_marshborn","Rento Marshborn","Water"],
    ["paku_lanternfox","Paku Lanternfox","Fire"],
    ["fumi_reedstep","Fumi Reedstep","Wood"],
    ["roku_sandwhirl","Roku Sandwhirl","Earth"],
    ["miko_thornflare","Miko Thornflare","Wood"],
    ["rai_quicklash","Rai Quicklash","Lightning"],
    ["jida_fogdance","Jida Fogdance","Water"],
    ["ono_rivertwist","Ono Rivertwist","Water"],
    ["kento_boulderback","Kento Boulderback","Earth"],
    ["pira_glasslash","Pira Glasslash","Wind"],
    ["boru_splitfang","Boru Splitfang","Physical"]
  ];

  threeNames.forEach((t, idx)=>{
    const [id,name,element] = t;
    const skills = [
      mkSkill(id + "_s1", "Minor Attack", "skill", 40 + idx*2, 1, "A weak strike."),
      mkSkill(id + "_s2", "Support Tweak", "utility", 0, 2, "Small buff or movement."),
      mkSkill(id + "_s3", "Weak AOE", "aoe", 25 + idx*2, 3, "Low damage aoe.")
    ];
    list.push({
      id, name, rarity:3, element,
      skills,
      baseAtk: 34 + idx*2,
      baseHp: 240 + idx*10,
      power: 120 + idx*8,
      specialFlags: {}
    });
  });

  return list;
})();

/* ------------- Pools by rarity ------------- */
const POOL_BY_RARITY = {
  5: POOL.filter(c => c.rarity === 5),
  4: POOL.filter(c => c.rarity === 4),
  3: POOL.filter(c => c.rarity === 3)
};

/* ------------- Save / Load characters ------------- */
function getOwnedChars(){ return loadJSON(STORAGE_KEYS.chars, []); }
function saveOwnedChars(arr){ saveJSON(STORAGE_KEYS.chars, arr); }

function addCharacterInstance(template){
  const uid = template.id + "-" + Math.floor(now()/1000) + "-" + randInt(9999);
  // clone template with instance-specific fields
  const inst = {
    uid, templateId: template.id, name: template.name, rarity: template.rarity, element: template.element,
    skills: JSON.parse(JSON.stringify(template.skills)),
    level: 1, xp: 0,
    atk: template.baseAtk, hp: template.baseHp, hpMax: template.baseHp,
    power: template.power,
    obtainedAt: now(),
    flags: template.specialFlags || {}
  };
  const owned = getOwnedChars();
  owned.push(inst);
  saveOwnedChars(owned);
  return inst;
}

/* ------------- Currency helpers ------------- */
function getShards(){ return parseInt(localStorage.getItem(CURRENCIES.shardsKey) || "0", 10); }
function setShards(n){ localStorage.setItem(CURRENCIES.shardsKey, String(n)); }
function getAdvanced(){ return parseInt(localStorage.getItem(CURRENCIES.advancedKey) || "0", 10); }
function setAdvanced(n){ localStorage.setItem(CURRENCIES.advancedKey, String(n)); }

/* ------------- Pity trackers (simple incremental) ------------- */
function getPityStandard(){ return parseInt(localStorage.getItem(STORAGE_KEYS.pityStandard) || "0", 10); }
function setPityStandard(n){ localStorage.setItem(STORAGE_KEYS.pityStandard, String(n)); }
function getPityAdvanced(){ return parseInt(localStorage.getItem(STORAGE_KEYS.pityAdvanced) || "0", 10); }
function setPityAdvanced(n){ localStorage.setItem(STORAGE_KEYS.pityAdvanced, String(n)); }

/* ------------- Rarity roll helpers ------------- */
function rollByRates(rates){
  const r = Math.random()*100;
  if(r < rates.star5) return 5;
  if(r < rates.star5 + rates.star4) return 4;
  return 3;
}

function pickRandomFromPool(rarity){
  const pool = POOL_BY_RARITY[rarity];
  return pool[randInt(pool.length)];
}

/* ------------- Summon operations ------------- */
// Standard single
function summonStandardOne(){
  const shards = getShards();
  if(shards < COST.standard1) { console.warn("Not enough shards"); return null; }
  setShards(shards - COST.standard1);

  // simple pity: increment and on hits > 50 guarantee a 4* (optional)
  let pity = getPityStandard();
  pity++;
  setPityStandard(pity);

  let rarity = rollByRates(RATES.standard);
  // optional pity rule: if pity >= 50 guarantee 4*
  if(pity >= 50 && rarity === 3){ rarity = 4; setPityStandard(0); }
  if(rarity >= 4) setPityStandard(0);

  const template = pickRandomFromPool(rarity);
  const inst = addCharacterInstance(template);
  console.log("Standard pull:", inst.name, inst.rarity);
  return inst;
}

// Standard 10x
function summonStandardTen(){
  const shards = getShards();
  if(shards < COST.standard10) { console.warn("Not enough shards for x10"); return null; }
  setShards(shards - COST.standard10);
  const results = [];
  for(let i=0;i<10;i++){
    const out = summonStandardOne();
    if(out) results.push(out);
  }
  return results;
}

// Advanced single
function summonAdvancedOne(){
  const adv = getAdvanced();
  if(adv < COST.advanced1){ console.warn("Not enough advanced stones"); return null; }
  setAdvanced(adv - COST.advanced1);

  // advanced has a separate pity counter
  let ap = getPityAdvanced();
  ap++;
  setPityAdvanced(ap);

  let rarity = rollByRates(RATES.advanced);
  // safety pity
  if(ap >= 30 && rarity === 3){ rarity = 4; setPityAdvanced(0); }
  if(rarity >= 4) setPityAdvanced(0);

  const template = pickRandomFromPool(rarity);
  const inst = addCharacterInstance(template);
  console.log("Advanced pull:", inst.name, inst.rarity);
  return inst;
}

// Advanced 10x (guarantee at least one 4*)
function summonAdvancedTen(){
  const adv = getAdvanced();
  if(adv < COST.advanced10){ console.warn("Not enough advanced stones for x10"); return null; }
  setAdvanced(adv - COST.advanced10);

  const results = [];
  for(let i=0;i<10;i++){
    results.push(summonAdvancedOne());
  }
  // ensure at least one 4* or 5*
  const has4 = results.some(r => r && r.rarity >= 4);
  if(!has4){
    // replace a random pull with a forced 4* pick
    const idx = randInt(10);
    const forcedTemplate = pickRandomFromPool(4);
    const forced = addCharacterInstance(forcedTemplate);
    results[idx] = forced;
    console.log("Advanced x10 guarantee applied: replaced index", idx, "with", forced.name);
  }
  return results;
}

/* ------------- Utility: human-friendly display helpers ------------- */
function stars(r){ return "★".repeat(r); }
function rarityColor(r){
  if(r === 5) return "#FFD700"; // gold
  if(r === 4) return "#B060FF"; // purple
  return "#4DA6FF"; // blue
}

/* ------------- UI convenience wrappers (call from index.html) ------------- */
/*
  The index.html should call the following functions for UI:
    doSummonStandard(count)   -> 1 or 10
    doSummonAdvanced(count)   -> 1 or 10
*/
function doSummonStandard(count){
  if(count === 1){
    const inst = summonStandardOne();
    if(inst) {
      showSummonResults([inst], "Standard Summon");
      return inst;
    }
  } else {
    const res = summonStandardTen();
    if(res) showSummonResults(res, "Standard Summon x10");
    return res;
  }
}
function doSummonAdvanced(count){
  if(count === 1){
    const inst = summonAdvancedOne();
    if(inst) { showSummonResults([inst], "Advanced Summon"); return inst; }
  } else {
    const res = summonAdvancedTen();
    if(res) showSummonResults(res, "Advanced Summon x10"); return res;
  }
}

/* ------------- Simple results UI injector (if index.html has #results) ------------- */
function showSummonResults(results, title){
  try {
    const box = document.getElementById("results");
    if(!box) return;
    box.innerHTML = `<h3>${title}</h3>`;
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gridTemplateColumns = "repeat(2, 1fr)";
    wrap.style.gap = "8px";
    results.forEach(r=>{
      const card = document.createElement("div");
      card.style.border = "2px solid " + rarityColor(r.rarity);
      card.style.padding = "8px";
      card.style.borderRadius = "8px";
      card.style.background = "rgba(255,255,255,0.02)";
      const skillNames = (r.skills || []).map(s=>s.name + ` (${s.type})`).join(" • ");
      card.innerHTML = `<strong style="color:${rarityColor(r.rarity)}">${stars(r.rarity)} ${r.name}</strong>
        <div class="small">Element: ${r.element}</div>
        <div class="small">Power: ${r.power}</div>
        <div style="margin-top:6px;font-size:13px">${skillNames}</div>`;
      wrap.appendChild(card);
    });
    box.appendChild(wrap);
    // quick toast: add shards/advanced display update if present in DOM
    refreshCurrencyUI();
  } catch(e){ console.error(e); }
}

/* ------------- Currency/UI helpers — update your index.html to show these values ------------- */
function refreshCurrencyUI(){
  const sEl = document.getElementById("shards");
  const gEl = document.getElementById("gold");
  const advEl = document.getElementById("advancedStones");
  if(sEl) sEl.textContent = getShards();
  if(gEl) gEl.textContent = parseInt(localStorage.getItem("gold")||"0",10);
  if(advEl) advEl.textContent = getAdvanced();
}

/* ------------- Initialization: ensure basic currency exists ------------- */
(function initDefaults(){
  if(localStorage.getItem(CURRENCIES.shardsKey) === null) setShards(120); // starter shards
  if(localStorage.getItem(CURRENCIES.advancedKey) === null) setAdvanced(6); // starter advanced stones
  if(localStorage.getItem("gold") === null) localStorage.setItem("gold", "200");
  refreshCurrencyUI();
})();

/* ------------- Expose functions to window so index.html can call them easily ------------- */
window.doSummonStandard = doSummonStandard;
window.doSummonAdvanced = doSummonAdvanced;
window.getOwnedChars = getOwnedChars;
window.refreshCurrencyUI = refreshCurrencyUI;
window.summonStandardOne = summonStandardOne;
window.summonAdvancedOne = summonAdvancedOne;

// End of gacha.js