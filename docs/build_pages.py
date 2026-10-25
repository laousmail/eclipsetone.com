#!/usr/bin/env python3
"""Builds every public page of the site, in English and in French.

Edit the bilingual sources, then run:  python3 docs/build_pages.py

- src/index.html, src/services/index.html: homepage and prices (both languages in one file,
  marked with data-lang="en" / data-lang="fr", French title and descriptions in data-fr="…")
- docs/services.json: one page per service
- docs/blog.json: blog posts
- docs/privacy.html: privacy policy

Each page is written twice: English at its normal address, French under fr/ (blog posts keep
their .fr.html address). Each version keeps only its own language, links to the other one
(hreflang), and its links point at pages in the same language. sitemap.xml is rebuilt too.
Header, menu, help button and footer come from src/index.html.
"""
import html
import json
import posixpath
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://eclipsetone.com/'
HOME = (ROOT / 'src/index.html').read_text()
VERSION = re.search(r'home\.css\?v=([\w.]+)', HOME).group(1)
SERVICES = json.loads((ROOT / 'docs/services.json').read_text())
POSTS = json.loads((ROOT / 'docs/blog.json').read_text())

# English page -> its French twin. Every link between pages is translated through this table.
FR_PATHS = {
    'index.html': 'fr/index.html',
    'services/index.html': 'fr/services/index.html',
    'blog/index.html': 'fr/blog/index.html',
    'privacy/index.html': 'fr/privacy/index.html',
}
FR_PATHS.update({f"{s['slug_en']}/index.html": f"fr/{s['slug_fr']}/index.html" for s in SERVICES})
FR_PATHS.update({f"blog/{p['slug']}.html": f"blog/{p['slug']}.fr.html" for p in POSTS})

ARIA_FR = {
    'Primary': 'Principal', 'Footer': 'Pied de page', 'Language': 'Langue', 'Switch theme': 'Changer de thème',
    'Proof': 'Preuves', '5 stars': '5 étoiles', 'Questions? WhatsApp': 'Questions ? WhatsApp',
    'laousmail.com — artist site': 'laousmail.com — site d’artiste', 'Currency': 'Devise', 'Included': 'Inclus',
    'Not included': 'Non inclus', 'Jump to': 'Aller à', 'Quantity': 'Quantité', 'Services': 'Services',
}


def bi(en, fr):
    fr = re.sub(r' ([?:!;»])', ' \\1', fr)
    return f'<span data-lang="en">{en}</span><span data-lang="fr">{fr}</span>'


def clean(path):
    """Public URL path: folders end with a slash."""
    return re.sub(r'(^|/)index\.html$', r'\1', path)


# ---------------- one language out of a bilingual page ----------------
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}


class LangFilter(HTMLParser):
    """Copies the document as written, minus every element marked for the other language."""

    def __init__(self, keep):
        super().__init__(convert_charrefs=False)
        self.keep, self.out, self.skip = keep, [], 0

    def _emit(self, text):
        if not self.skip:
            self.out.append(text)

    def _other(self, attrs):
        lang = dict(attrs).get('data-lang')
        return lang is not None and lang != self.keep

    def handle_starttag(self, tag, attrs):
        if self.skip:
            self.skip += tag not in VOID
        elif self._other(attrs):
            self.skip = int(tag not in VOID)
        else:
            self.out.append(self.get_starttag_text())

    def handle_startendtag(self, tag, attrs):
        if not self.skip and not self._other(attrs):
            self.out.append(self.get_starttag_text())

    def handle_endtag(self, tag):
        if self.skip:
            self.skip -= tag not in VOID
        else:
            self.out.append(f'</{tag}>')

    def handle_data(self, data): self._emit(data)
    def handle_entityref(self, name): self._emit(f'&{name};')
    def handle_charref(self, name): self._emit(f'&#{name};')
    def handle_comment(self, data): self._emit(f'<!--{data}-->')
    def handle_decl(self, decl): self._emit(f'<!{decl}>')
    def handle_pi(self, data): self._emit(f'<?{data}>')
    def unknown_decl(self, data): self._emit(f'<![{data}]>')


def keep_lang(doc, lang):
    f = LangFilter(lang)
    f.feed(doc)
    f.close()
    return ''.join(f.out)


