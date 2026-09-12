---
name: ENG//HABIT
description: Ứng dụng xây dựng và duy trì thói quen học tiếng Anh — nền xanh dương pastel điềm tĩnh, viền rõ thay bóng đổ.
colors:
  sky-blue: "#6090CF"
  sky-blue-strong: "#1E4E8C"
  sky-blue-soft: "#E8F1FC"
  sky-blue-vivid: "#A8C9EC"
  logo-gold: "#EAB22D"
  logo-gold-ink: "#7D5900"
  pastel-page: "#E7EFFA"
  card-white: "#FFFFFF"
  ink-navy: "#18212E"
  ink-soft: "#44536A"
  ink-muted: "#5E6D83"
  line-control: "#6E8199"
  success-green: "#2F7A4D"
  danger-red: "#B03A2E"
typography:
  display:
    fontFamily: "Inter var, Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter var, Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter var, Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter var, Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter var, Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "Inter var, Inter, system-ui, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "2px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  control-y: "8px"
  control-x: "12px"
  card-padding: "20px"
  field-gap: "20px"
  section-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.sky-blue}"
    textColor: "#0F1B2E"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.sky-blue-strong}"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
  input:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
---

# Design System: ENG//HABIT

## Overview

**Creative North Star: "The Calm Sky"**

ENG//HABIT is a habit-tracking layer wrapped around English vocabulary practice — the
product bet is that people don't lack study material, they lack a reason to come back
tomorrow. The interface earns that trust by staying out of the way: a pastel sky-blue
system page, white cards with a visible border instead of a dramatic shadow, one restrained
blue for action and one warm gold borrowed from the mascot logo for the rare moment that
deserves it (a streak flame, a first-place rank, a coin). Nothing here is trying to look
like a game with flashing rewards — the calm is the point, because a habit tool that spikes
your pulse every time you open it is a habit tool people quit.

Density is real: this is an Operate-mode app (dashboards, lists, forms, a sidebar with
eight destinations), and `text-sm`/`text-xs` carry almost the entire UI. The one place the
system allows itself a big moment is a single large number or a single large word —
a stat on a dashboard, a vocabulary word mid-drill — never a decorative headline.

**Confirmed anti-references**: not the saturated, effects-heavy gamification look of
Duolingo-style language apps (loud color, constant motion cues); not a cold, colorless
enterprise-gray look either. The gold accent exists specifically so the app isn't just blue
and white.

**Key Characteristics:**
- Pastel sky-blue system background in light mode, dark navy (never pure black) in dark mode
- White/near-black cards separated from the page by a border, not by elevation
- One brand blue for action + one gold accent for reward moments; no third UI hue
- Two parallel neutral-text scales (in-card vs. on-page) kept deliberately separate
- Short, simple motion — a slide or fade under 500ms, nothing playing on a loop except two
  slow-drifting background blobs on the auth screen

## Colors

Every color below is a role, not a hex pick — light and dark mode each carry their own value
for it (see `docs/color-rules.md`, 25 numbered rules, checked to WCAG 2.2 AA). The values in
the frontmatter above are the **light-mode** canonical values; dark mode substitutes a
lighter step of the same hue rather than inverting it.

### Primary
- **Sky Blue** (`#6090CF`, dark mode `#8FB8EC`): the one brand color. Used for primary
  buttons, active nav state, focus rings, links inside cards (as **Sky Blue Strong**,
  `#1E4E8C`, 8.32:1 on a card — the base Sky Blue only clears 3.29:1, too low for text).
  It is deliberately the *lightest* step of this hue that still holds a 3:1 boundary against
  a white card — a softer pastel would let button edges disappear into the card.

### Secondary
- **Logo Gold** (`#EAB22D`): the warm complement to Sky Blue, pulled straight from the
  mascot logo. Reserved for reward and achievement moments — the streak flame, first place
  on the leaderboard, XP/level badges — never used as a second action color. Its rarity is
  what makes it register as "you earned something."

