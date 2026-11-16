const META_KEY = 'voidbreaker.meta';
const LEGACY_KEY = 'voidbreaker_highscore';
const DEFAULT_META = { shards: 0, unlocks: {}, bestWave: 0, bestScore: 0 };

const HANGAR_PURCHASE_LIMITS = {
  hull_reinforcement: 2,
  afterburner: 1,
  armory_access: 1,
  bonus_drop_rate: 1,
  head_start: 1,
};

function sanitizeCount(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sanitizeUnlocks(raw) {
  const unlocks = {};
  if (!raw || typeof raw !== 'object') return unlocks;

  const hull = Math.min(sanitizeCount(raw.hull_reinforcement), HANGAR_PURCHASE_LIMITS.hull_reinforcement);
  if (hull > 0) unlocks.hull_reinforcement = hull;

  const oneTime = ['afterburner', 'armory_access', 'bonus_drop_rate', 'head_start'];
  for (const key of oneTime) {
    const value = raw[key];
    if (value === true || sanitizeCount(value) > 0) unlocks[key] = true;
  }

  return unlocks;
}

function sanitizeMeta(raw) {
  const profile = {
    shards: 0,
    unlocks: {},
    bestWave: 0,
    bestScore: 0,
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return profile;

  profile.shards = sanitizeCount(raw.shards);
  profile.bestWave = sanitizeCount(raw.bestWave);
  profile.bestScore = sanitizeCount(raw.bestScore);
  profile.unlocks = sanitizeUnlocks(raw.unlocks);
  return profile;
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('Storage read unavailable:', e.message);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('Storage write unavailable:', e.message);
    return false;
  }
}

function loadMeta() {
  const raw = readStorage(META_KEY);

  if (raw === null) {
    const legacyRaw = readStorage(LEGACY_KEY);
    const legacy = sanitizeCount(legacyRaw);
    const migrated = sanitizeMeta({ bestScore: legacy });
    writeStorage(META_KEY, JSON.stringify(migrated));
    return migrated;
  }

  try {
    return sanitizeMeta(JSON.parse(raw));
  } catch (e) {
    console.warn('Corrupt meta profile reset to defaults:', e.message);
    return sanitizeMeta(null);
  }
}

function saveMeta(profile) {
  return writeStorage(META_KEY, JSON.stringify(sanitizeMeta(profile)));
}