def relink(doc, src, out, lang):
    """Links were written for a page at `src` (English); rewrite them for `out` in `lang`.
    A link with hreflang is a language switch: it keeps its target language."""
    def tag(m):
        t = m.group(0)
        to_lang = lang if 'hreflang=' not in t else ''
        return re.sub(r'\b(href|src)="([^"]*)"', lambda a: fix(a, to_lang), t)

    def fix(m, lang):
        attr, url = m.group(1), m.group(2)
        if not url or url.startswith(('#', '$', '{')) or re.match(r'^[a-z][a-z0-9+.-]*:|^//', url, re.I):
            return m.group(0)
        parts = urlsplit(url)
        target = posixpath.normpath(posixpath.join(posixpath.dirname(src), parts.path or posixpath.basename(src)))
        if parts.path.endswith('/') or parts.path in ('', '.', './'):
            target = posixpath.join(target, 'index.html') if not target.endswith('.html') else target
        if lang == 'fr':
            target = FR_PATHS.get(target, target)
        rel = posixpath.relpath(target, posixpath.dirname(out) or '.')
        if parts.path.endswith('/') and rel.endswith('index.html'):
            rel = rel[:-len('index.html')] or './'
        rel += ('?' + parts.query if parts.query else '') + ('#' + parts.fragment if parts.fragment else '')
        return f'{attr}="{rel}"'
    return re.sub(r'<[a-zA-Z][^>]*>', tag, doc)


def finalize(doc, src, out, lang, alts):
    """Turn a bilingual page written for `src` into the `lang` page at `out`."""
    doc = add_footer_links(doc, src)
    if lang == 'fr':
        doc = re.sub(r'<title data-fr="([^"]*)">.*?</title>', r'<title>\1</title>', doc, flags=re.S)
        doc = re.sub(r'content="[^"]*" data-fr="([^"]*)"', r'content="\1"', doc)
        doc = re.sub(r'aria-label="([^"]*)"', lambda m: f'aria-label="{ARIA_FR.get(m.group(1), m.group(1))}"', doc)
    else:
        doc = re.sub(r' data-fr="[^"]*"', '', doc)
    doc = re.sub(r'<html lang="[a-z]+"', f'<html lang="{lang}"', doc, count=1)
    url = SITE + clean(out)
    doc = re.sub(r'<link rel="canonical" href="[^"]*" />', f'<link rel="canonical" href="{url}" />', doc, count=1)
    doc = re.sub(r'<meta property="og:url" content="[^"]*" />', f'<meta property="og:url" content="{url}" />', doc, count=1)
    doc = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*" />\n?', '', doc)
    doc = re.sub(r'<meta property="og:locale" content="[^"]*" />\n?', '', doc)
    head = ''.join(f'<link rel="alternate" hreflang="{code}" href="{SITE}{clean(p)}" />\n' for code, p in alts.items())
    head += f'<link rel="alternate" hreflang="x-default" href="{SITE}{clean(alts["en"])}" />\n'
    head += f'<meta property="og:locale" content="{"fr_CA" if lang == "fr" else "en_CA"}" />\n'
    doc = doc.replace(f'<link rel="canonical" href="{url}" />\n', f'<link rel="canonical" href="{url}" />\n{head}', 1)
    doc = relink(keep_lang(doc, lang), src, out, lang)
    # The other language, as a plain link every crawler can follow
    other = 'en' if lang == 'fr' else 'fr'
    rel = posixpath.relpath(alts[other], posixpath.dirname(out) or '.')
    if rel.endswith('index.html'):
        rel = rel[:-len('index.html')] or './'
    label = 'English' if other == 'en' else 'Français'
    doc = doc.replace('</nav>\n</footer>', f'<a href="{rel}" hreflang="{other}" lang="{other}">{label}</a></nav>\n</footer>', 1)
    return doc


def add_footer_links(doc, src):
    """Every page links to every service page from the footer."""
    if 'class="foot-svc"' in doc:
        return doc
    base = posixpath.dirname(src) or '.'
    links = ''.join(f'<a href="{posixpath.relpath(s["slug_en"], base)}/">{bi(s["nav_en"], s["nav_fr"])}</a>' for s in SERVICES)
    return doc.replace('<nav aria-label="Footer">', f'<nav class="foot-svc" aria-label="Services">{links}</nav>\n<nav aria-label="Footer">', 1)


def write(path, doc):
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc)


def publish(doc, en_path):
    """Write the English page and its French twin from one bilingual document."""
    alts = {'en': en_path, 'fr': FR_PATHS[en_path]}
    write(en_path, finalize(doc, en_path, en_path, 'en', alts))
    write(alts['fr'], finalize(doc, en_path, alts['fr'], 'fr', alts))


