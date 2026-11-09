import { boardFor, COLORS, getCard, mapTilesFor, VIETNAM_CITIES } from '@typhu/game-content';
import {
  buyBackQuote, cardChoices, currentPlayer, festivalTargets, flightTargets,
  liquidationQuote, purchaseLevelQuotes, purchaseQuote, rentFor, upgradeQuote, FLIGHT_FEE,
} from '@typhu/game-engine';
import type { GameState } from '@typhu/contracts';
import type { ServerMessage } from '@typhu/contracts/multiplayer';
import { roomActorId } from './room-bots';

const modelByCity = new Map(Object.values(VIETNAM_CITIES).map(city => [city.name, city.model]));
modelByCity.set('Kon Tum', 'kon-tum');
modelByCity.set('Vinh', 'vinh');

export function mobilePresentation(game: GameState) {
  const player = currentPlayer(game);
  const position = player.position;
  const map = mapTilesFor(game);
  const tiers = game.phase === 'purchase' ? purchaseLevelQuotes(game, position) : [];
  return {
    actorId: roomActorId(game),
    tiles: boardFor(game).map(tile => ({
      ...tile,
      color: game.boardId && map[tile.id]?.group !== undefined ? COLORS[map[tile.id].group!] : null,
      landmark: game.boardId ? map[tile.id]?.landmark : undefined,
      landmarkAsset: game.boardId && tile.kind === 'street' ? modelByCity.get(tile.name) : undefined,
      rent: game.properties[tile.id] ? rentFor(game, tile.id) : null,
    })),
    purchase: game.phase === 'purchase'
      ? (tiers.length ? tiers : [purchaseQuote(game, position)])
      : [],
    upgrades: game.phase === 'end' && game.properties[position]?.ownerId === player.id
      ? [1, 2, 3, 4, 5].slice(game.properties[position].level).map(level => upgradeQuote(game, position, level))
      : [],
    buyBack: game.phase === 'end' ? buyBackQuote(game, position) : null,
    flightTargets: player.flight === 'ready' && player.cash >= FLIGHT_FEE ? flightTargets(game) : [],
    flightFee: FLIGHT_FEE,
    festivalTargets: game.phase === 'festival' ? festivalTargets(game, player.id) : [],
    cardChoices: cardChoices(game),
    card: game.drawnCard?.revealed
      ? getCard(game.drawnCard.deck, game.drawnCard.cardId, game.boardId, game.boardLayout)
      : null,
    liquidation: game.debt ? liquidationQuote(game) : null,
  };
}

/** Selects the native response format. Seat tokens still authorize room access. */
export function wantsMobilePresentation(request: Request): boolean {
  return request.headers.get('x-typhu-client') === 'ios-v1';
}

export function mobileMessage(message: ServerMessage) {
  if ((message.type !== 'SESSION' && message.type !== 'ROOM_STATE') || !message.room.game)
    return message;
  return {
    ...message,
    room: { ...message.room, presentation: mobilePresentation(message.room.game) },
  };
}