### Neutral
- **Pastel Page** (`#E7EFFA`, dark mode `#141B26`): the system background — sidebar, top
  bar, the canvas behind every card. This is the largest color area on screen and where the
  "pastel" feeling of the whole app actually comes from, not from the buttons.
- **Card White** (`#FFFFFF`, dark mode `#1E2733`): every card, dropdown, and modal surface.
- **Ink Navy** (`#18212E`, dark mode `#E6EAF0`): primary in-card text, 16.21:1 on a card.
- **Ink Soft** (`#44536A`) / **Ink Muted** (`#5E6D83`): secondary and tertiary in-card text.
- **Line Control** (`#6E8199`, dark mode `#77879B`): the one border color allowed to be an
  input's *only* boundary marker — verified 3.99–4.11:1 against the card, the WCAG floor for
  non-text UI. A lighter decorative border (`line-strong`) exists but must never carry this
  job alone.

### Named Rules
**The Two Neutrals Rule.** There are two parallel gray-blue text scales, not one: `content*`
(text inside white cards) and `on-page*` (text directly on the pastel/navy system
background — sidebar, top bar, page titles). Be precise about what that costs today: in dark
mode the two scales are **byte-identical** at every tier, because both backgrounds are dark
and the palette deliberately shares steps; in light mode only the `soft` and `muted` tiers
differ, and only by ~3% lightness, to hold contrast against a pastel page that sits slightly
darker than a white card. So picking the wrong one is close to invisible *right now* — the
split earns its keep against the next background change, not this one. The plum-to-pastel
migration this palette already went through is exactly the event that would have broken a
merged scale, and it is why the two stay separate even while they look alike.

**The One Accent Rule.** Logo Gold is the only warm color in the interface. It marks reward
and rank, nothing else. A second accent hue would blur which moments are actually meant to
feel earned.

**The Categorical Split Rule.** Chart series colors and the activity-calendar heat scale are
a deliberately separate palette from the UI colors above — validated for colorblind
distinction and monotonic brightness, with a fixed series order that must never be
reshuffled to "match the brand better."

## Typography

**Body & UI Font:** Inter var (with Inter, system-ui, Segoe UI fallback) — the only typeface
in the system. No serif, no mono, no second display face.

**Character:** A single, well-hinted grotesque doing every job in the interface — dashboard
numbers, Vietnamese body copy with diacritics, dense sidebar labels — rather than a paired
display/body system. It reads as consistent and utilitarian, which matches the calm,
trustworthy tone rather than announcing itself.

### Hierarchy
- **Display** (700, `clamp(1.875rem, 4vw, 2.25rem)`/30–36px, 1.15 line-height): reserved for
  exactly one thing at a time — a hero stat on a dashboard, the word being drilled in a
  flashcard/exercise, the auth screen's brand headline. Never a page title.
- **Headline** (700, 24px, tracking `-0.015em`): page-level `<h1>` via `PageHeader` — one per
  screen, always paired with `on-page`/`content` tokens depending on where it sits.
- **Title** (600, 18px): section headers, card group titles, modal titles.
- **Body** (400, 14px/`text-sm`): the workhorse size — this single step carries the large
  majority of copy across the app (labels, table cells, button text, form fields).
- **Label** (500, 12px/`text-xs`): meta text, timestamps, helper/hint text under fields —
  nearly as common as Body; this is a dense, data-forward interface. **This is the floor for
  anything a user reads as a sentence**, including error text.
- **Micro** (600, 10px, line-height 1): the one step below Label, and it exists only because
  some containers physically cannot hold 12px — a count inside a 16px badge circle, the level
  chip on a 36px avatar, the weekday letter under a 24px habit cell, and axis/tick labels on
  the charts and activity calendar. Always a number, a single glyph, or a one-word chip;
  never a phrase.

### Named Rules
**The One Big Thing Rule.** Display size appears once per screen at most, on a single number
or word — never as a decorative headline treatment. If a screen wants to feel calm rather
than loud, only one element gets to be large.

