import type { PrintColumn, PrintItem, PrintPieceDoc, PrintSection } from "../types";

// Starting content for Beach Road Hotel's printed pieces, transcribed from the
// venue's print-ready PDF (A3 Food + Drinks menu, Summer 26 / July). Wording is
// kept exactly as printed, including the source's own typos.

let seq = 0;
const k = (p: string) => `${p}${++seq}`;

// "MIXED OLIVES (VG, DF, GF)" -> name + dietary tags. Only short all-caps
// groups count as tags, so "(250g)" and "(2 SCOOPS)" stay in the name.
function it(raw: string, description: string, price: string, extra: Partial<PrintItem> = {}): PrintItem {
  const dietary: string[] = [];
  const name = raw
    .replace(/\s*\(([A-Z]{1,3}(?:, [A-Z]{1,3})*)\)/g, (_m, g: string) => {
      dietary.push(...g.split(", "));
      return "";
    })
    .trim();
  return { key: k("i"), name, description, price, dietary, ...extra };
}

function sec(title: string, items: PrintItem[], extra: Partial<PrintSection> = {}): PrintSection {
  return { key: k("s"), title, items, ...extra };
}

const dir = "/assets/menu-print/beach-road/main";
const CREAM = "#FCF6B2";

const FOOD_FOOTER =
  "VEGETARIAN (V), VEGAN (VG), GLUTEN-FREE (GF), DAIRY-FREE (DF), VEGETARIAN OPTION (VO), GLUTEN-FREE OPTION (GFO), DAIRY-FREE OPTION (DFO) (N) CONTAINS NUTS (A) AUSTRALIAN, (I) IMPORTED, (M) MIXED\nSUNDAYS INCUR A 10% SURCHARGE \\ PUBLIC HOLIDAYS INCUR A 15% SURCHARGE";

const foodColumns: PrintColumn[] = [
  { x0: 45.4, x1: 395.6, topInset: 62 },
  { x0: 438, x1: 788.8, topInset: 62 },
  { x0: 839.2, x1: 1189.8, topInset: 62, footer: FOOD_FOOTER, footerInset: 43 },
];

const wine = (title: string, items: PrintItem[], extra: Partial<PrintSection> = {}) =>
  sec(title, items, { column: 1, priceColumns: ["", "", ""], priceColumnWidth: 32, noRule: true, titleSize: 0.8, ...extra });

const day = (title: string, items: PrintItem[], extra: Partial<PrintSection> = {}) => sec(title, items, { column: 2, ...extra });

