import { VenueSlug } from "./types";

export interface MenuItem {
  name: string;
  description?: string;
  price: number | string;
  note?: string;
}

export interface MenuSection {
  id: string;
  title: string;
  note?: string;
  items: MenuItem[];
}

export interface MenuGroup {
  id: "food" | "drinks";
  label: string;
  heading: string;
  subheading: string;
  sections: MenuSection[];
}

export interface VenueMenu {
  allergenNote: string;
  groups: MenuGroup[];
}

// Original illustrative menus written for this demo -- not copied from the
// venues' real menus. Matches each venue's real character (pub fare for
// Beach Road, heritage Mediterranean for The Tilbury, Bistro + Rosa's
// Italian for The Vicar) without reproducing anyone's actual dish list.
const beachRoadFood: MenuSection[] = [
  {
    id: "pub-classics",
    title: "Pub Classics",
    items: [
      { name: "Smash Burger", description: "double patty, cheese, pickles, burger sauce, fries", price: 22 },
      { name: "Chicken Parmigiana", description: "crumbed chicken, napoli, mozzarella, fries, salad", price: 25 },
      { name: "Beer Battered Fish & Chips", description: "market fish, tartare, lemon", price: 24 },
      { name: "Rump Steak", description: "300g, fries, salad, choice of sauce", price: 26 },
    ],
  },
  {
    id: "share",
    title: "To Share",
    items: [
      { name: "Loaded Nachos", description: "beef, cheese, jalapeños, sour cream, guac", price: 19 },
      { name: "Half Kilo Wings", description: "lemon pepper, BBQ or buffalo", price: 22 },
      { name: "Garlic Bread", price: 10 },
    ],
  },
];
const beachRoadDrinks: MenuSection[] = [
  {
    id: "on-tap",
    title: "On Tap",
    note: "Schooner",
    items: [
      { name: "Great Northern Mid", price: 8 },
      { name: "Balter XPA", price: 9 },
      { name: "Heaps Normal (non-alc)", price: 8 },
    ],
  },
  {
    id: "cocktails-br",
    title: "Cocktails",
    items: [
      { name: "Espresso Martini", price: 20 },
      { name: "Frozen Margarita", price: 18 },
      { name: "Aperol Spritz", price: 18 },
    ],
  },
];

const tilburyFood: MenuSection[] = [
  {
    id: "small-plates-tb",
    title: "Small Plates",
    note: "Designed to share",
    items: [
      { name: "Baby Beetroot & Burrata", description: "toasted hazelnut, aged balsamic", price: 24 },
      { name: "Spicy Snapper", description: "XO mussels, chilli, shallot", price: 32 },
      { name: "Cured Salumi Board", price: 28 },
    ],
  },
  {
    id: "mains-tb",
    title: "Mains",
    items: [
      { name: "12 Hour Slow Cooked Lamb Shoulder", description: "salsa verde, roasted vegetables", price: 42 },
      { name: "House Made Pappardelle", description: "braised beef ragu, parmesan", price: 34 },
      { name: "Grilled Barramundi", description: "charred lemon, salsa verde", price: 38 },
    ],
  },
];
const tilburyDrinks: MenuSection[] = [
  {
    id: "wine-tb",
    title: "Wine",
    items: [
      { name: "House Prosecco", price: "16 / 68" },
      { name: "Pinot Noir, Mornington Peninsula", price: "17 / 74" },
    ],
  },
  {
    id: "cocktails-tb",
    title: "Cocktails",
    items: [
      { name: "Negroni", price: 22 },
      { name: "Tilbury Spritz", price: 20 },
    ],
  },
];

const vicarBistro: MenuSection[] = [
  {
    id: "bistro-mains",
    title: "The Bistro",
    note: "Fresh, locally sourced, served for lunch and dinner 7 days",
    items: [
      { name: "Chicken Schnitzel", description: "rocket salad, fries, sauce of your choice", price: 20 },
      { name: "Chicken Parmigiana", description: "napoli, mozzarella, rocket salad, fries", price: 25 },
      { name: "$20 Rump Steak", description: "Tuesdays — mixed leaf salad, fries", price: 20 },
      { name: "Sunday Roast", description: "seasonal roast, house made Yorkshire pudding, seasoned veg, red wine jus", price: 28 },
    ],
  },
];
const rosasItalian: MenuSection[] = [
  {
    id: "rosas-shared",
    title: "Rosa's Italian Eatery",
    note: "Shared dishes, seasonal produce, curated wine list",
    items: [
      { name: "Burrata", description: "heirloom tomato, basil oil", price: 24 },
      { name: "House Made Gnocchi", description: "pumpkin, sage butter, parmesan", price: 32 },
      { name: "Wood Fired Pizza", description: "margherita or prosciutto", price: 26 },
    ],
  },
];
const vicarDrinks: MenuSection[] = [
  {
    id: "vicar-drinks",
    title: "Bar",
    items: [
      { name: "$7 House Beer & Wine", description: "Weekday members happy hour, 3-6pm", price: 7 },
      { name: "Saturday Cocktail Hour Jugs", price: 30 },
      { name: "Espresso Martini", price: 21 },
    ],
  },
];

export const VENUE_MENUS: Record<VenueSlug, VenueMenu | null> = {
  "beach-road": {
    allergenNote:
      "Our menu may contain allergens and is prepared in a kitchen that handles nuts, shellfish and gluten. Please let staff know of any dietary requirements.",
    groups: [
      { id: "food", label: "Food", heading: "From the kitchen", subheading: "Pub classics, served all day", sections: beachRoadFood },
      { id: "drinks", label: "Drinks", heading: "From the bar", subheading: "Cold beer, cocktails, happy hour daily", sections: beachRoadDrinks },
    ],
  },
  barrys: null, // accommodation, no food & drink menu of its own
  tilbury: {
    allergenNote:
      "Our menu may contain allergens and is prepared in a kitchen that handles nuts, shellfish and gluten. Please let staff know of any dietary requirements.",
    groups: [
      { id: "food", label: "Food", heading: "From the kitchen", subheading: "Italian-inspired Mediterranean, designed to share", sections: tilburyFood },
      { id: "drinks", label: "Drinks", heading: "From the bar", subheading: "Wine list, classic cocktails", sections: tilburyDrinks },
    ],
  },
  vicar: {
    allergenNote:
      "Our menu may contain allergens and is prepared in a kitchen that handles nuts, shellfish and gluten. Please let staff know of any dietary requirements.",
    groups: [
      { id: "food", label: "Food", heading: "The Bistro & Rosa's", subheading: "Hearty bistro fare, plus Rosa's Italian Eatery", sections: [...vicarBistro, ...rosasItalian] },
      { id: "drinks", label: "Drinks", heading: "From the bar", subheading: "Happy hour, cocktail hour, and a full wine list", sections: vicarDrinks },
    ],
  },
};
