import { MAP_TILES } from './board-layout';
import type { Surface } from '../vietnam/miniature';

// Identity is attached to the city, independently of the chosen demo upgrade level.
const cities = new Map(
  MAP_TILES.filter((tile) => tile.kind === 'city').map((tile) => [tile.name, tile]),
);
export type CityBuilding =
  | { kind: 'house'; group: number; level: number; key: string }
  | { kind: 'landmark'; group: number; model: string; name: string; key: string };
export function resolveCityBuilding(city: string, level: number): CityBuilding | null {
  const tile = cities.get(city);
  if (!tile || tile.group === undefined || !tile.model || !tile.landmark)
    throw new Error('Unknown city building: ' + city);
  if (!Number.isInteger(level) || level < 0 || level > 5) throw new Error('Invalid building level');
  if (level === 0) return null;
  return level === 5
    ? {
        kind: 'landmark',
        group: tile.group,
        model: tile.model,
        name: tile.landmark,
        key: `landmark:${tile.model}`,
      }
    : { kind: 'house', group: tile.group, level, key: `house:${tile.group}:${level}` };
}
const BASE: Record<Surface, string> = {
  wall: '#f5c567',
  roof: '#c14827',
  trim: '#fff0ce',
  glass: '#096b81',
  gold: '#f3ad14',
  wood: '#8b431d',
  green: '#288c4b',
  water: '#20bdcc',
};
// Material colours follow the v2 artwork: red-orange tiles, jade, gold and teal glass.
// Stone, sailcloth and the dark museum retain their distinct, quieter materials.
const LANDMARK_COLORS: Record<string, Partial<Record<Surface, string>>> = {
  temple: { wall: '#f3bc3f', roof: '#00644e', wood: '#a53015', glass: '#184d3d' },
  villa: { wall: '#e9ac40', roof: '#bd3d23', glass: '#07695f' },
  khmer: { wall: '#e5ae35', roof: '#c54421', gold: '#ffb311' },
  hats: { wall: '#c4a16a', trim: '#f2dbab', glass: '#265666', wood: '#3e4c43', roof: '#c85f3e' },
  sail: { trim: '#f5e6cb', gold: '#d9c8a5' },
  coffee: { wall: '#c8893c', roof: '#403632', wood: '#74411d', trim: '#b67d3e', glass: '#51351e' },
  rong: { wall: '#a3682e', roof: '#d99b27', wood: '#6e421f', trim: '#b48240', glass: '#3b2a18' },
  cham: { roof: '#be441d', wall: '#c7552b', wood: '#683216' },
  lotus: { wall: '#e58f72', trim: '#ffe1b8', glass: '#226d7a', wood: '#315658' },
  'water-tower': { wall: '#ddb365', roof: '#c34822', trim: '#ffe7b4' },
  imperial: {
    wall: '#a69f90',
    roof: '#00644b',
    gold: '#ffb20c',
    wood: '#a83d18',
    glass: '#3b2d1e',
  },
  dragon: { wall: '#b4ad9c', trim: '#f4e8cd', gold: '#ed9e0b', glass: '#392719' },
  bridge: {
    wall: '#aaa18f',
    roof: '#ba3f25',
    wood: '#573320',
    trim: '#b8ae9c',
    glass: '#35271d',
    gold: '#d3a14f',
  },
  gate: { wall: '#aaa293', roof: '#c04b28', wood: '#623a22', glass: '#382a1d', trim: '#d4cbb8' },
  church: { wall: '#b94a26', roof: '#df6b31', wood: '#67321b' },
  pagoda: { wall: '#f3c86a', roof: '#c33f22', wood: '#a0331c' },
  museum: {
    roof: '#4b5d69',
    wall: '#263544',
    glass: '#ffffff',
    trim: '#e0ceb0',
    wood: '#1c242a',
    gold: '#906a29',
  },
  theater: { wall: '#f4c25c', roof: '#374b60', trim: '#fff0cd' },
  turtle: { wall: '#c7b391', roof: '#cf4925', wood: '#63543e', trim: '#e3d0ad', water: '#3c9ea7' },
  market: {
    wall: '#efb449',
    roof: '#c44424',
    trim: '#f3dfb7',
    glass: '#294b4e',
    wood: '#303b32',
    green: '#fff6dc',
    gold: '#245365',
  },
};
export function landmarkColors(model: string): Record<Surface, string> {
  if (!LANDMARK_COLORS[model]) throw new Error('Unknown landmark palette: ' + model);
  return { ...BASE, ...LANDMARK_COLORS[model] };
}
