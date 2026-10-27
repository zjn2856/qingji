import {
  Award, BookOpen, BriefcaseBusiness, ChartNoAxesCombined, Clapperboard, Clock3,
  Ellipsis, Gift, HeartPulse, House, Plane, ShoppingBag, ShoppingBasket, TrainFront, Utensils,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  'train-front': TrainFront,
  house: House,
  'shopping-basket': ShoppingBasket,
  clapperboard: Clapperboard,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  plane: Plane,
  ellipsis: Ellipsis,
  'briefcase-business': BriefcaseBusiness,
  'clock-3': Clock3,
  award: Award,
  'chart-no-axes-combined': ChartNoAxesCombined,
  gift: Gift,
};

export const ICON_CHOICES = Object.keys(icons);

export function CategoryIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const Icon = icons[icon] ?? Ellipsis;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}