const main: PrintPieceDoc = {
  version: "Summer 26 — July",
  pages: [
    {
      key: "food",
      label: "Food",
      kind: "content",
      background: { color: "#C8E5F7", imageUrl: `${dir}/food.png` },
      spacing: 0.15,
      columns: foodColumns,
      sections: [
        // ---- column 1
        sec(
          "SHARED PLATES",
          [
            it("MIXED OLIVES (VG, DF, GF)", "house marinated", "10"),
            it("GARLIC BREAD (V)", "oregano, olive oil & sea salt", "12", { nameExtra: "add cheese +4" }),
            it("CRISPY CALAMARI (I) (DF, GF)", "fried loligo calamari, garlic aioli", "22"),
            it("FRIES (V, DF)", "garlic aioli", "15"),
            it("SWEET POTATO FRIES (V, GF)", "sour cream & sweet chilli", "18"),
            it("LOADED FRIES", "cheese sauce, bacon, garlic mayo, jalapeños & shallots", "22"),
            it("CRISPY CHICKEN TENDERS (3pcs)", "house-made ranch sauce", "15"),
            it("1/2KG CHICKEN WINGS (GF, DFO)", "choice of lemon pepper, house-made smoked BBQ or buffalo sauce, served with ranch", "24"),
            it("NACHOS (VO, GFO)", "double-layered corn chips, chilli beans, slow-cooked brisket, queso, smashed avocado, sour cream, salsa & jalapeños", "28"),
          ],
          { column: 0 }
        ),
        sec(
          "SALAD / BOWL",
          [
            it("CAESAR SALAD (GFO)", "crispy bacon, lettuce, egg, croutons, shaved parmesan & caesar dressing", "25"),
            it("MEXICAN CHICKEN SALAD (GF, DFO)", "spiced grilled chicken breast, avocado, charred corn salsa, black beans, cherry tomatoes, cos lettuce, coriander & lime dressing", "28"),
            it(
              "BEACH RD POKE BOWL (I) (DFO, GFO, VGO)",
              "choice of chicken or sashimi tuna, shredded cabbage, seaweed salad, avocado, edamame, cucumber, carrot, crushed wasabi peas, pickled pickled ginger, flying fish roe, green tea soba noodles & roasted sesame dressing",
              "30"
            ),
          ],
          { column: 0, subtitle: "add chicken +6, add prawns +10, add tuna sashimi +10, add falafel +6" }
        ),
        sec(
          "TACOS",
          [
            it("GRILLED CHICKEN X 3 (DF)", "marinated chicken tenderloin, shredded lettuce, avocado crema & coriander", "24"),
            it("BEEF BRISKET X 3 (DF)", "smoked wagyu brisket, cabbage slaw, pickled onion & chipotle mayo", "24"),
            it("PAPRIKA PRAWN X 3 (I) (DF)", "grilled paprika prawns, charred corn salsa, avocado, jalapeño & lime", "24"),
          ],
          { column: 0 }
        ),
        // ---- column 2
        sec(
          "PASTA . PASTA . PASTA . PASTA",
          [
            it("RIGATONI BOLOGNESE (GFO)", "slow-braised beef ragù & parmesan", "27"),
            it("PRAWN LINGUINE (I) (GFO, DFO)", "prawns, chilli, garlic, cherry tomatoes, rocket & white wine", "34"),
            it("MUSHROOM MAFALDE (V, N)", "wild mushrooms, porcini butter, thyme, parmesan & roasted hazelnuts", "28"),
          ],
          { column: 1, titleSpread: true }
        ),
        sec(
          "MAIN",
          [
            it("BEER-BATTERED HOKI FILLET (I)", "fries, lemon & tartare sauce", "29"),
            it("BANGERS & MASH (GF)", "300g pork Toulouse sausage pinwheel, potato mash, charred broccolini, caramelised onion & gravy", "32"),
            it("PAN-SEARED BARRAMUNDI (A)(GF)", "pea & basil purée, zucchini & squash", "38"),
            it("TRUE NORTH RUMP MB2+ (250g) (GF)", "grain-fed rump, fries, mixed leaf salad & choice of sauce", "36"),
            it("BLACK ANGUS SCOTCH FILLET MB2+ (250g) (GF)", "grass-fed and grain-finished for a minimum of 100 days, cauliflower gratin, broccolini & choice of sauce", "42"),
            it("CHICKEN SCHNITZEL", "house-made parmesan & herb crumb, mixed leaf salad & fries", "30"),
            it("CHICKEN PARMIGIANA", "house-made parmesan & herb crumb, mozzarella, double-smoked ham, Napolitana sauce, mixed leaf salad & fries", "34"),
          ],
          { column: 1 }
        ),
        sec("SAUCES (GF)", [it("", "gravy • red wine jus • mushroom • peppercorn", "3")], { column: 1, titleSize: 0.55, noRule: true }),
        sec(
          "BURGERS",
          [
            it("BEACHY BURGER (GFO)", "wagyu beef smashed patties, American cheddar, tomato, caramelised onion, lettuce, bacon & burger sauce", "28"),
            it("CHICKEN BURGER (GFO)", "crispy chicken breast, lettuce, pickles & green harissa mayo", "26"),
            it("SMASHED BURGER (GFO)", "wagyu beef patty, American cheddar, caramelised onion & burger sauce", "25"),
            it("STEAK SANDWICH (GFO)", "caramelised onion, coppa, manchego, rocket, roasted capsicum & garlic aioli", "28"),
          ],
          { column: 1, titleSize: 0.55, noRule: true, titleExtra: "all served with fries", subtitle: "add bacon +3, add cheese +3, extra patty +5, gluten free bun +3" }
        ),
        // ---- column 3
        sec(
          "SIDES",
          [
            it("CHARRED BROCCOLINI (VG, DF, GF)", "sesame oil, roasted buckwheat & chilli flakes", "12"),
            it("OVEN-BAKED CAULIFLOWER GRATIN (V, GF)", "fior di latte, parmesan & provolone", "15"),
          ],
          { column: 2 }
        ),
        sec(
          "KIDS",
          [
            it("KIDS PASTA NAPOLITANA (V)", "", "15"),
            it("KIDS CHEESEBURGER & CHIPS", "", "15"),
            it("KIDS FISH & CHIPS (I)", "", "15"),
            it("CHICKEN TENDERS & CHIPS", "", "15"),
          ],
          { column: 2 }
        ),
        sec(
          "DESSERT",
          [
            it("GELATO (2 SCOOPS) (V)", "– extra scoop +4", "8", { note: "vanilla, chocolate or hazelnut" }),
            it("HOUSE-BAKED STICKY DATE PUDDING (V)", "dulce de leche & vanilla gelato", "12"),
          ],
          { column: 2 }
        ),
        sec(
          "PIZZA . PIZZA . PIZZA . PIZZA",
          [
            it("MARGHERITA (V, GFO, DFO)", "tomato base, fior di latte & basil", "22"),
            it("CHILLI PRAWN (I) (GFO, DFO)", "tomato base, fior di latte, cherry tomatoes & wild rocket", "29"),
            it("PERI PERI CHICKEN (GFO, DFO)", "tomato base, fior di latte, cherry tomatoes, onion, roasted capsicum & chilli mayo", "26"),
            it("PEPPERONI (GFO, DFO)", "tomato base, fior di latte, pepperoni & oregano", "24"),
            it("HAM & PINEAPPLE (GFO, DFO)", "tomato base, fior di latte, pineapple & leg ham", "25"),
            it("MEAT LOVERS (GFO, DFO)", "hickory BBQ base, fior di latte, double smoked ham, pepperoni & cabanossi", "28"),
          ],
          { column: 2, titleSpread: true, subtitle: "Fri & Sat 5pm - late" }
        ),
        sec("PIZZA . PIZZA . PIZZA . PIZZA", [], { column: 2, titleSpread: true, noRule: true }),
      ],
    },
    {
      key: "drinks",
      label: "Drinks",
      kind: "content",
      background: { color: "#C8E5F7", imageUrl: `${dir}/drinks.png` },
      spacing: 0.15,
      columns: [
        { x0: 57, x1: 412.6, topInset: 63 },
        { x0: 431.6, x1: 776, topInset: 63 },
        {
          x0: 868.7,
          x1: 1157,
          align: "center",
          title: "FOOD + DRINKS MENU",
          titleSize: 30,
          titleInset: 224,
          titleRule: true,
          topInset: 292,
          inkColor: CREAM,
          titleColor: CREAM,
          sectionTitleScale: 1.9,
          spacing: 0.3,
          footer: "excluding public holidays",
          footerInset: 29,
        },
      ],
      sections: [
        sec(
          "COCKTAILS",
          [
            it("Rhubarb Paloma", "orendain tequila, rhubarb, pink grapefruit, lime", "23"),
            it("HOUSE MARGARITA", "orendain tequila, orange curacao, agave syrup, lime juice", "23", { note: "make it spicy + 2" }),
            it("APEROL SPRITZ", "aperol, sparkling wine, orange, soda", "22"),
            it("ESPRESSO MARTINI", "broken bean coffee liqueur, australian wheat vodka, cold brew coffee", "20"),
            it("LYCHEE BLUSH", "visionary vokda, lychee liqueur, lime, cranberry, watermelon, fee foam", "22"),
            it("PINEAPPLE DREAM", "red mill rum, lime, pineapple, white chocolate liqueur", "24"),
            it("CASA DE PASSION", "orendain, lime, passionfruit, mango, soda", "23"),
            it("PINEAPPLE JALAPEÑO MARGARITA", "orendain blanco, green verdita, lime, agave", "25"),
            it("YUZU WAVE", "four pillars yuzu gin, lime, pineapple, passionfruit syrup, tonic", "22"),
            it("MEZCAL MARGARITA", "san cosme mezcal, orange curacao, agave, lime", "25"),
            it("STRAWBERRY PEPPER PRESS", "four pillars bloody shiraz gin, chilli ginger syrup, lime, strawberry syrup, muddled strawberries, soda", "22"),
          ],
          { column: 0, ruleWidth: 203 }
        ),
        sec(
          "COCKTAIL JUGS",
          [
            it("RHUBARB PALOMA JUG", "orendain tequila, rhubarb, pink grapefruit, lime", "45"),
            it("MARGARITA JUG", "orendain tequila, orange curacao, agave syrup, lime juice", "45"),
            it("RED SANGRIA JUG", "florcita blanco, elderflower syrup, house spiced syrup, strawberries, oranges, mint, shiraz, lemonade", "45"),
          ],
          { column: 0 }
        ),
        sec(
          "NON-ALCOHOLIC COCKTAILS",
          [
            it("STRAWBERRY MOJITO", "strawberry, mint, lime topped with soda water", "15"),
            it("Passionfruit elderflower spritz", "passionfruit syrup, elderflower syrup, soda, lime & mint", "15"),
          ],
          { column: 0 }
        ),
        sec("VINO", [], { column: 1, ruleWidth: 203 }),
        wine("SPARKLING", [
          it("HUMBLE BONE SAUVIGNON BLANC, Orange, NSW", "", "12/-/56"),
          it("MERCER WINES PROSECCO, Hilltops, NSW", "", "14/-/64"),
          it("MUMM MARLBOROUGH BRUT PRESTIGE, Reims, FRA", "", "16/-/85"),
          it("JUMPING JUICE PET NAT, Murray Darling, SA", "", "-/-/66"),
          it("MUMM “CORDON ROUGE” BRUT, Reime, FRA", "", "-/-/160"),
        ]),
        wine("WHITE WINE", [
          it("HUMBLE BONE SAUVIGNON BLANC, Orange, NSW", "", "12/19/56"),
          it("INVINITI SAUVIGNON BLANC, Marlborough, NZ", "", "-/-/63"),
          it("NASHDALE LANE RIESLING, Orange, NSW", "", "13/21/65"),
          it("MERCER WINES PINOT GRIGIO, Orange, NSW", "", "13/21/65"),
          it("PA PA PINOT GRIS, Mount Gambier, SA", "", "-/-/67"),
          it("PUNT ROAD CHARDONNAY, Yarra Valley, VIC", "", "14/21/65"),
          it("JUMPING JUICE SKIN CONTACT VERMINTINO, Murray Darling, SA", "", "13/21/65"),
        ]),
        wine("ROSE", [
          it("GILBERT ROSE, Mudgee, NSW", "", "13/20/58"),
          it("ADELINE ROSE, Pays’DOC, FRA", "", "14/22/65"),
          it("MAISON AIX ROSE, Provence, FRA", "", "-/-/95"),
        ]),
        wine("RED WINE", [
          it("HUMBLE BONE SHIRAZ, Hunter Valley, NSW", "", "12/19/56"),
          it("LIGHTHAND PINOT NOIR, Yarra Valley, VIC", "", "15/23/70"),
          it("MOKO HILLS PINOT NOIR, Central Otago, NZ", "", "-/-/110"),
          it("HITHER & YON MALBEC, McClaren Vale, SA", "", "14/22/65"),
          it("RUSDEN “RIPPER CREEK’ SHIRAZ/CABERNET Barossa Valley, SA", "", "-/-/78"),
          it("DEEP WOODS ESTATE CABERNET MERLOT", "", "13/21/62"),
        ]),
        day("DAILY SPECIALS", [], { subtitle: "From 5pm" }),
        day("MONDAY", [it("RUMP STEAK 20", "mixed leaf salad, fries & choice of sauce", "")]),
        day("TUESDAY", [it("BURGERS 20", "smashed burger or chicken burger", "")]),
        day("WEDNESDAY", [it("TACOS choice of 3 for 18", "grilled chicken/beef brisket/paprika prawn", "")]),
        day("THURSDAY", [it("SCHNITZEL 20", "", ""), it("PARMIGIANA 25", "mixed leaf salad & fries", "")]),
        day("FRIDAY", [it("WINGS 4pm - 8pm 12", "½ kilo wings choice of lemon pepper / bbq / buffalo", "")]),
      ],
    },
  ],
};

export const BEACH_ROAD_SEEDS: Record<string, PrintPieceDoc> = { main };
