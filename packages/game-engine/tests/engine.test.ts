import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GameState, Property } from '@typhu/contracts';
import { BOARD } from '@typhu/game-content';
import { bankSupply, buildProblem, cityEvent, createGame, currentPlayer, netWorth, reduceGame, rentFor } from '../src/index';

const game = (mode: 'city' | 'classic' = 'classic') => createGame({ mode, seed: 123456, names: ['An', 'Bình', 'Chi', 'Dũng'] });
function own(state: GameState, id: number, ownerIndex = 0, patch: Partial<Property> = {}) { state.properties[id] = { ownerId: state.players[ownerIndex].id, level: 0, mortgaged: false, business: 'residence', ...patch }; }
function useCard(state: GameState) { return reduceGame(reduceGame(state, { type: 'DRAW_CARD' }), { type: 'RESOLVE_CARD' }); }
function cardFirst(state: GameState, deck: 'chance' | 'chest', cardId: string) { state.decks[deck] = [cardId, ...state.decks[deck].filter((id) => id !== cardId)]; }

test('initial state is reproducible, has 1500 per player and two shuffled decks', () => {
  const state = game(); assert.deepEqual(state, game());
  assert.ok(state.players.every((p) => p.cash === 1500 && p.position === 0));
  assert.equal(state.decks.chance.length, 16); assert.equal(state.decks.chest.length, 16);
  assert.notDeepEqual(state.decks.chance, createGame({ seed: 1 }).decks.chance);
});
test('purchase deducts the printed price, changes ownership and never mutates input', () => {
  const original = game(); const snapshot = structuredClone(original);
  const landed = reduceGame(original, { type: 'ROLL', dice: [1, 2] });
  assert.equal(landed.phase, 'purchase'); assert.equal(currentPlayer(landed).position, 3);
  const bought = reduceGame(landed, { type: 'BUY' });
  assert.equal(bought.players[0].cash, 1440); assert.equal(bought.properties[3].ownerId, 'player-1'); assert.equal(bought.phase, 'end');
  assert.deepEqual(original, snapshot);
});
test('a declined purchase goes to auction and the declining player can win', () => {
  let state = reduceGame(game(), { type: 'ROLL', dice: [1, 2] });
  state = reduceGame(state, { type: 'START_AUCTION' });
  state = reduceGame(state, { type: 'BID', amount: 10 });
  for (let i = 0; i < 3; i++) state = reduceGame(state, { type: 'PASS_BID' });
  assert.equal(state.phase, 'end'); assert.equal(state.auction, null); assert.equal(state.properties[3].ownerId, 'player-1'); assert.equal(state.players[0].cash, 1490);
});
test('an auction with no bids leaves the property unowned, invalid bids are rejected', () => {
  let state = reduceGame(reduceGame(game(), { type: 'ROLL', dice: [1, 2] }), { type: 'START_AUCTION' });
  assert.ok(reduceGame(state, { type: 'BID', amount: 1501 }).error);
  for (let i = 0; i < 4; i++) state = reduceGame(state, { type: 'PASS_BID' });
  assert.equal(state.phase, 'end'); assert.equal(state.properties[3], undefined);
});
test('passing GO pays 200 once; Free Parking pays nothing', () => {
  let state = game(); state.players[0].position = 39;
  state = reduceGame(state, { type: 'ROLL', dice: [2, 3] }); assert.equal(state.players[0].cash, 1530); // +200 GO, then 10% of 1700 cash
  state = game(); state.players[0].position = 15;
  state = reduceGame(state, { type: 'ROLL', dice: [2, 3] }); assert.equal(state.players[0].cash, 1500); assert.equal(state.phase, 'end');
});
test('complete color sets double bare-land rent and payments conserve money', () => {
  let state = game(); own(state, 1, 1); own(state, 3, 1);
  assert.equal(rentFor(state, 3), 8);
  state = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.equal(state.players[0].cash, 1492); assert.equal(state.players[1].cash, 1508);
});
test('railroad rent scales with the number owned, utility rent uses the dice', () => {
  const state = game(); own(state, 5); own(state, 15); assert.equal(rentFor(state, 5), 50);
  own(state, 25); own(state, 35); assert.equal(rentFor(state, 5), 200);
  own(state, 12); assert.equal(rentFor(state, 12, 7), 28);
  own(state, 28); assert.equal(rentFor(state, 12, 7), 70);
});
test('classic construction requires a full unmortgaged set and even development', () => {
  let state = game(); own(state, 1); assert.ok(buildProblem(state, 1)); own(state, 3);
  state = reduceGame(state, { type: 'BUILD', tileId: 1 }); assert.equal(state.properties[1].level, 1); assert.equal(state.players[0].cash, 1450);
  assert.ok(buildProblem(state, 1)); assert.equal(buildProblem(state, 3), null);
  state.properties[3].mortgaged = true; assert.ok(buildProblem(state, 3));
});
test('city permits two levels on an incomplete set and neighbouring opponents do not block mortgages', () => {
  let state = game('city'); own(state, 1); own(state, 3, 1, { level: 2 });
  state = reduceGame(state, { type: 'BUILD', tileId: 1 });
  state = reduceGame(state, { type: 'BUILD', tileId: 1 });
  assert.equal(state.properties[1].level, 2); assert.ok(buildProblem(state, 1));
  state.properties[1].level = 0;
  state = reduceGame(state, { type: 'MORTGAGE', tileId: 1 }); assert.equal(state.properties[1].mortgaged, true);
});
test('finite house/hotel supply is respected and hotel upgrade returns four houses', () => {
  let state = game(); own(state, 1, 0, { level: 4 }); own(state, 3, 0, { level: 4 });
  assert.deepEqual(bankSupply(state), { houses: 24, hotels: 12 });
  state = reduceGame(state, { type: 'BUILD', tileId: 1 });
  assert.equal(state.properties[1].level, 5); assert.deepEqual(bankSupply(state), { houses: 28, hotels: 11 });
});
test('mortgaged properties collect no rent; redeeming pays principal plus 10 percent', () => {
  let state = game(); own(state, 1);
  state = reduceGame(state, { type: 'MORTGAGE', tileId: 1 }); assert.equal(state.players[0].cash, 1530); assert.equal(rentFor(state, 1), 0);
  state = reduceGame(state, { type: 'UNMORTGAGE', tileId: 1 }); assert.equal(state.players[0].cash, 1497); assert.equal(state.properties[1].mortgaged, false);
});
test('Chance is drawn without applying it until acknowledgement, then cycles to the back', () => {
  let state = game(); cardFirst(state, 'chance', 'chance-08');
  state = reduceGame(state, { type: 'ROLL', dice: [3, 4] });
  assert.equal(state.phase, 'card'); assert.equal(state.players[0].cash, 1500); assert.equal(state.decks.chance.length, 15);
  state = useCard(state);
  assert.equal(state.players[0].cash, 1550); assert.equal(state.decks.chance.at(-1), 'chance-08'); assert.equal(state.drawnCard, null);
});
test('a movement card pays GO and can lead to another deck', () => {
  let state = game(); cardFirst(state, 'chance', 'chance-01');
  state = useCard(reduceGame(state, { type: 'ROLL', dice: [3, 4] }));
  assert.equal(state.players[0].position, 0); assert.equal(state.players[0].cash, 1700);
  state = game(); state.players[0].position = 29; cardFirst(state, 'chance', 'chance-10');
  state = useCard(reduceGame(state, { type: 'ROLL', dice: [3, 4] }));
  assert.equal(state.players[0].position, 33); assert.equal(state.drawnCard?.deck, 'chest'); assert.equal(state.phase, 'card');
});
test('jail-free cards stay out of the deck until used', () => {
  let state = game(); cardFirst(state, 'chance', 'chance-09');
  state = useCard(reduceGame(state, { type: 'ROLL', dice: [3, 4] }));
  assert.deepEqual(state.players[0].jailCards, ['chance']); assert.equal(state.decks.chance.length, 15);
  state.players[0].jailed = true; state.phase = 'roll';
  state = reduceGame(state, { type: 'USE_JAIL_CARD' });
  assert.equal(state.players[0].jailed, false); assert.equal(state.decks.chance.length, 16);
});
test('third consecutive double sends directly to the island and ends the extra rolls', () => {
  let state = game(); cardFirst(state, 'chest', 'chest-08');
  state = reduceGame(state, { type: 'ROLL', dice: [1, 1] }); state = useCard(state);
  state = reduceGame(state, { type: 'END_TURN' }); assert.equal(state.currentPlayer, 0);
  state = reduceGame(state, { type: 'ROLL', dice: [1, 1] }); state = reduceGame(state, { type: 'END_TURN' });
  state = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
  assert.equal(state.players[0].position, 10); assert.equal(state.players[0].jailed, true); assert.equal(state.extraRoll, false); assert.equal(state.phase, 'end');
});
test('island departure on doubles grants another roll', () => {
  let state = game(); state.players[0].jailed = true; state.players[0].position = 10;
  state = reduceGame(state, { type: 'ROLL', dice: [1, 1] });
  assert.equal(state.players[0].jailed, false); assert.equal(state.extraRoll, true); assert.equal(state.players[0].position, 12);
});
test('third failed island attempt is free and a landing card remains usable without bail debt', () => {
  let state = game(); state.players[0].jailed = true; state.players[0].position = 10; state.players[0].jailTurns = 2; state.players[0].cash = 0;
  cardFirst(state, 'chest', 'chest-08');
  state = reduceGame(state, { type: 'ROLL', dice: [3, 4] });
  assert.equal(state.phase, 'card'); assert.equal(state.debt, null);
  assert.equal(state.players[0].position, 17); assert.equal(state.players[0].cash, 0); assert.equal(state.players[0].jailed, false);
  state = useCard(state); assert.equal(state.error, null); assert.equal(state.phase, 'end');
});
test('partial rent is settled, and mortgaging automatically pays only the outstanding debt', () => {
  let state = game(); state.players[0].cash = 1; own(state, 3, 1); own(state, 12);
  state = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  assert.equal(state.debt?.amount, 3); assert.equal(state.players[1].cash, 1501);
  assert.ok(reduceGame(state, { type: 'END_TURN' }).error);
  assert.ok(reduceGame(state, { type: 'DECLARE_BANKRUPTCY' }).error);
  state = reduceGame(state, { type: 'MORTGAGE', tileId: 12 });
  assert.equal(state.debt, null); assert.equal(state.players[0].cash, 72); assert.equal(state.players[1].cash, 1504);
});
test('community payment can give a non-current player control to settle their own debt', () => {
  let state = game(); state.players[1].cash = 0; own(state, 1, 1); cardFirst(state, 'chest', 'chest-09');
  state = useCard(reduceGame(state, { type: 'ROLL', dice: [1, 1] }));
  assert.equal(state.debt?.debtorId, 'player-2');
  state = reduceGame(state, { type: 'MORTGAGE', tileId: 1 });
  assert.equal(state.debt, null); assert.equal(state.players[1].cash, 20); assert.equal(state.players[0].cash, 1530);
});
test('insolvent player transfers mortgaged assets to creditor and is skipped on subsequent turns', () => {
  let state = game(); own(state, 39, 1, { level: 5 }); own(state, 12, 0, { mortgaged: true }); state.players[0].cash = 1; state.players[0].position = 36;
  state = reduceGame(state, { type: 'ROLL', dice: [1, 2] });
  state = reduceGame(state, { type: 'DECLARE_BANKRUPTCY' });
  assert.equal(state.players[0].bankrupt, true); assert.equal(state.properties[12].ownerId, 'player-2'); assert.equal(state.properties[12].mortgaged, true);
  state = reduceGame(state, { type: 'END_TURN' }); assert.equal(state.currentPlayer, 1);
});
test('city business multipliers, neighbour bonuses and forecast are applied transparently', () => {
  const state = game('city'); own(state, 8, 0, { level: 1, business: 'cafe' }); own(state, 9, 1, { level: 1, business: 'residence' });
  assert.equal(rentFor(state, 8), 45); assert.equal(rentFor(state, 9), 35);
  own(state, 31, 0, { level: 1, business: 'hotel' }); assert.equal(rentFor(state, 31), 228);
  assert.equal(cityEvent(state).id, 'river-festival');
});
test('city round transition grants residence income, charges hotel upkeep, and changes event every two rounds', () => {
  let state = game('city'); own(state, 8, 0, { level: 2, business: 'residence' }); own(state, 11, 1, { level: 2, business: 'hotel' }); state.currentPlayer = 3; state.phase = 'end';
  state = reduceGame(state, { type: 'END_TURN' });
  assert.equal(state.round, 2); assert.equal(state.players[0].cash, 1516); assert.equal(state.players[1].cash, 1488); assert.equal(state.cityEventIndex, 0);
  state.currentPlayer = 3; state.phase = 'end'; state = reduceGame(state, { type: 'END_TURN' }); assert.equal(state.round, 3); assert.equal(state.cityEventIndex, 1);
});
test('city game stops after the full final round and uses net worth to choose its leader', () => {
  let state = game('city'); state.maxRounds = 4; state.round = 4; state.currentPlayer = 3; state.phase = 'end'; own(state, 39, 2);
  state = reduceGame(state, { type: 'END_TURN' }); assert.equal(state.phase, 'finished'); assert.equal(state.winnerId, 'player-3'); assert.equal(netWorth(state, 'player-3'), 1900);
});
test('trades exchange the exact assets and cash; built properties and invalid offers are rejected', () => {
  let state = game(); own(state, 1); own(state, 3, 1);
  const offer = { fromId: 'player-1', toId: 'player-2', giveTileId: 1, takeTileId: 3, giveCash: 50, takeCash: 0 };
  state = reduceGame(state, { type: 'TRADE', offer });
  assert.equal(state.properties[1].ownerId, 'player-2'); assert.equal(state.properties[3].ownerId, 'player-1'); assert.equal(state.players[0].cash, 1450); assert.equal(state.players[1].cash, 1550);
  assert.ok(reduceGame(state, { type: 'TRADE', offer }).error);
});
test('serialized state can resume the same seeded action sequence', () => {
  const state = game(); const saved = JSON.parse(JSON.stringify(state)) as GameState;
  assert.deepEqual(reduceGame(state, { type: 'ROLL' }), reduceGame(saved, { type: 'ROLL' }));
});
