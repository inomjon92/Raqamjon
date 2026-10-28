import type { GameDef } from './types'
import Fruits from './Fruits'
import Steps from './Steps'
import FlyAway from './FlyAway'
import Caterpillar from './Caterpillar'
import Mystery from './Mystery'
import Hexagon from './Hexagon'
import Wheel from './Wheel'
import Train from './Train'
import Garden from './Garden'
import Balloons from './Balloons'
import Scale from './Scale'
import Shop from './Shop'
import Memory from './Memory'
import Compare from './Compare'
import Daily from './Daily'
import Groups from './Groups'
import type { Op } from '../lib/levels'

export const GAMES: GameDef[] = [
  { id: 'daily', title: 'Kunlik sarguzasht', emoji: '🗺️', color: 'from-amber-300 to-orange-400', ins: 'ins_daily', Component: Daily },
  { id: 'fruits', title: 'Mevalarni sana', emoji: '🍎', color: 'from-rose-300 to-red-400', ins: 'ins_fruits', fromWorksheet: true, Component: Fruits },
  { id: 'steps', title: 'Uch qadam', emoji: '🐥', color: 'from-yellow-300 to-amber-400', ins: 'ins_steps', fromWorksheet: true, Component: Steps },
  { id: 'fly', title: 'Uchib ketdi!', emoji: '🦋', color: 'from-sky-300 to-blue-400', ins: 'ins_fly', fromWorksheet: true, Component: FlyAway },
  { id: 'caterpillar', title: 'Qurtcha', emoji: '🐛', color: 'from-lime-300 to-green-500', ins: 'ins_caterpillar', fromWorksheet: true, Component: Caterpillar },
  { id: 'groups', title: 'Qatorlar', emoji: '🍱', color: 'from-red-300 to-orange-500', ins: 'ins_groups', needs: '×', Component: Groups },
  { id: 'mystery', title: 'Sirli katak', emoji: '🎁', color: 'from-fuchsia-300 to-purple-500', ins: 'ins_mystery', fromWorksheet: true, Component: Mystery },
  { id: 'compare', title: 'Ochko‘z timsoh', emoji: '🐊', color: 'from-emerald-300 to-teal-500', ins: 'ins_compare', Component: Compare },
  { id: 'garden', title: 'Amallar bog‘i', emoji: '🌻', color: 'from-green-300 to-emerald-500', ins: 'ins_garden', fromWorksheet: true, Component: Garden },
  { id: 'hexagon', title: 'Asalari uyasi', emoji: '🐝', color: 'from-amber-200 to-yellow-400', ins: 'ins_hexagon', fromWorksheet: true, tasks: 6, Component: Hexagon },
  { id: 'wheel', title: 'Sehrli g‘ildirak', emoji: '🎡', color: 'from-cyan-300 to-sky-500', ins: 'ins_wheel', fromWorksheet: true, Component: Wheel },
  { id: 'train', title: 'Sonlar poyezdi', emoji: '🚂', color: 'from-orange-300 to-rose-400', ins: 'ins_train', fromWorksheet: true, tasks: 6, Component: Train },
  { id: 'balloons', title: 'Pufaklarni yor', emoji: '🎈', color: 'from-pink-300 to-rose-500', ins: 'ins_balloons', Component: Balloons },
  { id: 'scale', title: 'Tarozi', emoji: '⚖️', color: 'from-slate-300 to-indigo-400', ins: 'ins_scale', Component: Scale },
  { id: 'shop', title: 'Do‘kon', emoji: '🛒', color: 'from-violet-300 to-purple-500', ins: 'ins_shop', tasks: 6, Component: Shop },
  { id: 'memory', title: 'Juftini top', emoji: '🃏', color: 'from-indigo-300 to-blue-500', ins: 'ins_memory', tasks: 3, Component: Memory },
]

export const gameById = (id: string) => GAMES.find((g) => g.id === id)

/** Bolaning sozlamalariga mos o'yinlar ro'yxati. */
export const gamesFor = (ops: Op[]) => GAMES.filter((g) => !g.needs || ops.includes(g.needs))

/** Sinfni tugatish uchun barcha darajalari o'tilishi kerak bo'lgan o'yinlar. */
export const requiredGames = (ops: Op[]) => gamesFor(ops).filter((g) => g.id !== 'daily')
