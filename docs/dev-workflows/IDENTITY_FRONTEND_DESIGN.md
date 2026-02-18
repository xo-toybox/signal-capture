# Frontend Design Identity

<!-- 
    This document defines design character and principles, not implementation rules.
    Don't add specific CSS values, class names, or pixel measurements here.
    Those belong in code. This belongs in your head. 
-->

## North Star

**"Easy to use, happy to look at."**

If it's not immediately intuitive, it fails "easy to use." If it doesn't bring a moment of visual pleasure, it fails "happy to look at." These aren't in tension — the best interfaces are both.

This is functional craft: every element earns its place, and what's present is executed with care. A tool you love reaching for — delight, not just utility. Utility-grade density, product-grade polish.

---

## Design Principles

### Essential, not minimal

Everything present is necessary. Nothing decorative. But what IS present is crafted with obsessive care. Minimalism removes until it hurts; essentialism keeps exactly what's needed and makes it excellent.

**This, not that:** A severity indicator that's four tiny dots — dense and satisfying to tap — not a big labeled dropdown. But also not removing the indicator entirely because "minimal."

### Dense by design

Signal triage demands information density. You're scanning dozens of signals, comparing priorities, making quick decisions. Density should feel *organized* — a well-designed cockpit, not a cluttered desk.

**This, not that:** A feed showing title, source, and severity in one tight row — not a card with generous padding that shows three items per screen.

### Interactions should feel physical

Things have weight, resistance, momentum. Swipes rubber-band. Borders pulse. Buttons spring. This is where "fun" lives — in how things *feel*, not how they look. A physically-grounded UI rewards muscle memory and makes repeated actions satisfying instead of tedious.

**This, not that:** A swipe-to-archive with rubber-banding and a two-stage commitment threshold — not a slide-to-reveal button that moves linearly.

### Color means something

Dark backgrounds push attention to content. Color appears sparingly and always carries meaning — status, severity, action type. When everything is quiet, a single amber dot *screams*. That only works if color is never decorative.

**This, not that:** A thin colored left edge on a card indicating signal type — not a gradient header that "looks nice."

### Touch-first, keyboard-deep

Mobile is the capture device. Desktop is the power-user device. Both get first-class interaction design tuned to their input method. Mobile gestures should feel native. Desktop shortcuts should feel powerful.

**This, not that:** Swipe gestures on mobile, keyboard shortcuts on desktop — both doing the same thing, both feeling native to their platform.

---

## Visual Character

- **Dark and quiet** — near-black surfaces, soft off-white text, borders that whisper. The UI recedes so content advances.

- **Monospace as voice** — the UI speaks in monospace: labels, buttons, metadata, navigation. Body content speaks in sans-serif. This split gives the tool its character — technical but readable.

- **Layered darkness** — surfaces differentiate through barely-perceptible shade shifts, not borders or shadows. When a border does appear, it's at very low opacity. The result feels like depth without decoration.

- **Restrained type scale** — small, dense, uniform. Hierarchy comes through weight and opacity, not size jumps. A bold label at the same size as body text creates distinction without shouting.

- **Status through color** — a thin colored edge or a small dot carries more information than a banner. Color is concentrated into the smallest possible element that still communicates clearly.

---

## Interaction Character

- **Physical** — spring curves, rubber-banding, momentum. Interactions have inertia and settle naturally. Not linear, not instant, not floaty.

- **Responsive** — immediate feedback on every action. Optimistic updates where safe. The UI should never feel like it's waiting for permission.

- **Forgiving** — destructive actions need a second confirmation, not a modal. Prefer undo over confirm. Make it easy to recover, not hard to act.

- **Platform-native** — respect OS conventions. iOS back-gesture zone. Platform modifier keys. Standard text selection. Don't fight the platform to impose consistency.

- **Progressive disclosure** — show the essential, reveal the rest. The feed shows title and metadata; the detail page reveals everything. Complexity is available, never imposed.

---

## What We're Not

- **Not decorative** — no ornament for its own sake. No gradients, no visual sugar, no elements that exist only to "fill space."

- **Not loud** — nothing screams. Even errors are communicated quietly and precisely. Urgency comes from placement and color, not from size or motion.

- **Not generic** — this is a personal tool with a specific voice, not a SaaS dashboard. It should feel like it was built by someone who uses it every day.

- **Not flashy** — animations serve comprehension and delight, never spectacle. If you notice the animation before the content, it's too much.

- **Not rigid** — the identity is about character, not rules. If breaking a convention makes something easier to use or happier to look at, break it.

---

## Desktop & Mobile

**Desktop:** Keyboard shortcuts should be standard and discoverable — shown inline, platform-aware (Cmd on Mac, Ctrl elsewhere). Hover states add information, not just decoration. Dense layouts are fine; screens are big. Power-user affordances (multi-select, bulk actions, keyboard navigation) belong here.

**Mobile:** Touch targets must be at least 44px. Swipe gestures for common actions. Bottom-anchored modals and sheets. Hide keyboard hints that don't apply. The capture experience — typing, voice, share-to-app — is the priority. Every interaction must work with one thumb.

**Both:** Test every feature on both. If it's not usable on one, it's not done.

### Failure modes

- Icons describe the destination, not the mechanism. A panel icon for a sidebar, not a hamburger.
- Interactive elements belong in the layout, not floating over it.
- Active states use accent color. Background-only shifts are invisible.

---

## Exemplars

Existing features that best embody this identity. Not sacred — they can evolve. They're reference points for the *level of care*, not the specific implementation.

### Swipe system (`use-swipe` + `SwipeableCard`)

"Interactions that feel physical." Rubber-banding at the edges, direction-locking so horizontal swipes don't fight vertical scroll, two-stage commitment so a half-swipe previews and a full swipe commits. This is what touch-first craft feels like.

### Pulsing textarea border (`globals.css` → `pulse-border`)

"Uncommon care." A subtle heartbeat on a focused input. The tool feels alive, not dead. This is what "happy to look at" means in a text field — a detail nobody asked for that everyone notices.

### Severity dots (`BugReporterModal`)

"Essential, not minimal." Four tiny circles that grow and glow when selected. Maximum information in minimum pixels, unexpectedly satisfying to tap. Dense, meaningful, delightful.

---

## The Identity Test

Questions to ask when building something new:

1. Is this easy to use on first encounter?
2. Does it look like it belongs in this app?
3. Would I be happy looking at this every day?
4. Does the interaction feel physical and responsive?
5. Is every element earning its place?
6. Could this be simpler without losing function?
