import {
  MapPin, Trees, Shield, Home, Star, Clock, TrendingUp, Heart,
  Gem, Mountain, Waves, Sun, Building2, Car, Leaf, Award,
  CheckCircle, Target, Zap, Users, Eye, Lock, Compass, Globe,
  Ruler, Landmark, Palmtree, Fence, Droplets, Wind, Sparkles,
  Trophy, Umbrella, Wifi, ParkingCircle, Dumbbell, Baby,
  Dog, Bike, Coffee, ShoppingBag, GraduationCap, Stethoscope,
  Plane, Ship, Train, Bus, Footprints, Camera, Music, Palette,
  BookOpen, Lightbulb, Hammer, Wrench, Key, DoorOpen, Banknote,
  PiggyBank, Calculator, BarChart3, ArrowUpRight, CircleDollarSign,
  HandshakeIcon, Scale, FileCheck, Megaphone, Phone, Mail,
  MessageCircle, Calendar, Bell, Gift, Percent, Crown, Diamond,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  MapPin, Trees, Shield, Home, Star, Clock, TrendingUp, Heart,
  Gem, Mountain, Waves, Sun, Building2, Car, Leaf, Award,
  CheckCircle, Target, Zap, Users, Eye, Lock, Compass, Globe,
  Ruler, Landmark, Palmtree, Fence, Droplets, Wind, Sparkles,
  Trophy, Umbrella, Wifi, ParkingCircle, Dumbbell, Baby,
  Dog, Bike, Coffee, ShoppingBag, GraduationCap, Stethoscope,
  Plane, Ship, Train, Bus, Footprints, Camera, Music, Palette,
  BookOpen, Lightbulb, Hammer, Wrench, Key, DoorOpen, Banknote,
  PiggyBank, Calculator, BarChart3, ArrowUpRight, CircleDollarSign,
  Handshake: HandshakeIcon, Scale, FileCheck, Megaphone, Phone, Mail,
  MessageCircle, Calendar, Bell, Gift, Percent, Crown, Diamond,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Star;
}

export default iconMap;
