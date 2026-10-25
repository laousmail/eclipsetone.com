#!/usr/bin/env python3
"""Builds the secondary pages (blog, privacy) in the same design as the homepage.

Header, menu, help button and footer are copied from index.html, so a change there
reaches every page the next time this runs:  python3 docs/build_pages.py
Blog posts come from docs/blog.json.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME = (ROOT / 'index.html').read_text()
VERSION = re.search(r'home\.css\?v=([\w.]+)', HOME).group(1)


def bi(en, fr):
    fr = re.sub(r' ([?:!;»])', '\u00a0\\1', fr)
    return f'<span data-lang="en">{en}</span><span data-lang="fr">{fr}</span>'


def rebase(fragment, pre):
    """Point homepage-relative links at the site root from a page `pre` levels deep."""
    def fix(m):
        attr, url = m.group(1), m.group(2)
        if re.match(r'^(https?:|mailto:|tel:|//|data:)', url):
            return m.group(0)
        if url.startswith('#'):
            url = 'index.html' + url if url != '#top' else 'index.html'
        return f'{attr}="{pre}{url}"'
    return re.sub(r'(href|src)="([^"]*)"', fix, fragment)


def part(pattern):
    return re.search(pattern, HOME, flags=re.S).group(0)


HEADER = part(r'<header class="nav">.*?</header>')
FAB = part(r'<a class="help-fab".*?</a>')
FOOTER = part(r'<footer class="foot">.*?</footer>')
ICONS = (ROOT / 'docs/icons.html').read_text().strip()
THEME = part(r'<script>\(function\(\)\{try\{var t=localStorage.*?</script>')
FONTS = '<link rel="preload" href="{pre}fonts/inter.woff2" as="font" type="font/woff2" crossorigin />\n<link rel="preload" href="{pre}fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin />'


def page(path, title, desc, main, current=None, lang='en', og_type='website', alternates=None):
    depth = path.count('/')
    pre = '../' * depth
    url = 'https://eclipsetone.com/' + re.sub(r'index\.html$', '', path)
    header = rebase(HEADER, pre)
    # alternates: {'en': 'blog/x.html', 'fr': 'blog/x.fr.html'}; every version lists all of them, itself included
    hreflang = ''.join(f'<link rel="alternate" hreflang="{code}" href="https://eclipsetone.com/{alt}" />\n' for code, alt in (alternates or {}).items())
    if alternates:
        hreflang += f'<link rel="alternate" hreflang="x-default" href="https://eclipsetone.com/{alternates["en"]}" />\n'
    if current:
        header = header.replace(f'href="{pre}{current}"', f'href="{pre}{current}" aria-current="page"')
    doc = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="UTF-8" />
{THEME}
<link rel="icon" type="image/svg+xml" href="{pre}favicon.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}" />
<link rel="canonical" href="{url}" />
{hreflang}<meta property="og:type" content="{og_type}" />
<meta property="og:url" content="{url}" />
<meta property="og:title" content="{html.escape(title)}" />
<meta property="og:description" content="{html.escape(desc)}" />
<meta property="og:image" content="https://eclipsetone.com/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
{FONTS.format(pre=pre)}
<link rel="stylesheet" href="{pre}home.css?v={VERSION}" />
</head>
<body class="subpage">
{ICONS}
<a class="skip" href="#main">{bi('Skip to content', 'Aller au contenu')}</a>
{header}
<main id="main">
{main}
</main>
{rebase(FAB, pre)}
{rebase(FOOTER, pre)}
<script src="{pre}config.js?v={VERSION}"></script>
<script src="{pre}currency.js?v={VERSION}"></script>
<script src="{pre}analytics.js?v={VERSION}"></script>
<script src="{pre}main.js?v={VERSION}" defer></script>
<script src="{pre}project.js?v={VERSION}" defer></script>
</body>
</html>
'''
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc)
    return out




# ---------------- blog ----------------
def build_blog():
    posts = json.loads((ROOT / 'docs/blog.json').read_text())
    items = ''.join(f'''<a class="team-card reveal" href="{p['slug']}.html">
<span class="team-card-t"><small>{p['date']}</small><b>{bi(p['title_en'], p['title_fr'])}</b><small>{bi(p['teaser_en'], p['teaser_fr'])}</small></span>
<span class="row-go" aria-hidden="true">›</span></a>''' for p in posts)
    main = f'''<section class="sec page-head">
<p class="kicker">Blog</p>
<h1>{bi('Notes from the studio.', 'Notes du studio.')}</h1>
</section>
<section class="sec team-grid one">{items}</section>'''
    page('blog/index.html', 'Blog · EclipseTone', 'Notes from the EclipseTone studio in Montréal.', main, current='blog/index.html')
    for p in posts:
        for lang in ('en', 'fr'):
            body = ''.join(p[f'body_{lang}'])
            other = f"{p['slug']}.fr.html" if lang == 'en' else f"{p['slug']}.html"
            main = f'''<section class="sec page-head">
<a class="back" href="index.html">{'← All posts' if lang == 'en' else '← Tous les articles'}</a>
<p class="kicker">{p['date']}</p>
<h1>{p['title_' + lang]}</h1>
</section>
<section class="sec"><article class="card prose post">{body}
<p class="post-actions"><a class="btn ghost" href="{other}">{'Lire en français' if lang == 'en' else 'Read in English'}</a></p></article></section>'''
            name = f"{p['slug']}.html" if lang == 'en' else f"{p['slug']}.fr.html"
            alts = {'en': f"blog/{p['slug']}.html", 'fr': f"blog/{p['slug']}.fr.html"}
            page(f'blog/{name}', p['title_' + lang] + ' · EclipseTone', p['teaser_' + lang], main, lang=lang, current='blog/index.html', og_type='article', alternates=alts)


# ---------------- privacy ----------------
def build_privacy():
    main = (ROOT / 'docs/privacy.html').read_text()
    page('privacy/index.html', 'Privacy policy · EclipseTone', 'How EclipseTone collects, uses and protects your personal information.', main)


if __name__ == '__main__':
    build_blog()
    build_privacy()
    print('built')
