import type { PrintItem, PrintPieceDoc, PrintSection } from "../types";

// Starting content for The Tilbury's four printed pieces, transcribed from
// the venue's print-ready PDFs (Dining A4, A5 bar booklet, Shared Set Menu,
// Dessert menu). Wording is kept exactly as printed.

let seq = 0;
const k = (p: string) => `${p}${++seq}`;

function item(name: string, description: string, price: string, dietary: string[] = [], note?: string): PrintItem {
  return { key: k("i"), name, description, price, dietary, ...(note ? { note } : {}) };
}

function section(title: string, items: PrintItem[], extra: Partial<PrintSection> = {}): PrintSection {
  return { key: k("s"), title, items, ...extra };
}

const ALLERGY_FOOTER =
  "We will do our best to accommodate any allergies, however The Tilbury Hotel does not operate in an allergen free kitchen.\nA 1.4% processing fee applies to all cards. A 10% surcharge applies on Sundays and 15% on Public Holidays";

const dir = "/assets/menu-print/tilbury";

// ---------------------------------------------------------------- Dining
const dining: PrintPieceDoc = {
  version: "Winter 2026",
  pages: [
    { key: "cover", label: "Cover", kind: "art", background: { imageUrl: `${dir}/dining/cover.jpg` }, sections: [] },
    {
      key: "menu",
      label: "Menu",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/dining/menu.png` },
      footer:
        "We will do our best to accommodate any allergies, however The Tilbury Hotel does not operate in an allergen free kitchen\nA 1.4% processing fee applies to all cards. A 10% surcharge applies on Sundays and 15% on Public Holidays\nA 5% service charge applies to groups of 8 or more. All seafood items on our menu is Australian sourced.",
      footerAlign: "left",
      sections: [
        section("snacks", [
          item("HOUSE FOCACCIA", "grape tomato, aged balsamic & EVOO", "8", ["V"]),
          item("SICILIAN OLIVES", "chilli, rosemary & orange", "8", ["VG", "GF", "DF"]),
          item("SYDNEY ROCK OYSTERS", "champagne mignonette", "7ea   1/2 Doz 30   Doz 60", ["GF", "DF"]),
          item("WHIPPED MEREDITH GOAT’S CHEESE", "warm house-baked pretzel, orange blossom honey & pistachio", "20", ["V", "N"]),
          item("BEEF RAGÙ ARANCINI", "bocconcini, roasted tomato sugo & zucchini pickles (2ea)", "16"),
          item("CRISPY TUNA TACO", "yellowfin tuna, avocado, tobiko & yuzu kosho aioli (2ea)", "16"),
        ]),
        section("starters", [
          item("BURRATA", "pistachio pesto, golden olive oil-fried sourdough", "20", ["V", "N"]),
          item("KINGFISH CRUDO", "burnt orange dressing, green olive, fennel & Espelette pepper", "24", ["GF", "DF"]),
          item("HIBACHI OCTOPUS", "romesco, olive & tomato salsa, lemon oil", "26", ["GF", "DF"]),
          item("KING PRAWNS XO", "butter, charred lemon", "28", ["GF"]),
          item("ROASTED BUTTERNUT PUMPKIN", "charred corn salsa, feta & pumpkin seeds", "22", ["V", "GF"]),
        ]),
        section("mains", [
          item("PAPPARDELLE", "overnight beef ragù, Parmigiano Reggiano", "34"),
          item("PORK AND FREGOLA STUFATO", "slow-braised pork, fregola, cannellini beans, tomato sugo & Parmigiano", "34"),
          item("VICTOR CHURCHILL PORK & FENNEL BANGER & MASH", "buttery potato purée, braised shallots, charred savoy cabbage & onion gravy", "36"),
          item("MAFALDA", "king prawns, preserved lemon & lobster broth", "38"),
          item("GNOCCHI", "wild mushrooms, porcini butter, thyme & roasted hazelnuts", "34", ["V", "N"]),
        ]),
        section(
          "from the hibachi grill",
          [
            item("HALF BANNOCKBURN FREE-RANGE CHICKEN", "‘nduja butter & green olive chimichurri", "40", ["GF"]),
            item("SOUTH COAST SWORDFISH", "fennel & citrus salad, salsa verde", "42", ["GF", "DF"]),
            item("O’CONNOR PREMIUM ANGUS SIRLOIN", "220g potato pavé & red wine jus", "45", ["GF"]),
            item("MACKA’S RESERVE BLACK ANGUS EYE FILLET", "potato pavé & red wine jus", "180g 52 / 250g 58", ["GF"]),
            item("TASMANIAN FREE-RANGE LAMB BACKSTRAP", "pea purée, braised leek, golden raisins & red wine jus", "48", ["GF"]),
          ],
          { subtitle: "All proteins are hibachi-grilled over Japanese binchotan charcoal and served with fresh lemon." }
        ),
        section("sides", [
          item("SHOESTRING CHIPS", "nori salt", "14", ["V", "DF"]),
          item("MIXED MUSHROOMS", "smoked yoghurt & hazelnut", "18", ["V", "GF"]),
          item("RADICCHIO SALAD", "pear, walnut & pecorino", "15", ["V", "GF", "N"]),
        ]),
        section("desserts", [
          item("GELATO & SORBET SELECTION", "vanilla, chocolate, pistachio or lemon sorbet", "10"),
          item("BASQUE CHEESECAKE BRÛLÉE", "burnt cheesecake & Amarena cherries", "18", ["V"]),
          item("HOUSE-BAKED STICKY DATE PUDDING", "dulce de leche, pistachio crumb & vanilla gelato", "15", ["V", "N"]),
        ]),
      ],
    },
  ],
};

// ------------------------------------------------------------------- Bar
const priceCols3 = ["150ml", "250ml", "BTL"];

const bar: PrintPieceDoc = {
  version: "Winter 2026",
  pages: [
    {
      key: "whats-on",
      label: "What’s on",
      kind: "content",
      align: "center",
      background: { color: "#FFFFFF", imageUrl: `${dir}/bar/whats-on.png` },
      title: "what’s on",
      titleAlign: "center",
      contentTop: 6,
      footer: ALLERGY_FOOTER,
      footerAlign: "center",
      sections: [
        section("HAPPY HOUR", [item("$7 Selected Beer & Wine", "", ""), item("Monday-Friday 4pm-6pm", "", "")]),
        section("PASTA & WINE from TUESDAY", [
          item("All pastas served with a complimentary glass of wine", "", ""),
          item("$30 Pasta of the Month served with a complimentary glass of wine", "", ""),
        ]),
        section("MARGARITA FRIDAYS", [item("$15 Classic and Spicy Margaritas", "", ""), item("4pm-8pm", "", ""), item("DJs from 4pm", "", "")]),
        section("SATURDAY", [item("DJs from 3pm", "", "")]),
        section("SUNDAY ROAST", [item("from 12pm, $12 Guinness all day", "", ""), item("Live Music", "", "")]),
      ],
    },
    { key: "cover-bites", label: "Cover · Bar Bites", kind: "art", background: { imageUrl: `${dir}/bar/cover-bites.jpg` }, sections: [] },
    {
      key: "bites",
      label: "Bar bites",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/bar/bites.png` },
      footer: `(V) Vegetarian (VG) Vegan (GF) Gluten Friendly (DF) Dairy Friendly (N) Contains Nuts\n${ALLERGY_FOOTER}\nAll seafood items on our menu is Australian sourced.`,
      footerAlign: "center",
      sections: [
        section("snacks", [
          item("SYDNEY ROCK OYSTERS (East33, Merimbula)", "", "7 each / 32 half dozen / 60 dozen", [], "champagne mignonette (GF, DF)"),
          item("SICILIAN OLIVES", "chilli, rosemary, orange", "8", ["VG", "GF", "DF"]),
          item("HOUSE-ROASTED SPICY NUTS", "", "8", ["VG", "GF", "DF", "N"]),
          item("SHOESTRING FRIES", "nori sea salt", "14", ["VG", "GF", "DF"]),
          item("WHIPPED MEREDITH GOAT’S CHEESE", "", "20", [], "warm house-baked pretzel, orange blossom honey & pistachio (V, N)"),
          item("BEEF RAGÙ ARANCINI", "bocconcini, roasted tomato sugo & zucchini pickles (2ea)", "16"),
        ]),
        section("small plates", [
          item("HIBACHI OCTOPUS", "romesco, olive & tomato salsa, lemon oil", "26", ["GF", "DF", "N"]),
          item("CRISPY CALAMARI & PRAWNS", "lemon saffron aioli", "26"),
          item("TURMERIC CHICKEN SKEWERS", "", "24", [], "garlic yoghurt, mixed leaves, red onion, charred flatbread (2pcs)"),
          item("PAPRIKA PRAWN TORTILLAS", "grilled prawns, avocado, coriander, tomato, jalapeño (3pcs)", "24", ["DF"]),
          item("ROASTED PUMPKIN", "charred corn salsa, whipped feta, toasted pepitas, hot honey", "22", ["V", "GF"]),
        ]),
        section("two hands", [
          item("CHEESEBURGER", "wagyu beef, house burger sauce, American cheese, Zuni pickle, nori salt fries", "28"),
          item("FALAFEL BURGER", "", "28", [], "falafel patty, whipped feta, pickled zucchini, shredded iceberg, green harissa mayo & nori salt fries (V)"),
          item("CHICKEN PANINI", "crispy chicken schnitzel, Calabrian chilli mayo, pesto, rocket, parmigiano", "28"),
          item("CRISPY FISH KATSU SANDO", "crispy fish katsu, soft milk bread, spicy Japanese mayo", "28"),
          item("TRUE NORTH ANGUS RUMP MB2+", "200g nori salt fries & brandy pepper jus", "34", ["GF"]),
        ]),
        section("sweet", [item("HOUSE-BAKED STICKY DATE PUDDING", "", "15", [], "dulce de leche, pistachio crumb & vanilla gelato (V, N)")]),
      ],
    },
    { key: "cover-drinks", label: "Cover · Drinks", kind: "art", background: { imageUrl: `${dir}/bar/cover-drinks.jpg` }, sections: [] },
    {
      key: "cocktails",
      label: "Cocktails",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/bar/cocktails.png` },
      footer: ALLERGY_FOOTER,
      footerAlign: "center",
      contentTop: 14,
      spacing: 2.6,
      sections: [
        section("cocktails", [
          item("CLASSIC MARGARITA", "Dry, Bright, Crisp", "22", [], "Orendain Blanco Tequlia, Manly Spirits Mandarin Triple Sec, Lime, Agave, Salt"),
          item("SPICY MARGARITA", "Zesty, Herbal, Fresh", "23", [], "Jalapeño Infused Blanco Tequlia, Poblano Chilli Liqueur, Lime, Agave, Chipotle & Lime Salt"),
          item("MANDARIN & CHIPOTLE MARGARITA", "Smoky, Floral, Bright", "23", [], "Orendain Blanco Tequlia, San Cosme Mezcal, Mandarin, Lime, Chipotle Agave, Chipotle & Lime Salt"),
          item("BLOODY SHIRAZ GIN SPRITZ", "Refreshing, Bright, Red Berries", "20", [], "Four Pillars Bloody Shiraz Gin, Regal Rouge Wild Rose Vermouth, Sour Plum, Soda"),
          item("LEMON MYRTLE SPRITZ", "Zippy, Bubbly, Crushable", "20", [], "Manly Spirits Limoncello, Lemon Myrtle, Grapefruit, Prosecco, Soda"),
          item("CHARLIE CHAPLIN", "Tart, Crushable, Velvety", "23", [], "Four Pillars Bloody Shiraz Gin, Marionette Apricot Brandy, Lime, Saline"),
          item("BLACK FOREST MANHATTAN", "Rich, Herbel, Complex", "24", [], "Wild Turkey Rye, House Vermouth Mix, Cherry Liqueur, Hazelnut & Chocolate Bitters"),
          item("ESPRESSO MARTINI", "Smooth, Complex, Classic", "22", [], "Visionary Vodka, Broken Bean Coffee Liqueur, Chocolate, Espresso, Black Walnut, Gomme, Shaved Nutmeg"),
          item("NEGRONI", "Velvety, Herbal, Bitter", "23", [], "Four Pillers Rare Gin, House Vermouth Mix, Campari, Orange"),
          item("THE BUTTERED BARREL", "Clarified, Complex, Zesty", "24", [], "Four Roses Bourbon, Planteray Rum Original Dark, Caramel Syrup, Lemon, Black Tea, Milk"),
        ]),
      ],
    },
    {
      key: "wine-1",
      label: "Bubbles & white",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/bar/wine1.png` },
      footer: ALLERGY_FOOTER,
      footerAlign: "center",
      contentTop: 14,
      spacing: 2.2,
      sections: [
        section(
          "bubbles",
          [
            item("G.H. MUMM ‘CORDON ROUGE’ Reims, FR", "", "30/175"),
            item("MERCER WINES PROSECCO Hilltops, NSW", "", "14/64"),
            item("JUMPING JUICE, PET NAT, Murry Darling, SA", "", "-/66"),
            item("MUMM ‘MARLBOROUGH BRUT PRESTIGE’ Marlborough, NZ", "", "-/110"),
          ],
          { priceColumns: ["120ml", "BTL"] }
        ),
        section(
          "white",
          [
            item("HUMBLEBONE SAUVIGNON BLANC Orange, NSW", "", "12/20/52"),
            item("INVINITI SAUVIGNON BLANC Marlborough, NZ", "", "16/28/70"),
            item("NASHDALE LANE RIESLING Orange, NSW", "", "15/24/68"),
            item("GUSTAVE LORENTZ RESERVE RIESLING Alsace, FR", "", "-/-/85"),
            item("PA-PA PINOT GRIS Mount Gambier, SA", "", "-/-/70"),
            item("MERCER WINES PINOT GRIGIO Orange, NSW", "", "14/23/66"),
            item("PATRICK SULLIVAN CHARDONNAY Mount Gambier, SA", "", "16/28/70"),
            item("DOMAINE DROUHIN-VAUDON, CHARDONNAY, Chablis, FRA", "", "-/-/110"),
            item("DOMAIN BERNARD DEFAIX CHABLIS Chablis, FR", "", "-/-/165"),
          ],
          { priceColumns: priceCols3 }
        ),
      ],
    },
    {
      key: "wine-2",
      label: "Rosé, skins & red",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/bar/wine2.png` },
      footer: ALLERGY_FOOTER,
      footerAlign: "center",
      contentTop: 14,
      spacing: 2.2,
      sections: [
        section(
          "rose/skins/chilled reds",
          [
            item("GILBERT ROSE Mudgee, NSW", "", "13/20/55"),
            item("ADELINE ROSE, PAYS’DOC, FRA", "", "17/27/75"),
            item("JUMPING JUICE, SKIN CONTACT VERMENTINO, M.Darling, SA", "", "14/26/70"),
            item("CHATEAU SAINT MARTIN ‘COLETTE’ ROSE Cote de Provence, FR", "", "-/-/90"),
            item("FIN CHILLED RED Yarra Valley, VIC", "", "16/26/78"),
          ],
          { priceColumns: priceCols3 }
        ),
        section(
          "red",
          [
            item("LIGHTHAND POINT NOIR Yarra Valley, VIC", "", "14/24/65"),
            item("MOKO HILLS ‘KAKANO’ PINOT NOIR Central Otago, NZ", "", "-/-/110"),
            item("HITHER & YON ‘SAND ROAD’ GRENACHE McLaren Vale, SA", "", "15/23/66"),
            item("HUMBLEBONE SHIRAZ Hunter Valley, NSW,", "", "13/22/56"),
            item("DEEP WOOD ESTATE CABERNET MERLOT Margaret River, WA", "", "15/23/66"),
            item("BABO CHIANTI SANGIOVESE Tuscany, Italy", "", "17/27/80"),
            item("HOWARD PARK ‘FLINT ROCK’ SHIRAZ Margaret River, WA", "", "-/-/80"),
            item("GREENOCK GREEK ‘ALICES’, SHIRAZ Barossa Valley, SA", "", "-/-/115"),
          ],
          { priceColumns: priceCols3 }
        ),
      ],
    },
    {
      key: "other",
      label: "Non-alc, beers & mixers",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/bar/other.png` },
      footer: ALLERGY_FOOTER,
      footerAlign: "center",
      contentTop: 14,
      spacing: 1.7,
      sections: [
        section("non-alc cocktails", [
          item("SPARKLING BLOOD ORANGE", "Refreshing, Crushable, Carbonated", "16", [], "Blood Orange Juice, Verjus, Lime, Fizz"),
          item("CHARRED PINEAPPLE SPRITZ", "Bubbly, Zippy, Bright", "16", [], "Charred Agave, Charred Pineapple, Cinamon, Clove, Citrus, Fizz"),
          item("MEDITERRANEAN SPRITZ", "Bubbly, Zesty, Herbal", "16", [], "Sammy Piquant Jetsetter Aperitif, Fever Tree Mediterranean Tonic, Mandarin, Verjus"),
        ]),
        section("beers", [
          item("CORONA", "", "14"),
          item("MOUNTAIN CULTURE ‘CULT’ IPA", "", "15"),
          item("TWO BAYS GLUTEN FREE PALE ALE", "", "14"),
          item("CASCADE PREMIUM LIGHT", "", "10"),
          item("PHILTER LITE XPA", "", "10"),
          item("PERONI 0%", "", "10"),
          item("HEAPS NORMAL XPA 0.5%", "", "10"),
        ]),
        section("premium mixers", [
          item("FEVER TREE MEDITERRANEAN", "Tonic", "6"),
          item("COCA COLA 330ML", "Glass Bottle", "7"),
          item("COCA COLA ZERO SUGAR 330ML", "Glass Bottle", "7"),
          item("ANTIPODES STILL", "Mineral Water 1L", "12"),
          item("ANTIPODES SPARKLING", "Mineral Water 1L", "12"),
        ]),
      ],
    },
  ],
};

