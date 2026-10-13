"""Sanity-check the storefront demos.

Not a design review — that needs eyes. This catches the mechanical failures a
customer would notice: missing pages, broken internal links, content that was
paraphrased instead of used, missing accessibility basics.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CONTENT = json.loads((ROOT / "_content.json").read_text(encoding="utf-8"))

PAGES = ["index.html", "readings.html", "about.html", "book.html", "contact.html"]

# Strings that must appear somewhere in each site, proving real content was used.
MUST_APPEAR = [CONTENT["practitioner"]["name"]] + [s["name"] for s in CONTENT["services"]]
PRICES = [s["price"] for s in CONTENT["services"]]

designs = sorted(d for d in ROOT.iterdir() if d.is_dir() and re.match(r"^\d\d-", d.name))
problems_total = 0

for design in designs:
    problems = []
    texts = {}

    for page in PAGES:
        path = design / page
        if not path.exists():
            problems.append(f"MISSING PAGE: {page}")
            continue
        texts[page] = path.read_text(encoding="utf-8", errors="replace")

    if texts:
        joined = "\n".join(texts.values())

        # Content fidelity
        for needle in MUST_APPEAR:
            if needle not in joined:
                problems.append(f"content missing: {needle!r}")
        missing_prices = [p for p in PRICES if p not in joined]
        if missing_prices:
            problems.append(f"prices missing: {missing_prices}")

        # Per-page structural checks
        for page, html in texts.items():
            h1 = len(re.findall(r"<h1\b", html, re.I))
            if h1 != 1:
                problems.append(f"{page}: {h1} <h1> tags (want exactly 1)")
            if "<nav" not in html.lower():
                problems.append(f"{page}: no <nav>")
            if "<footer" not in html.lower():
                problems.append(f"{page}: no <footer>")
            if 'lang=' not in html[:400].lower():
                problems.append(f"{page}: no lang attribute on <html>")
            if "viewport" not in html.lower():
                problems.append(f"{page}: no viewport meta")
            if "aria-current" not in html.lower():
                problems.append(f"{page}: nav does not mark the current page")

            # Internal links must resolve
            for href in re.findall(r'href="([^"#?:]+\.html)"', html):
                if not (design / href).exists():
                    problems.append(f"{page}: broken link -> {href}")

        # Motion safety + external images
        css_files = list(design.glob("*.css"))
        css = "\n".join(c.read_text(encoding="utf-8", errors="replace") for c in css_files)
        if "prefers-reduced-motion" not in (css + joined):
            problems.append("no prefers-reduced-motion handling")
        for m in re.findall(r'<img[^>]+src="(https?://[^"]+)"', joined):
            problems.append(f"external image (not allowed): {m}")
        if not css_files:
            problems.append("no stylesheet found")

    status = "OK" if not problems else f"{len(problems)} problem(s)"
    print(f"\n=== {design.name} — {status} ===")
    for p in problems:
        print(f"   - {p}")
    problems_total += len(problems)

print(f"\n{len(designs)} design(s) checked, {problems_total} problem(s) total")
sys.exit(1 if problems_total else 0)