# ---------------- shared page shell ----------------
def part(pattern):
    return re.search(pattern, HOME, flags=re.S).group(0)


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


HEADER = part(r'<header class="nav">.*?</header>')
FAB = part(r'<a class="help-fab".*?</a>')
FOOTER = part(r'<footer class="foot">.*?</footer>')
ICONS = (ROOT / 'docs/icons.html').read_text().strip()
THEME = part(r'<script>\(function\(\)\{try\{var t=localStorage.*?</script>')
FONTS = '<link rel="preload" href="{pre}fonts/inter.woff2" as="font" type="font/woff2" crossorigin />\n<link rel="preload" href="{pre}fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin />'


def page(path, title, desc, main, current=None, og_type='website', title_fr=None, desc_fr=None, head_extra=''):
    """A bilingual document for the English page at `path` (see publish / finalize)."""
    pre = '../' * path.count('/')
    header = rebase(HEADER, pre)
    if current:
        header = header.replace(f'href="{pre}{current}"', f'href="{pre}{current}" aria-current="page"')
    fr_t = f' data-fr="{html.escape(title_fr)}"' if title_fr else ''
    fr_d = f' data-fr="{html.escape(desc_fr)}"' if desc_fr else ''
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
{THEME}
<link rel="icon" type="image/svg+xml" href="{pre}favicon.svg" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title{fr_t}>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}"{fr_d} />
<link rel="canonical" href="{SITE}{clean(path)}" />
<meta property="og:type" content="{og_type}" />
<meta property="og:url" content="{SITE}{clean(path)}" />
<meta property="og:title" content="{html.escape(title)}"{fr_t} />
<meta property="og:description" content="{html.escape(desc)}"{fr_d} />
<meta property="og:image" content="{SITE}og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
{FONTS.format(pre=pre)}
<link rel="stylesheet" href="{pre}home.css?v={VERSION}" />
{head_extra}</head>
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


# ---------------- homepage and prices ----------------
def build_sources():
    for en_path in ('index.html', 'services/index.html'):
        publish((ROOT / 'src' / en_path).read_text(), en_path)


# ---------------- one page per service ----------------
STEPS = [
    ('You send a voice memo', 'Tu envoies un mémo vocal', 'Or lyrics, or a beat', 'Ou des paroles, ou une prod'),
    ('We build it in the studio', 'On la construit au studio', 'First version in 7 days', 'Première version en 7 jours'),
    ('You release it', 'Tu la sors', 'Finished in 2 to 3 weeks, 100% yours', 'Finie en 2 à 3 semaines, 100 % à toi'),
]


def build_services():
    for s in SERVICES:
        path = f"{s['slug_en']}/index.html"
        items = ''.join(f'<li>{bi(en, fr)}</li>' for en, fr in zip(s['items_en'], s['items_fr']))
        steps = ''
        if s.get('steps'):
            steps = f'''<h2>{bi('How it works', 'Comment ça marche')}</h2>
<ol>{''.join(f'<li><b>{bi(a, b)}</b> {bi(c, d)}</li>' for a, b, c, d in STEPS)}</ol>'''
        if s['start']:
            cta = f'<a class="btn big cta-go" href="../index.html#start" data-start="{s["start"]}">{bi("Start your project", "Lance ton projet")}</a>'
        else:
            cta = f'<a class="btn big cta-go" href="../{s["cta"]}">{bi("See formats and order", "Voir les formats et commander")}</a>'
        others = ''.join(
            f'<a class="team-card" href="../{o["slug_en"]}/"><span class="team-card-t"><b>{bi(o["nav_en"], o["nav_fr"])}</b></span><span class="row-go" aria-hidden="true">›</span></a>'
            for o in SERVICES if o is not s)
        main = f'''<section class="sec page-head svc-head">
<p class="kicker">{bi(s['nav_en'], s['nav_fr'])}</p>
<h1>{bi(s['h1_en'], s['h1_fr'])}</h1>
<p class="lede">{bi(s['lede_en'], s['lede_fr'])}</p>
<p class="svc-price">{bi(s['price_en'], s['price_fr'])}</p>
<div class="cta">{cta}</div>
</section>
<section class="sec"><div class="card prose svc-body">
<h2>{bi('What you get', 'Ce que tu reçois')}</h2>
<ul>{items}</ul>
{steps}
<p class="svc-more"><a href="../services/">{bi('See every price', 'Voir tous les prix')}</a> · {bi('In Canadian dollars. Taxes added for clients in Canada.', 'En dollars canadiens. Taxes en sus pour les clients au Canada.')}</p>
</div></section>
<section class="sec svc-others">
<h2>{bi('Same team, everything else.', 'Même équipe, tout le reste.')}</h2>
<div class="team-grid">{others}</div>
</section>'''
        offer = f',\n  "offers": {{"@type": "Offer", "priceCurrency": "CAD", "price": "{s["price"]}"}}' if s.get('price') else ''
        ld = f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": {json.dumps(s['nav_en'])},
  "description": {json.dumps(s['desc_en'])},
  "provider": {{"@type": "ProfessionalService", "name": "EclipseTone Productions", "url": "{SITE}", "telephone": "+1-438-466-8971", "address": {{"@type": "PostalAddress", "addressLocality": "Montréal", "addressRegion": "QC", "addressCountry": "CA"}}}},
  "areaServed": "Worldwide"{offer}
}}
</script>
'''
        doc = page(path, s['title_en'], s['desc_en'], main, title_fr=s['title_fr'], desc_fr=s['desc_fr'], head_extra=ld)
        publish(doc, path)


# ---------------- blog ----------------
def build_blog():
    items = ''.join(f'''<a class="team-card reveal" href="{p['slug']}.html">