// ------------------------------------------------------------- Set menu
const setMenu: PrintPieceDoc = {
  version: "July 2026",
  pages: [
    {
      key: "menu",
      label: "Menu",
      kind: "content",
      background: { color: "#FFFFFF", imageUrl: `${dir}/set/menu.png` },
      title: "SHARED\nSET\nMENU",
      titleNote: "GROUPS 10+",
      titleAlign: "right",
      contentTop: 70,
      spacing: 2.8,
      footer:
        "Tilbury Hotel does not operate in an allergen free kitchen, therefore cannot guarantee allergen-free meals. A 1.4% processing fee applies to all cards. A 10% surcharge applies on Sundays and 15% on Public Holidays A 5% service charge applies",
      footerAlign: "center",
      sections: [
        section("starters", [
          item("HOUSE FOCACCIA", "grape tomato, aged balsamic & EVOO", "", ["GFO", "VO"]),
          item("BURRATA", "Pistachio pesto", "", ["V"]),
          item("S.A KINGFISH CRUDO", "Burnt orange dressing, green olive, fennel & Espelette pepper", "", ["GF", "DF"]),
        ]),
        section("mains", [
          item("SOUTH COAST SWORDFISH", "salsa verde", "", ["GF", "DF"]),
          item("O'CONNOR PREMIUM ANGUS SIRLOIN", "150 Days Grain Fed MB 3+, Rocket, Red Wine Jus", "", ["GF"]),
        ]),
        section("sides", [
          item("RADICCHIO SALAD", "chive vinaigrette", "", ["GF", "V"]),
          item("ROAST POTATOES", "Rosemary, virgin olive oil", "", ["GF", "DF"]),
        ]),
        section("dessert", [item("HOUSE-BAKED STICKY DATE PUDDING —", "dulce de leche, pistachio crumb", "", ["V", "N"])]),
      ],
    },
    { key: "back", label: "Back page", kind: "art", background: { color: "#FFFFFF", imageUrl: `${dir}/set/back.png` }, sections: [] },
  ],
};

