"""Check the Premium Frontend UI standards were actually applied.

The summaries claim preloaders, cascades, magnetic buttons and so on. This looks
for the evidence in the files, and — more importantly — checks the performance
rules that are easy to claim and easy to break.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
PAGES = ["index.html", "readings.html", "about.html", "book.html", "contact.html"]

# feature name -> (regex, where to look: 'all' | 'css' | 'js')
FEATURES = {
    "entry sequence (preloader)": (r"preload|loader|entry-seq|splash", "all"),
    "word-split headline cascade": (r"aria-hidden|aria-label|\bword\b|split", "html"),
    "scroll-reactive nav": (r"scrollY|lastScroll|prevScroll|scroll-dir|hide-nav|nav--hidden", "js"),
    "magnetic button": (r"magnet|getBoundingClientRect", "js"),
    "grain overlay": (r"feTurbulence|fractalNoise|grain|noise", "all"),
    "parallax": (r"parallax|translate3d|--scroll", "all"),
    # The pointer guard is equally valid in CSS (@media) or in JS (matchMedia) —
    # the JS form is arguably better, since the listeners are never attached at
    # all. An earlier version of this check only looked at CSS and produced a
    # false positive.
    "hover/pointer guard": (r"hover:\s*hover", "css+js"),
    "reduced-motion guard": (r"prefers-reduced-motion", "css+js"),
}

# Animating these in a transition/animation causes layout work every frame.
LAYOUT_PROPS = ("width", "height", "top", "left", "right", "bottom", "margin", "padding")

designs = sorted(d for d in ROOT.iterdir() if d.is_dir() and re.match(r"^\d\d-", d.name))
total_missing = 0
total_perf = 0

for design in designs:
    html = "\n".join(
        (design / p).read_text(encoding="utf-8", errors="replace")
        for p in PAGES if (design / p).exists()
    )
    css = "\n".join(f.read_text(encoding="utf-8", errors="replace") for f in design.glob("*.css"))
    js = "\n".join(f.read_text(encoding="utf-8", errors="replace") for f in design.glob("*.js"))
    buckets = {"all": html + css + js, "html": html, "css": css, "js": js,
               "css+js": css + js}

    missing = [
        name for name, (pattern, where) in FEATURES.items()
        if not re.search(pattern, buckets[where], re.I)
    ]

    # Performance: look for layout-triggering properties inside transition shorthands.
    perf = []
    for decl in re.findall(r"transition\s*:\s*([^;}]+)", css, re.I):
        for prop in LAYOUT_PROPS:
            if re.search(rf"(^|[\s,]){prop}(\s|,|$)", decl, re.I):
                perf.append(f"transition animates '{prop}': {decl.strip()[:70]}")
    # will-change should not be left on permanently everywhere
    wc = len(re.findall(r"will-change", css, re.I))
    if wc > 12:
        perf.append(f"will-change used {wc} times — likely left on permanently")

    status = "OK" if not missing and not perf else "needs attention"
    print(f"\n=== {design.name} — {status} ===")
    if missing:
        print("  not found:")
        for m in missing:
            print(f"    - {m}")
    if perf:
        print("  performance:")
        for p in perf[:6]:
            print(f"    - {p}")
    if not missing and not perf:
        print("  all standards present, no layout-animating transitions")

    total_missing += len(missing)
    total_perf += len(perf)

print(f"\n{len(designs)} design(s): {total_missing} missing feature(s), {total_perf} performance issue(s)")
sys.exit(1 if (total_missing or total_perf) else 0)
