const WEAPON_DEFS = [
  {
    id: 'pulse_cannon',
    name: 'Pulse Cannon',
    fireMode: 'projectile',
    damage: 1,
    shotsPerSecond: 6,
    projectileSpeed: 500,
    unlock: 'default',
  },
  {
    id: 'shotgun_blaster',
    name: 'Shotgun Blaster',
    fireMode: 'pellets',
    damage: 1,
    shotsPerSecond: 2,
    projectileSpeed: 450,
    pellets: 5,
    spreadRadians: Math.PI / 6,
    unlock: 'default',
  },
  {
    id: 'laser_beam',
    name: 'Laser Beam',
    fireMode: 'beam',
    damage: 3,
    energy: { max: 100, drainPerSecond: 20, regenPerSecond: 15, forcedCooldown: 1 },
    unlock: 'armory_access',
  },
  {
    id: 'seeker_missiles',
    name: 'Seeker Missiles',
    fireMode: 'homing',
    damage: 4,
    reloadSeconds: 1.2,
    projectileSpeed: 300,
    turnRateDegreesPerSecond: 180,
    targetRadius: 400,
    unlock: 'armory_access',
  },
];

function getWeaponDef(id) {
  return WEAPON_DEFS.find(weapon => weapon.id === id) || WEAPON_DEFS[0];
}