// --------------------------------------------------------------- Dessert
const dessert: PrintPieceDoc = {
  version: "July 2026",
  pages: [
    {
      key: "menu",
      label: "Menu",
      kind: "content",
      background: { color: "#FFF6E2", imageUrl: `${dir}/dessert/menu.png` },
      contentTop: 40,
      spacing: 3.6,
      footer:
        "Our menu contains allergens & is prepared in a kitchen that handles nuts, shellfish & gluten. Whilst reasonable efforts are taken to accommodate guest dietary needs, we cannot guarantee that our food will be allergen free. A 10% surcharge applies to the price of all items on Sundays and 15% on Public Holidays.",
      footerAlign: "center",
      sections: [
        section("dessert", [
          item("BASQUE CHEESECAKE BRULEE", "Burnt cheesecake & amarena cherries", "18"),
          item("HOUSE-BAKED STICKY DATE PUDDING", "Dulce de leche, pistachio crumb & vanilla gelato", "15", ["V", "N"]),
          item("GELATO & SORBET (2 SCOOPS)", "Choice: Vanilla, Pistachio, Chocolate, Lemon Sorbet", "10"),
          item("CHEESE & CONDIMENTS", "Choice of 2 or 3 International & local cheese served with muscatel & fig jam", "25 / 35", [], "Our cheese selection changes regularly, please ask our staff"),
          item("AFFOGATO AL CAFFE", "Espresso Choice of Gelato: Vanilla, Pistachio, Chocolate Gelato or Lemon Sorbet", "12"),
          item("ADD", "Choice of Liqueur: Brookies Macadamia Liqueur, Grand Marnier, Amaretto Disaronno", "20"),
        ]),
      ],
    },
  ],
};

export const TILBURY_SEEDS: Record<string, PrintPieceDoc> = { dining, bar, set: setMenu, dessert };
