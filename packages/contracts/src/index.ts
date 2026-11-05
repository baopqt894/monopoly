export type TileKind = 'go' | 'street' | 'railroad' | 'utility' | 'chance' | 'chest' | 'tax' | 'jail' | 'parking' | 'airport';
export type ColorGroup = 'brown' | 'sky' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'blue';
export type Business = 'residence' | 'cafe' | 'hotel';
export type WinReason = 'side-monopoly' | 'triple-monopoly' | 'resort-monopoly' | 'bankruptcy' | 'accept-winnings' | 'capital' | 'time-limit';
export type MatchDurationMinutes = 15 | 30 | 45 | 60;
export type GameMode = 'city' | 'classic';
export type DeckKind = 'chance' | 'chest';
export type PropertyEventKind = 'earthquake' | 'fire' | 'forced-sale' | 'power-outage';

export interface BoardTile {
  id: number;
  name: string;
  subtitle?: string;
  resort?: boolean;
  kind: TileKind;
  group?: ColorGroup;
  price?: number;
  rents?: readonly number[];
  buildCost?: number;
  tax?: number;
}

export type CardEffect =
  | { type: 'money'; amount: number }
  | { type: 'each'; amount: number }
  | { type: 'move'; destination: number }
  | { type: 'move-special'; destination: 'festival-corner' | 'airport' | 'festival-city' | 'tax' }
  | { type: 'gift-property' }
  | { type: 'back'; steps: number }
  | { type: 'nearest'; kind: 'railroad' | 'utility' }
  | { type: 'jail' }
  | { type: 'jail-free' }
  | { type: 'repairs'; house: number; hotel: number }
  | { type: 'property-event'; event: PropertyEventKind };

export interface GameCard { id: string; title: string; description: string; effect: CardEffect }
export interface CityEvent { id: string; name: string; description: string; groups: readonly ColorGroup[]; multiplier: number }
export interface Player { id: string; name: string; color: string; token: string; cash: number; position: number; jailed: boolean; jailTurns: number; jailCards: DeckKind[]; bankrupt: boolean; flight?: 'waiting' | 'ready'; completedLaps?: number }
export interface PropertyVisit { playerId: string; tileId: number; ownerIdOnArrival: string | null; levelOnArrival: number; decisionTaken?: boolean }
export interface PawnMovement { id: number; playerId: string; path: number[]; mode?: 'walk' | 'flight' | 'card'; rollId?: number }
/** Authoritative cash changes, retained separately from the final balance for ordered presentation. */
export interface CashEvent {
  id: number;
  reason: string;
  changes: { playerId: string; amount: number; balance: number }[];
  trigger?: { movementId: number; at: 'step' | 'arrival'; stepIndex?: number };
}
export interface Property { ownerId: string; level: number; mortgaged: boolean; business: Business; disabledLaps?: number }
export interface LogEntry { id: number; round: number; message: string; kind: 'info' | 'money' | 'property' | 'event'; propertyChange?: { tileId: number; kind: 'destroy' | 'sell' } }
export interface Auction { tileId: number; bidderIndex: number; highestBid: number; highestBidderId: string | null; passed: string[] }
export interface Debt { id?: number; selectedTileIds?: number[]; debtorId: string; amount: number; creditorId: string | null; reason: string }
export interface Payment { fromId: string; toId: string | null; amount: number; reason: string }
export interface TradeOffer { fromId: string; toId: string; giveTileId: number | null; takeTileId: number | null; giveCash: number; takeCash: number }

