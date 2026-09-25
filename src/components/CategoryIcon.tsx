import {
  Briefcase,
  FlaskConical,
  GraduationCap,
  HardHat,
  Headset,
  HeartPulse,
  Landmark,
  Laptop,
  Megaphone,
  ShoppingBag,
  Truck,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  "heart-pulse": HeartPulse,
  landmark: Landmark,
  flask: FlaskConical,
  wrench: Wrench,
  megaphone: Megaphone,
  utensils: Utensils,
  "hard-hat": HardHat,
  "graduation-cap": GraduationCap,
  truck: Truck,
  "shopping-bag": ShoppingBag,
  headset: Headset,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? Briefcase;
  return <Icon className={className} aria-hidden="true" />;
}