<span class="team-card-t"><small>{p['date']}</small><b>{bi(p['title_en'], p['title_fr'])}</b><small>{bi(p['teaser_en'], p['teaser_fr'])}</small></span>
<span class="row-go" aria-hidden="true">›</span></a>''' for p in POSTS)
    main = f'''<section class="sec page-head">
<p class="kicker">Blog</p>
<h1>{bi('Notes from the studio.', 'Notes du studio.')}</h1>
</section>
<section class="sec team-grid one">{items}</section>'''
    doc = page('blog/index.html', 'Blog · EclipseTone', 'Notes from the EclipseTone studio in Montréal: songs, releases and how we work.', main,
               current='blog/index.html', title_fr='Blog · EclipseTone', desc_fr='Notes du studio EclipseTone à Montréal : chansons, sorties et notre façon de travailler.')
    publish(doc, 'blog/index.html')
    for p in POSTS:
        en, fr = f"blog/{p['slug']}.html", f"blog/{p['slug']}.fr.html"
        for lang, out in (('en', en), ('fr', fr)):
            body = ''.join(p[f'body_{lang}'])
            main = f'''<section class="sec page-head">
<a class="back" href="index.html">{'← All posts' if lang == 'en' else '← Tous les articles'}</a>
<p class="kicker">{p['date']}</p>
<h1>{p['title_' + lang]}</h1>
</section>
<section class="sec"><article class="card prose post">{body}
<p class="post-actions"><a class="btn ghost" href="{p['slug']}.{'fr.' if lang == 'en' else ''}html" hreflang="{'fr' if lang == 'en' else 'en'}">{'Lire en français' if lang == 'en' else 'Read in English'}</a></p></article></section>'''
            doc = page(en, p['title_' + lang] + ' · EclipseTone', p['teaser_' + lang], main, current='blog/index.html', og_type='article')
            # The post text is already in one language; the shared header and footer still need filtering
            write(out, finalize(doc, en, out, lang, {'en': en, 'fr': fr}))


# ---------------- privacy ----------------
def build_privacy():
    main = (ROOT / 'docs/privacy.html').read_text()
    doc = page('privacy/index.html', 'Privacy policy · EclipseTone', 'How EclipseTone collects, uses and protects your personal information.', main,
               title_fr='Politique de confidentialité · EclipseTone', desc_fr='Comment EclipseTone recueille, utilise et protège tes renseignements personnels.')
    publish(doc, 'privacy/index.html')


# ---------------- sitemap ----------------
def build_sitemap():
    rows = []
    for en, fr in FR_PATHS.items():
        alt = (f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}{clean(en)}" />\n'
               f'    <xhtml:link rel="alternate" hreflang="fr" href="{SITE}{clean(fr)}" />\n')
        for p in (en, fr):
            rows.append(f'  <url>\n    <loc>{SITE}{clean(p)}</loc>\n{alt}  </url>\n')
    write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
          + ''.join(rows) + '</urlset>\n')


if __name__ == '__main__':
    build_sources()
    build_services()
    build_blog()
    build_privacy()
    build_sitemap()
    print(f'built {len(FR_PATHS) * 2} pages')