**The Micro-Is-Earned Rule.** 10px is allowed only when the container is fixed and genuinely
too small for 12px — badge circles, avatar chips, fixed-size cells, chart ticks. It is never
the answer to "this text felt too heavy": that is what `content-muted` is for. If a phrase
someone has to *read* is at 10px, that is a bug, not a style choice — an error message at
10px was exactly the defect this rule was written after.

## Layout

SPA shell: a collapsible left sidebar (60 → 17 units collapsed) fixed on desktop, sliding
drawer with a backdrop on narrow viewports below the `lg` breakpoint; a sticky top bar
(breadcrumb + stat pills + notification/language/theme controls) above a `max-w-5xl`
centered content column (`px-4 py-6`). No custom spacing scale is defined — the system
relies on Tailwind's default 4px-based steps used consistently: `gap-1.5`/`gap-2.5` inside
compact controls, `py-6`/`space-y-5` between major blocks, `p-5` inside cards. Forms stack
fields vertically with `space-y-5` (20px) and never go multi-column.

Density is deliberately high (Operate mode): tables, sidebars, and stat rows pack `text-sm`
content tightly rather than opening up whitespace for a marketing feel.

## Elevation & Depth

**Flat by intent — the border does the separating, not the shadow.** `shadow-card`
(`0 1px 2px rgb(16 24 40 / .04), 0 1px 3px rgb(16 24 40 / .06)`) is barely perceptible by
design, and in dark mode a shadow against a dark page reads as almost nothing — so every
card additionally carries `border-line` as its real boundary. Depth exists on a very short
ladder above that baseline, reserved for content that must visually float above the page
(dropdown menus, the mobile nav drawer), never for routine cards.

### Shadow Vocabulary
- **card** (`shadow-card`): resting state for every `Card` — a whisper, not a lift.
- **card-hover** (`shadow-card-hover`): the only shadow that changes on interaction, for
  cards marked `interactive`.
- **sm** (Tailwind default): small floating chips — the brand-panel logo badge, minor icon
  containers. The most frequently used shadow step in the codebase.
- **lg** (Tailwind default): popover-style menus — notification bell, language switcher,
  theme toggle dropdowns.
- **xl** (Tailwind default): the mobile navigation drawer — the single most "elevated"
  surface in the app, because it visually sits above a dimmed backdrop.

### Named Rules
**The Border-Over-Bounce Rule.** Never ship a card, modal, or panel that relies on shadow
alone to read as separate from the page. Pair every elevated surface with `border-line` (or
`border-line-page` for chrome on the system background).

## Shapes

Rounded, but not soft-app rounded. `rounded-lg` (8px) is the default for every interactive
surface — buttons, inputs, nav items, individual list rows. `rounded-xl` (12px) steps up one
notch for containers that hold those controls — cards, dropdown panels, the mobile drawer.
`rounded-full` is reserved for things that are conceptually round or infinite in the small
dimension: avatars, badges/pills (QuickStats stat chips, notification/nav count badges),
icon-only circular buttons. `rounded-md` (6px) appears as a quieter secondary step inside
dense contexts; `rounded-2xl` (16px) is rare, for a handful of larger showcase containers.
No sharp corners, no heavy pill-everything treatment — the radius grows with the size of the
container, not at random.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px), never pill-shaped even at small size.
- **Primary:** `bg-brand` (Sky Blue) with dark `on-brand` text (`#0F1B2E`, fixed in both
  themes because the blue itself never goes dark enough to need light text), `shadow-sm`.
  Padding `px-4 py-2` (md) or `px-2.5 py-1.5` (sm).
- **Secondary:** white/card background, soft border, `content-soft` text — same shape and
  padding as primary, quieter fill.
