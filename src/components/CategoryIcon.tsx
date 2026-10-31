import {
  Award, BookOpen, Bot, BriefcaseBusiness, ChartNoAxesCombined, ChefHat, Clapperboard,
  Clock3, Cookie, CupSoda, Ellipsis, FlaskConical, Gift, HandHeart, HeartPulse, House,
  Plane, Receipt, ShoppingBag, ShoppingBasket, ShoppingCart, Smartphone, TrainFront,
  Utensils, type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  utensils: Utensils,
  'chef-hat': ChefHat,
  'cup-soda': CupSoda,
  cookie: Cookie,
  'shopping-cart': ShoppingCart,
  'train-front': TrainFront,
  'book-open': BookOpen,
  bot: Bot,
  smartphone: Smartphone,
  house: House,
  'heart-pulse': HeartPulse,
  clapperboard: Clapperboard,
  gift: Gift,
  ellipsis: Ellipsis,
  award: Award,
  'flask-conical': FlaskConical,
  'briefcase-business': BriefcaseBusiness,
  'hand-heart': HandHeart,
  receipt: Receipt,
  'chart-no-axes-combined': ChartNoAxesCombined,
  'shopping-bag': ShoppingBag,
  'shopping-basket': ShoppingBasket,
  plane: Plane,
  'clock-3': Clock3,
};

export const ICON_CHOICES = Object.keys(icons);

export function CategoryIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const Icon = icons[icon] ?? Ellipsis;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />;
}
