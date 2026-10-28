import { useMemo } from 'react'
import type { GameApi } from './types'
import Fruits from './Fruits'
import Caterpillar from './Caterpillar'
import Mystery from './Mystery'
import Garden from './Garden'
import Balloons from './Balloons'
import Compare from './Compare'
import FlyAway from './FlyAway'
import Wheel from './Wheel'
import Scale from './Scale'

const MIX = [Fruits, Caterpillar, Mystery, Garden, Balloons, Compare, FlyAway, Wheel, Scale]

/** 14-o'yin: kunlik sarguzasht — har topshiriqda boshqa o'yin. */
export default function Daily({ api }: { api: GameApi }) {
  const Game = useMemo(() => MIX[(api.index + new Date().getDate()) % MIX.length], [api.index])
  return <Game api={api} />
}
