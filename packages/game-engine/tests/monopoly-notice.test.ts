import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  boardFor,
  BOARD_EVENT_NOTICE_MS,
  PRESENTATION_BUFFER_MS,
  turnPresentationMs,
} from '@typhu/game-content';
import { createGame, reduceGame } from '../src';
import { newlyCompletedMonopolies } from '../src/monopoly-notice';
function fixture() {
  const s = createGame({
    boardId: 'vietnam-32',
    boardLayout: 'districts-v1',
    propertyRules: 'landing-v1',
    propertyPricing: 'business-tour-v2',
    victoryRules: 'business-tour-v1',
    names: ['An', 'Bình'],
    startingCash: 10000,
    seed: 42,
  });
  for (const id of [1, 2])
    s.properties[id] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  s.players[0].position = 3;
  s.phase = 'purchase';
  s.propertyVisit = { playerId: 'player-1', tileId: 3, ownerIdOnArrival: null, levelOnArrival: 0 };
  return s;
}
test('buying the final city publishes one shared MONOPOLY event; upgrading/rolling do not repeat it', () => {
  const before = fixture(),
    bought = reduceGame(before, { type: 'BUY', level: 1 });
  assert.equal(bought.error, null);
  assert.equal(bought.phase, 'end');
  const event = bought.lastBoardEvent;
  assert.ok(event && event.kind === 'monopoly');
  assert.deepEqual(event.monopolies, [{ playerId: 'player-1', group: 'red', tileIds: [1, 2, 3] }]);
  assert.equal(before.lastBoardEvent, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(bought)).lastBoardEvent, event);
  const upgraded = reduceGame(bought, { type: 'BUILD', tileId: 3, level: 2 });
  assert.equal(upgraded.error, null);
  assert.deepEqual(upgraded.lastBoardEvent, event);
  const rolled = reduceGame({ ...upgraded, phase: 'roll' }, { type: 'ROLL', dice: [1, 2] });
  assert.deepEqual(rolled.lastBoardEvent, event);
  assert.equal(turnPresentationMs(bought, {}), BOARD_EVENT_NOTICE_MS + PRESENTATION_BUFFER_MS);
  assert.equal(turnPresentationMs(upgraded, { boardEventId: event.id }), 0);
});
test('buyback and property gift announce the new owner, and rejected actions never announce', () => {
  const s = fixture();
  s.phase = 'end';
  s.properties[3] = { ownerId: 'player-2', level: 1, mortgaged: false, business: 'residence' };
  s.propertyVisit!.ownerIdOnArrival = 'player-2';
  s.propertyVisit!.levelOnArrival = 1;
  const bought = reduceGame(s, { type: 'BUY_BACK', tileId: 3 });
  assert.equal(bought.error, null);
  assert.equal(bought.lastBoardEvent?.kind, 'monopoly');
  assert.equal(bought.lastBoardEvent?.playerId, 'player-1');
  const gift = fixture();
  for (const id of [1, 2]) gift.properties[id].ownerId = 'player-2';
  gift.properties[3] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  gift.phase = 'card';
  gift.drawnCard = { deck: 'chance', cardId: 'chance-23', revealed: true };
  const given = reduceGame(gift, {
    type: 'RESOLVE_CARD',
    targetTileId: 3,
    targetPlayerId: 'player-2',
  });
  assert.equal(given.error, null);
  assert.equal(given.lastBoardEvent?.playerId, 'player-2');
  const poor = fixture();
  poor.players[0].cash = 0;
  const denied = reduceGame(poor, { type: 'BUY', level: 1 });
  assert.ok(denied.error);
  assert.equal(denied.lastBoardEvent, undefined);
});
test('losing then reclaiming a group announces again; a trade can complete groups for both players', () => {
  const s = fixture();
  s.properties[3] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  const lost = structuredClone(s);
  delete lost.properties[3];
  assert.deepEqual(newlyCompletedMonopolies(s, lost), []);
  assert.equal(newlyCompletedMonopolies(lost, s).length, 1);
  const trade = createGame({ names: ['A', 'B'], boardId: 'vietnam-32', seed: 42 });
  const board = boardFor(trade);
  const a = board.filter((t) => t.group === 'brown'),
    b = board.filter((t) => t.group === 'pink');
  for (const t of a)
    trade.properties[t.id] = {
      ownerId: 'player-2',
      level: 0,
      mortgaged: false,
      business: 'residence',
    };
  for (const t of b)
    trade.properties[t.id] = {
      ownerId: 'player-1',
      level: 0,
      mortgaged: false,
      business: 'residence',
    };
  trade.properties[a[0].id].ownerId = 'player-1';
  trade.properties[b[0].id].ownerId = 'player-2';
  const done = reduceGame(trade, {
    type: 'TRADE',
    offer: {
      fromId: 'player-1',
      toId: 'player-2',
      giveTileId: a[0].id,
      takeTileId: b[0].id,
      giveCash: 0,
      takeCash: 0,
    },
  });
  assert.equal(done.error, null);
  const e = done.lastBoardEvent;
  assert.ok(e?.kind === 'monopoly');
  assert.equal(e.monopolies.length, 2);
});
test('third-group victory retains its MONOPOLY event before final results', () => {
  const s = fixture();
  for (const t of boardFor(s).filter((t) => ['pink', 'yellow'].includes(t.group ?? '')))
    s.properties[t.id] = { ownerId: 'player-1', level: 1, mortgaged: false, business: 'residence' };
  const done = reduceGame(s, { type: 'BUY', level: 1 });
  assert.equal(done.phase, 'finished');
  assert.equal(done.winReason, 'triple-monopoly');
  assert.equal(done.lastBoardEvent?.kind, 'monopoly');
});
