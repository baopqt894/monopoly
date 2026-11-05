import {
  Accessibility,
  Bike,
  Diamond,
  Dumbbell,
  Flower2,
  Leaf,
  Sailboat,
  ShoppingBasket,
  Smartphone,
  BookOpen,
  CircleDot,
  Sun,
  Wheat,
} from 'lucide-react';

export function Token({ token, size = 18 }: { token: string; size?: number }) {
  const Icon =
    {
      leaf: Leaf,
      sun: Sun,
      diamond: Diamond,
      sailboat: Sailboat,
      'street-rider': Bike,
      creator: Smartphone,
      gymmer: Dumbbell,
      wibu: BookOpen,
      pickleball: CircleDot,
      cyclo: Bike,
      'buffalo-boy': Wheat,
      vendor: ShoppingBasket,
      'xe-om': Bike,
      'star-vendor': Accessibility,
      'ao-dai': Flower2,
    }[token] ?? Leaf;
  return <Icon size={size} strokeWidth={2} />;
}
