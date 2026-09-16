import {
  Landmark,
  ShoppingBag,
  Globe,
  Heart,
  Check,
  X,
  MessageCircle,
  ArrowRight,
  Bell,
  ShieldAlert,
  CreditCard,
} from "lucide-react"
import type { IndustryDef } from "@/lib/oneix/types"

export const industryIcons: Record<IndustryDef["icon"], typeof Landmark> = {
  landmark: Landmark,
  "shopping-bag": ShoppingBag,
  globe: Globe,
  heart: Heart,
}

export { Check, X, MessageCircle, ArrowRight, Bell, ShieldAlert, CreditCard }
