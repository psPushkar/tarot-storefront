# Design 10: Survey

## World
Generic national topographic sheet in the Anglo-European tradition: Ordnance Survey, USGS and Swisstopo rather than any India-specific survey series. The page uses pale drafting paper, hairline grid, contour field, marginalia, hachures, spot heights, leader lines, and a legend that is also the home-page navigation.

## Palette
- `#f3ecdc` paper ground: warm drafting sheet.
- `#e6dac2` paper-deep: aged sheet separation.
- `#2f261a` ink: primary text and map annotation.
- `#5d4c36` ink-soft: secondary text tinted from brown ink.
- `#8b5f33` contour: primary sepia contour lines.
- `#b28b61` contour-light: minor contour lines.
- `#8fa1a0` grid: hairline blue-grey survey grid.
- `#334c54` blue-ink: restrained link text.
- `#b12a1c` surveyor red: only active, selected, focused, and located marks.

## Type
Display face is `Palatino Linotype` / Palatino / Book Antiqua for titles and measured sheet headings. Body face is `Trebuchet MS` / Verdana for small, tracked, precise survey lettering. Data coordinates and grid references use Courier only where measurement notation earns monospace. H1 clamps from 2.2rem to 5.8rem; body measure stays around 70–72ch.

## Contour and grid system
Marginalia uses neutral sheet facts: sheet TS-10, scale, local question grid projection, contour interval, revision date, and worldwide practice. The home sheet uses an authored inline SVG contour field: thirteen irregular Bezier contour paths with varied weights, three terrain clusters, hachures for unavailable ground, reading points sited at spot heights, and leader lines to labels. The CSS grid sits behind the SVG as map paper and subtly offsets through scroll-supporting browsers; reduced motion disables it.

## Component language
Prices lead with USD, with rupees secondary, while preserving both exact prices from the product content. Pages are ruled as survey documents rather than card grids: marginalia strips, profile stacks, record strips, ledgers, fieldsets, hachured unavailable slots, and ruled FAQ details. The home legend is a real `<nav>` with links and symbol labels; interior pages use a conventional nav with `aria-current="page"`.

## State rules
Surveyor red is reserved for active/current/selected/focus states. Reading hover/focus turns the mark red and exposes the SVG spot-height title. Booking service and slot buttons use `aria-pressed`; disabled slots are hachured. Focus outlines are red and visible. The form does not submit.

## Motion and premium constraints
The single authored motion is the contour draw on load via `stroke-dasharray`; `prefers-reduced-motion` resolves contours immediately. The premium checklist’s entry, magnetic, cascade, and scroll items are represented in the sheet idiom without adding competing motion; the craft floor’s one-motion rule wins.

## Responsive behaviour
At tablet width, marginalia wraps, the field widens so labels remain legible, the legend moves below the map, booking steps and slots become two columns, and biographies stack. At phone width, the SVG becomes a wider pan-like sheet, slot columns collapse, and all ruled structures become single-column while keeping the badge and navigation usable.