- **Danger:** `bg-danger` with white/`on-fill` text — reserved for destructive confirmation,
  never used for a merely-negative informational state (that's a `danger` Badge instead).
- **Ghost:** no fill or border at rest, `content-muted` text, background appears only on
  hover (`hover:bg-sunken`) — used for icon-only or low-emphasis actions.
- **Hover/Focus/Loading/Disabled:** hover darkens the fill one step (never lightens);
  `:focus-visible` gets the shared 2px Sky-Blue-Strong outline, not a component-local ring;
  `loading` swaps the icon for a spinner and disables the control; `disabled` drops to 50%
  opacity with a not-allowed cursor.

### Chips / Badges
- **Style:** `rounded-full`, five semantic tones (`slate`/`green`/`brand`/`amber`/`red`),
  each a `<tone>-soft` background paired with the matching solid-tone text — never a solid
  fill with white text at badge scale.
- **Stat pills** (top-bar coins/streak/level): a variant with a visible `border-line-page`
  and transparent fill instead of a soft-tone background, because they sit directly on the
  system background rather than inside a card.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `surface` (white / `#1E2733` dark).
- **Shadow Strategy:** `shadow-card` at rest, `shadow-card-hover` only when `interactive`.
- **Border:** always `border-line` — see the Border-Over-Bounce Rule.
- **Internal Padding:** `p-5` (20px).

### Inputs / Fields
- **Style:** `rounded-lg`, `border-line-control` at rest (the one border allowed to be an
  input's sole boundary — see Colors), left-aligned icon at `left-3`, label above in
  `text-sm font-medium content-soft`.
- **Focus:** border shifts to `border-brand` plus a soft 4px `ring-brand/10` halo — a glow,
  not just a color swap.
- **Error:** border and ring shift to the `danger` family; the error message replaces the
  hint in the same slot below the field (never stacks both) and is wired via
  `aria-describedby`, not shown by color alone.
- **Password fields** add a trailing show/hide icon button inside the same input shape.

### Navigation
- **Style:** vertical sidebar, `rounded-lg` items with `px-2.5 py-2`, `on-page-soft` text at
  rest.
- **Active:** `bg-brand-soft` + `text-brand-strong` — a soft fill, not a solid pill, and not
  a left-border accent stripe.
- **Hover:** `bg-hover` + `on-page` text — background darkens on the pastel system surface
  (inverse of a dark-page hover, which would lighten).
- **Badge counts:** `rounded-full bg-brand text-on-brand`, `text-[10px]`, only shown when the
  count is truthy — collapses to a bare dot when the sidebar itself is collapsed.
- **Mobile:** the sidebar becomes a `shadow-xl` slide-in drawer over a `bg-black/50
  backdrop-blur-sm` scrim, closing on outside click, Escape, or navigation.

## Do's and Don'ts

### Do:
- **Do** pair every card/panel/modal with `border-line` — never ship elevation by shadow alone.
- **Do** use `content*` tokens for text inside white cards and `on-page*` tokens for text on
  the sidebar/top-bar/system background — they are not interchangeable, even though they are
  identical in dark mode and nearly identical in light mode today.
- **Do** keep Logo Gold reserved for reward/rank moments (streak, XP, rank #1) — not as a
  general second accent color.
- **Do** use `border-line-control` (not `border-line-strong`, which is decorative-only) as
  the resting border on any form control.
- **Do** keep Display-size type to one element per screen — a single stat or a single word.

### Don't:
- **Don't** introduce a third UI accent hue beyond Sky Blue and Logo Gold.
- **Don't** use gradients, pure-black backgrounds, or hard offset "neobrutalist" shadows —
  none of those appear anywhere in the current system.
- **Don't** reach for `rounded-full` on anything that isn't conceptually round/pill-shaped
  (avatars, badges, icon-only circular buttons) — regular controls stay `rounded-lg`.
- **Don't** rely on color alone to signal a state change (e.g. streak alive vs. broken) —
  pair it with an accessible name or visible text, not just an icon tint.
- **Don't** animate more than one authored moment per view; the two slow background blobs on
  the auth screen are the ceiling for ambient motion, not a starting point to build on.
