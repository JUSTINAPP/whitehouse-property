import { EmailCampaign, VenueSlug } from "../types";
import { daysAgoISO } from "./dates";

const CAMPAIGNS: Record<VenueSlug, Omit<EmailCampaign, "id" | "venueId">[]> = {
  "beach-road": [
    {
      subject: "Saturdays just got bigger — new DJ lineup",
      sentDate: daysAgoISO(5),
      recipients: 4210,
      openRate: 34.2,
      clickRate: 7.9,
      status: "sent",
      preview: "Beer garden to dance floor. Doors from 6pm, DJs all night.",
    },
    {
      subject: "Trivia Tuesdays are back — $20 burgers too",
      sentDate: daysAgoISO(19),
      recipients: 4155,
      openRate: 31.6,
      clickRate: 6.4,
      status: "sent",
      preview: "Round up the crew for Bondi's best midweek quiz.",
    },
  ],
  barrys: [
    {
      subject: "Your Bondi summer starts here",
      sentDate: daysAgoISO(8),
      recipients: 1860,
      openRate: 41.7,
      clickRate: 11.2,
      status: "sent",
      preview: "Terrace rooms are booking out fast for the summer season.",
    },
    {
      subject: "Keyless check-in with GOKI — how it works",
      sentDate: daysAgoISO(35),
      recipients: 1790,
      openRate: 38.1,
      clickRate: 9.6,
      status: "sent",
      preview: "Skip the front desk. Your phone is your room key.",
    },
  ],
  tilbury: [
    {
      subject: "The new Tilbury is here",
      sentDate: daysAgoISO(12),
      recipients: 3320,
      openRate: 39.8,
      clickRate: 10.1,
      status: "sent",
      preview: "A first look at our biggest redesign in 12 years.",
    },
    {
      subject: "New Mediterranean menu, courtesy of Chef James",
      sentDate: daysAgoISO(27),
      recipients: 3280,
      openRate: 36.4,
      clickRate: 8.3,
      status: "sent",
      preview: "Spicy snapper, XO mussels, and a lot more to try.",
    },
  ],
  vicar: [
    {
      subject: "Rosa's Bottomless Brunch — Saturdays from 11:30am",
      sentDate: daysAgoISO(6),
      recipients: 5040,
      openRate: 43.5,
      clickRate: 13.8,
      status: "sent",
      preview: "3 courses, 2 hours of drinks, $99pp. Bookings essential.",
    },
    {
      subject: "Hops In The Hills — our own beer festival",
      sentDate: daysAgoISO(22),
      recipients: 4970,
      openRate: 37.9,
      clickRate: 9.5,
      status: "sent",
      preview: "A full day of local brews right here at The Vicar, Dural.",
    },
  ],
};

export function getCampaigns(venueId: VenueSlug): EmailCampaign[] {
  return CAMPAIGNS[venueId].map((c, i) => ({
    ...c,
    id: `${venueId}-campaign-${i + 1}`,
    venueId,
  }));
}
