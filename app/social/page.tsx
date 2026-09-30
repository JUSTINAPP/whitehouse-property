"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Lightbulb, RefreshCw } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { WeekView, SuggestionSlot } from "@/components/social/week-view";
import { MonthView } from "@/components/social/month-view";
import { ListView } from "@/components/social/list-view";
import { PostModal, PostDraft } from "@/components/social/post-modal";
import { FeedPreview } from "@/components/social/feed-preview";
import { InstagramConnectionBadge } from "@/components/social/instagram-connection-badge";
import { SOCIAL_POSTS } from "@/lib/mock/social-posts";
import { getCurrentWeekDates } from "@/lib/mock/dates";
import { INSTAGRAM_MOCK } from "@/lib/instagram-mock";
import { fetchSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost } from "@/lib/social/social-posts-data";
import { fetchInstagramConnection } from "@/lib/social/instagram-config";
import { fetchPostingSuggestions, PostingSuggestion, SUGGESTION_DAY_LABELS } from "@/lib/social/suggestions";
import { SocialPost, VenueSlug, InstagramConnection } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "week" | "month" | "list";

interface VenueSuggestionsState {
  suggestions: PostingSuggestion[] | null;
  strategy: string;
  generatedAt: string | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_SUGGESTIONS_STATE: VenueSuggestionsState = {
  suggestions: null,
  strategy: "",
  generatedAt: null,
  loading: false,
  error: null,
};

export default function SocialPage() {
  const { venue } = useVenue();
  const { toast, showToast } = useToast();

  const [postsByVenue, setPostsByVenue] = useState<Record<VenueSlug, SocialPost[]>>(() => ({
    "beach-road": [...SOCIAL_POSTS["beach-road"]],
    barrys: [...SOCIAL_POSTS.barrys],
    tilbury: [...SOCIAL_POSTS.tilbury],
    vicar: [...SOCIAL_POSTS.vicar],
  }));
  const [view, setView] = useState<ViewMode>("week");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [newSlot, setNewSlot] = useState<{ date: string; time: string } | null>(null);
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Keyed per venue — switching venues (or navigating elsewhere and back)
  // must not lose a venue's already-generated suggestions. Only an explicit
  // "Refresh suggestions" click, or a full page reload, should regenerate.
  const [suggestionsByVenue, setSuggestionsByVenue] = useState<Record<VenueSlug, VenueSuggestionsState>>(() => ({
    "beach-road": { ...EMPTY_SUGGESTIONS_STATE },
    barrys: { ...EMPTY_SUGGESTIONS_STATE },
    tilbury: { ...EMPTY_SUGGESTIONS_STATE },
    vicar: { ...EMPTY_SUGGESTIONS_STATE },
  }));
  const fetchedSuggestionVenues = useRef(new Set<VenueSlug>());
  const [suggestionPrefill, setSuggestionPrefill] = useState<Partial<PostDraft> | null>(null);

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const posts = postsByVenue[venue.slug];

  // Hydrate from Supabase when available — falls back to the seeded mock
  // calendar (and keeps working with it) when Supabase isn't configured yet
  // or the venue simply has no rows there yet.
  useEffect(() => {
    let cancelled = false;
    fetchSocialPosts(venue.slug).then((rows) => {
      if (cancelled || !rows || rows.length === 0) return;
      setPostsByVenue((prev) => ({ ...prev, [venue.slug]: rows }));
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the loading flag when venue changes is intentional here
    setConnectionLoading(true);
    fetchInstagramConnection(venue.slug).then((result) => {
      if (!cancelled) {
        setConnection(result);
        setConnectionLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug]);

  useEffect(() => {
    if (!showSuggestions) return;
    const slug = venue.slug;
    // Already have this venue's suggestions from earlier this session (or a
    // fetch for it is already in flight) — just let the existing state show,
    // don't regenerate every time the venue is switched back to.
    if (fetchedSuggestionVenues.current.has(slug)) return;
    fetchedSuggestionVenues.current.add(slug);

    let cancelled = false;
    setSuggestionsByVenue((prev) => ({ ...prev, [slug]: { ...prev[slug], loading: true, error: null } }));
    fetchPostingSuggestions(slug)
      .then((res) => {
        if (cancelled) return;
        setSuggestionsByVenue((prev) => ({
          ...prev,
          [slug]: { suggestions: res.suggestions, strategy: res.strategy ?? "", generatedAt: res.generatedAt, loading: false, error: null },
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        // Let a failed attempt be retried next time this venue's suggestions are shown.
        fetchedSuggestionVenues.current.delete(slug);
        setSuggestionsByVenue((prev) => ({
          ...prev,
          [slug]: { ...prev[slug], loading: false, error: err instanceof Error ? err.message : "Failed to load suggestions" },
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [showSuggestions, venue.slug]);

  const currentSuggestions = suggestionsByVenue[venue.slug];

  const suggestionSlots: SuggestionSlot[] = useMemo(() => {
    if (!showSuggestions || !currentSuggestions.suggestions) return [];
    const existingSlotKeys = new Set(posts.map((p) => `${p.scheduledDate}|${p.scheduledTime}`));
    return currentSuggestions.suggestions
      .map((suggestion) => ({
        date: weekDates[SUGGESTION_DAY_LABELS.indexOf(suggestion.day)],
        suggestion,
      }))
      .filter(({ date, suggestion }) => date && !existingSlotKeys.has(`${date}|${suggestion.time}`));
  }, [showSuggestions, currentSuggestions.suggestions, posts, weekDates]);

  function handleRefreshSuggestions() {
    const slug = venue.slug;
    fetchedSuggestionVenues.current.add(slug);
    setSuggestionsByVenue((prev) => ({ ...prev, [slug]: { ...prev[slug], loading: true, error: null } }));
    fetchPostingSuggestions(slug, { force: true })
      .then((res) => {
        setSuggestionsByVenue((prev) => ({
          ...prev,
          [slug]: { suggestions: res.suggestions, strategy: res.strategy ?? "", generatedAt: res.generatedAt, loading: false, error: null },
        }));
      })
      .catch((err) =>
        setSuggestionsByVenue((prev) => ({
          ...prev,
          [slug]: { ...prev[slug], loading: false, error: err instanceof Error ? err.message : "Failed to load suggestions" },
        }))
      );
  }

  function openCreate(date: string, time: string) {
    setEditingPost(null);
    setNewSlot({ date, time });
    setSuggestionPrefill(null);
    setModalOpen(true);
  }

  function openCreateFromSuggestion(suggestion: PostingSuggestion, date: string) {
    setEditingPost(null);
    setNewSlot({ date, time: suggestion.time });
    setSuggestionPrefill({
      channel: "instagram",
      format: suggestion.contentType,
      title: suggestion.contentSuggestion.length > 60 ? `${suggestion.contentSuggestion.slice(0, 57)}...` : suggestion.contentSuggestion,
      caption: suggestion.contentSuggestion,
      contentBrief: suggestion.reason,
      // The user is explicitly scheduling this suggestion, not stashing a
      // draft — defaulting to "draft" here meant every suggestion-created
      // post silently needed a manual status change before it would show
      // up anywhere that only surfaces scheduled content (e.g. the feed
      // preview below).
      status: "scheduled",
    });
    setModalOpen(true);
  }

  function openEdit(post: SocialPost) {
    setEditingPost(post);
    setNewSlot(null);
    setSuggestionPrefill(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPost(null);
    setNewSlot(null);
    setSuggestionPrefill(null);
  }

  async function handleSave(draft: PostDraft) {
    const venueSlug = venue.slug;
    if (editingPost) {
      const editingId = editingPost.id;
      const previous = editingPost;
      setPostsByVenue((prev) => ({
        ...prev,
        [venueSlug]: prev[venueSlug].map((p) => (p.id === editingId ? { ...p, ...draft } : p)),
      }));
      closeModal();

      const saved = await updateSocialPost(editingId, venueSlug, draft);
      if (saved) {
        setPostsByVenue((prev) => ({
          ...prev,
          [venueSlug]: prev[venueSlug].map((p) => (p.id === editingId ? saved : p)),
        }));
        showToast("Post updated");
      } else {
        // Couldn't actually persist the change — put the original back so
        // the calendar doesn't show something that a refresh would erase,
        // and say so, instead of a false-positive "saved" toast.
        setPostsByVenue((prev) => ({
          ...prev,
          [venueSlug]: prev[venueSlug].map((p) => (p.id === editingId ? previous : p)),
        }));
        showToast("Couldn't save changes — check your connection and try again.", "error");
      }
      return;
    }

    const tempId = `${venueSlug}-post-${Date.now()}`;
    const tempPost: SocialPost = { id: tempId, venueId: venueSlug, ...draft };
    setPostsByVenue((prev) => ({ ...prev, [venueSlug]: [...prev[venueSlug], tempPost] }));
    closeModal();

    const saved = await createSocialPost(venueSlug, draft);
    if (saved) {
      setPostsByVenue((prev) => ({
        ...prev,
        [venueSlug]: prev[venueSlug].map((p) => (p.id === tempId ? saved : p)),
      }));
      showToast(draft.status === "scheduled" ? "Post scheduled" : "Post created");
    } else {
      // Never actually made it to Supabase — remove the optimistic entry so
      // the calendar doesn't show a post that would vanish on refresh
      // anyway, and tell the user plainly rather than a false "created".
      setPostsByVenue((prev) => ({
        ...prev,
        [venueSlug]: prev[venueSlug].filter((p) => p.id !== tempId),
      }));
      showToast("Couldn't save this post — check your connection and try again.", "error");
    }
  }

  async function handleDelete() {
    if (!editingPost) return;
    const venueSlug = venue.slug;
    const deletedId = editingPost.id;
    setPostsByVenue((prev) => ({
      ...prev,
      [venueSlug]: prev[venueSlug].filter((p) => p.id !== deletedId),
    }));
    closeModal();
    showToast("Post deleted");
    await deleteSocialPost(deletedId);
  }

  function handleConnectInstagram() {
    showToast("Instagram OAuth isn't wired up yet — coming in a follow-up.", "error");
  }

  const modalInitial = editingPost ?? {
    scheduledDate: newSlot?.date ?? weekDates[0],
    scheduledTime: newSlot?.time ?? "12:00",
    ...suggestionPrefill,
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Social Calendar"
        subtitle={`Plan and schedule ${venue.name}'s content across Instagram, Facebook, TikTok, events and articles.`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <InstagramConnectionBadge connection={connection} loading={connectionLoading} onConnect={handleConnectInstagram} />
            <button
              onClick={() => openCreate(weekDates[0], "12:00")}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: venue.accent }}
            >
              <Plus className="h-4 w-4" />
              New post
            </button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
          {(["week", "month", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition",
                view === mode ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={showSuggestions}
              onChange={(e) => setShowSuggestions(e.target.checked)}
              className="h-4 w-4 rounded border-border"
              style={{ accentColor: venue.accent }}
            />
            <Lightbulb className="h-4 w-4" />
            Show suggestions
          </label>
          {showSuggestions && (
            <>
              <button
                onClick={handleRefreshSuggestions}
                disabled={currentSuggestions.loading}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:text-ink disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", currentSuggestions.loading && "animate-spin")} />
                Refresh suggestions
              </button>
              {currentSuggestions.generatedAt && (
                <span className="text-xs text-ink-soft">
                  Last updated{" "}
                  {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(
                    new Date(currentSuggestions.generatedAt)
                  )}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {showSuggestions && currentSuggestions.error && (
        <p className="mb-4 text-sm text-rose-600">Couldn&apos;t load suggestions: {currentSuggestions.error}</p>
      )}

      {showSuggestions && currentSuggestions.strategy && !currentSuggestions.error && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-dashed px-4 py-3 text-sm text-ink"
          style={{ borderColor: venue.accent, backgroundColor: `${venue.accent}0d` }}
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color: venue.accent }} />
          <p>
            <span className="font-medium">This week&apos;s strategy: </span>
            {currentSuggestions.strategy}
          </p>
        </div>
      )}

      {view === "week" && (
        <WeekView
          weekDates={weekDates}
          posts={posts}
          onSlotClick={openCreate}
          onPostClick={openEdit}
          suggestionSlots={showSuggestions ? suggestionSlots : []}
          accent={venue.accent}
          onScheduleSuggestion={openCreateFromSuggestion}
        />
      )}
      {view === "month" && (
        <MonthView
          reference={new Date()}
          posts={posts}
          onDayClick={(date) => openCreate(date, "12:00")}
          onPostClick={openEdit}
        />
      )}
      {view === "list" && <ListView posts={posts} onPostClick={openEdit} />}

      <FeedPreview
        venueSlug={venue.slug}
        accent={venue.accent}
        posts={posts}
        connected={connection?.connected ?? false}
        mock={INSTAGRAM_MOCK[venue.slug]}
        onEditPost={openEdit}
        onCreatePost={(date) => openCreate(date, "12:00")}
      />

      <PostModal
        key={editingPost?.id ?? `new-${newSlot?.date}-${newSlot?.time}`}
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={editingPost ? handleDelete : undefined}
        initial={modalInitial}
        accent={venue.accent}
        venueSlug={venue.slug}
      />

      <ToastViewport toast={toast} />
    </div>
  );
}
