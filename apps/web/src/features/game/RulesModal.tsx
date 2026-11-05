import type { GameState } from '@typhu/contracts';
import { boardFor } from '@typhu/game-content';
import {
  Banknote,
  BookOpen,
  Building2,
  ChevronDown,
  Coins,
  Dices,
  House,
  Map,
  Plane,
  Sparkles,
  TreePalm,
  Trophy,
  Users,
} from 'lucide-react';
import { InfoRoomDialog } from './InfoRoomDialog';
import { rulesContent } from './rules-content';
import './rules.css';

const ruleIcons = {
  turn: Dices,
  build: House,
  rent: Coins,
  cards: Sparkles,
  festival: Building2,
  flight: Plane,
  island: TreePalm,
  money: Banknote,
  win: Trophy,
};

export function RulesModal({ onClose, game }: { onClose: () => void; game: GameState }) {
  return (
    <InfoRoomDialog
      title="Luật chơi"
      icon={<BookOpen size={18} />}
      onClose={onClose}
      className="rules-modal"
    >
      <div className="rules-game-info">
        <span>
          <Map size={14} aria-hidden="true" />
          {boardFor(game).length} ô
        </span>
        <span>
          <Users size={14} aria-hidden="true" />
          {game.players.length} người
        </span>
        <span>{game?.mode === 'city' ? 'Thành phố sống' : 'Cổ điển'}</span>
      </div>
      <div className="rules-scroll-frame">
        <div className="rules-sections" aria-label="Các mục luật chơi" tabIndex={0}>
          {rulesContent(game).map((section, index) => {
            const Icon = ruleIcons[section.id as keyof typeof ruleIcons];
            return (
              <details className="rules-section" key={section.id} open={index === 0}>
                <summary>
                  <span className="rules-section-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <strong>{section.title}</strong>
                  <ChevronDown className="rules-chevron" size={17} aria-hidden="true" />
                </summary>
                <div className="rules-section-copy">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </InfoRoomDialog>
  );
}
