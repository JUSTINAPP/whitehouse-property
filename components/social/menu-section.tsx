import { MenuSection, MenuItem } from "@/lib/menu-data";
import { SiteTheme } from "@/lib/site-theme";

function Row({ item, theme }: { item: MenuItem; theme: SiteTheme }) {
  return (
    <div className="flex items-start justify-between gap-3.5 border-b py-3.5 last:border-none" style={{ borderColor: "#F0EDEA" }}>
      <div className="min-w-0">
        <p
          className="mb-0.5 text-[17px] leading-tight"
          style={{ fontFamily: theme.displayFont, color: theme.colors.charcoal }}
        >
          {item.name}
        </p>
        {item.description && (
          <p className="text-[12px] font-light leading-relaxed" style={{ fontFamily: theme.sansFont, color: theme.colors.warm }}>
            {item.description}
          </p>
        )}
        {item.note && (
          <p className="mt-1 text-[11px] font-light italic leading-relaxed" style={{ fontFamily: theme.sansFont, color: theme.colors.primaryDark }}>
            {item.note}
          </p>
        )}
      </div>
      <p className="shrink-0 pt-0.5 text-[19px]" style={{ fontFamily: theme.displayFont, color: theme.colors.charcoal }}>
        {typeof item.price === "number" ? `$${item.price}` : item.price}
      </p>
    </div>
  );
}

export function MenuSectionBlock({ section, theme }: { section: MenuSection; theme: SiteTheme }) {
  return (
    <div id={section.id} className="scroll-mt-24 mb-9">
      <div
        className="mb-1 flex items-center gap-2.5 border-b pb-2.5 pt-2 text-[13px] uppercase"
        style={{ borderColor: "#E5E3DF", color: theme.colors.primary, fontFamily: theme.sansFont, letterSpacing: "0.2em" }}
      >
        {section.title}
        <span className="h-px flex-1" style={{ backgroundColor: "#F0EDEA" }} />
      </div>
      {section.note && (
        <p className="mb-1 mt-2 text-[11px] font-light italic" style={{ fontFamily: theme.sansFont, color: theme.colors.warm }}>
          {section.note}
        </p>
      )}
      {section.items.map((item) => (
        <Row key={item.name} item={item} theme={theme} />
      ))}
    </div>
  );
}
