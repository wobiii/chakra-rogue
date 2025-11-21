// --- Chakra Rogue Gacha System ---

// Character pool
const gachaPool = [
  { name: "Ryou Shadowborn", rarity: 5 },
  { name: "Kira Stormleaf", rarity: 4 },
  { name: "Jin Emberfist", rarity: 4 },
  { name: "Sora Mistveil", rarity: 3 },
  { name: "Taro Stonepaw", rarity: 3 }
];

// Rarity chances
const rates = {
  5: 1,   // 1%
  4: 9,   // 9%
  3: 90   // 90%
};

function rollRarity() {
  let r = Math.random() * 100;

  if (r < rates[5]) return 5;
  if (r < rates[5] + rates[4]) return 4;
  return 3;
}

function rollCharacter() {
  const rarity = rollRarity();
  const pool = gachaPool.filter(c => c.rarity === rarity);
  const result = pool[Math.floor(Math.random() * pool.length)];
  return result;
}

// Save pulled characters
function savePull(character) {
  let stored = JSON.parse(localStorage.getItem("characters")) || [];
  stored.push(character);
  localStorage.setItem("characters", JSON.stringify(stored));
}

// Summon 1 character
function summonOne() {
  const c = rollCharacter();
  savePull(c);
  return c;
}

// Summon 10 characters
function summonTen() {
  let results = [];
  for (let i = 0; i < 10; i++) {
    const c = summonOne();
    results.push(c);
  }
  return results;
}