export interface GameState {
  version: 1;
  boardId?: 'vietnam-32';
  mode: GameMode;
  startingCash?: number;
  goSalary?: number;
  eventTileCount?: number;
  eventTileIds?: number[];
  /** Legacy names for random event tiles, never the single hosted festival. */
  festivalTileCount?: number;
  festivalTileIds?: number[];
  /** Single active hosted festival, separate from random event tiles. */
  festivalTileId?: number | null;
  /** Global number of festival hosting choices; each adds the configured festivalIncrement. */
  festivalLevel?: number;
  festivalIncrement?: 0.25 | 0.5;
  players: Player[];
  currentPlayer: number;
  /** Original starting index; absent in older rooms, whose rounds start at index 0. */
  startingPlayer?: number;
  /** Explicit opt-in; absent means preserve the existing property's rules. */
  propertyRules?: 'landing-v1';
  /** Server-created landing context; cleared on movement and turn completion. */
  propertyVisit?: PropertyVisit;
  properties: Record<number, Property>;
  phase: 'roll' | 'purchase' | 'card' | 'auction' | 'festival' | 'end' | 'finished';
  dice: [number, number];
  /** Authoritative accepted roll event, including attempts that do not move a pawn. */
  lastRoll?: { id: number; playerId: string };
  doubles: number;
  extraRoll: boolean;
  /** Landing from a paid flight leaves the ordinary dice roll available this turn. */
  flightRollPending?: boolean;
  /** Server automatically rolls when continuing after a flight; doubles wait for input. */
  automaticRoll?: boolean;
  round: number;
  maxRounds: number;
  turnsInRound: number;
  seed: number;
  decks: Record<DeckKind, string[]>;
  drawnCard: { deck: DeckKind; cardId: string; revealed?: boolean } | null;
  /** Public reveal event retained after resolution so every client can show the card. */
  lastRevealedCard?: { id: number; playerId: string; deck: DeckKind; cardId: string };
  /** Public presentation events authored by the engine, shared with every seat. */
  lastBoardEvent?: { id: number; playerId: string; tileId: number; kind: 'airport-arrival' } | { id: number; playerId: string; tileId: number; kind: 'monopoly'; monopolies: { playerId: string; group: ColorGroup; tileIds: number[] }[] };
  movement?: PawnMovement;
  cashEvents?: CashEvent[];
  auction: Auction | null;
  debt: Debt | null;
  pendingPayments: Payment[];
  log: LogEntry[];
  nextLogId: number;
  cityEventIndex: number;
  winnerId: string | null;
  /** Complete districts placed within half-sides; absent preserves the original positions. */
  boardLayout?: 'districts-v1';
  propertyPricing?: 'level-one-included' | 'business-tour-v1' | 'business-tour-v2';
  liquidationRules?: 'full-value-v1';
  victoryRules?: 'business-tour-v1';
  winReason?: WinReason;
  /** Authenticated voluntary departures; a disconnected player is not a departed player. */
  departedPlayerIds?: string[];
  error: string | null;
}

export type GameAction =
  | { type: 'ROLL'; dice?: [number, number] }
  | { type: 'BUY'; level?: number }
  | { type: 'BUY_BACK'; tileId: number }
  | { type: 'SKIP_PURCHASE' }
  | { type: 'FLY'; tileId: number }
  | { type: 'START_AUCTION' }
  | { type: 'BID'; amount: number }
  | { type: 'PASS_BID' }
  | { type: 'RESOLVE_CARD'; targetTileId?: number; targetPlayerId?: string }
  | { type: 'HOST_FESTIVAL'; tileId: number }
  | { type: 'SKIP_FESTIVAL' }
  | { type: 'DRAW_CARD' }
  | { type: 'END_TURN' }
  | { type: 'BUILD'; tileId: number; business?: Business; level?: number }
  | { type: 'SET_LIQUIDATION_SELECTION'; tileIds: number[] }
  | { type: 'LIQUIDATE_SELECTED' }
  /** Internal timeout/bot action; rejected by the public room action allowlist. */
  | { type: 'AUTO_LIQUIDATE' }
  /** Server-only airport timeout: discard the ticket and roll atomically. */
  | { type: 'SKIP_FLIGHT' }
  | { type: 'SELL_BUILDING'; tileId: number }
  | { type: 'MORTGAGE'; tileId: number }
  | { type: 'UNMORTGAGE'; tileId: number }
  | { type: 'PAY_BAIL' }
  | { type: 'USE_JAIL_CARD' }
  | { type: 'DECLARE_BANKRUPTCY' }
  | { type: 'TRADE'; offer: TradeOffer };

export interface NewGameOptions { boardLayout?: 'districts-v1'; propertyPricing?: 'level-one-included' | 'business-tour-v1' | 'business-tour-v2'; liquidationRules?: 'full-value-v1'; victoryRules?: 'business-tour-v1'; boardId?: 'vietnam-32'; names?: string[]; mode?: GameMode; seed?: number; maxRounds?: number; startingCash?: number; goSalary?: number; festivalIncrement?: 0.25 | 0.5; eventTileCount?: number; festivalTileCount?: number; startingPlayer?: number; propertyRules?: 'landing-v1' }
