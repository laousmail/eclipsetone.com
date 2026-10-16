#!/usr/bin/env python3
"""Builds the secondary pages (team, blog, privacy) in the same design as the homepage.

Header, menu, help button and footer are copied from index.html, so a change there
reaches every page the next time this runs:  python3 docs/build_pages.py
Team member content comes from docs/team.json. Blog posts come from docs/blog.json.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME = (ROOT / 'index.html').read_text()
VERSION = re.search(r'home\.css\?v=([\w.]+)', HOME).group(1)


def bi(en, fr):
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
THEME = part(r'<script>\(function\(\)\{try\{var t=localStorage.*?</script>')
FONTS = part(r'<link rel="preconnect" href="https://fonts.googleapis.com".*?rel="stylesheet" />')


def page(path, title, desc, main, current=None, lang='en', og_type='website'):
    depth = path.count('/')
    pre = '../' * depth
    url = 'https://eclipsetone.com/' + re.sub(r'index\.html$', '', path)
    header = rebase(HEADER, pre)
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
<meta property="og:type" content="{og_type}" />
<meta property="og:url" content="{url}" />
<meta property="og:title" content="{html.escape(title)}" />
<meta property="og:description" content="{html.escape(desc)}" />
<meta property="og:image" content="https://eclipsetone.com/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
{FONTS}
<link rel="stylesheet" href="{pre}home.css?v={VERSION}" />
</head>
<body class="subpage">
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
<script src="{pre}guide.js?v={VERSION}" defer></script>
</body>
</html>
'''
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc)
    return out


CTA = (f'<a class="btn" href="#" data-guide-open>{bi("Start your song", "Commence ta chanson")}</a>')


# ---------------- team ----------------
def releases(p):
    if not p.get('releases'):
        return ''
    rows = ''.join(f'<a class="team-card" href="{r["href"]}" target="_blank" rel="noreferrer"><span class="team-card-t"><small>{r["date"]}</small><b>{r["title"]}</b></span><span class="row-p">{bi("Listen", "Écouter")}</span></a>' for r in p['releases'])
    return f'<section class="sec"><p class="side-t">{bi("Releases", "Sorties")}</p><div class="team-grid">{rows}</div></section>'


def build_team():
    team = json.loads((ROOT / 'docs/team.json').read_text())
    cards = []
    for p in team:
        cards.append(f'''<a class="team-card reveal" href="{p['slug']}.html">
<span class="avatar" aria-hidden="true">{p['name'][0]}</span>
<span class="team-card-t"><b>{p['name']}</b><span class="team-role">{bi(p['role_en'], p['role_fr'])}</span><small>{bi(p['summary_en'], p['summary_fr'])}</small></span>
<span class="row-go" aria-hidden="true">›</span>
</a>''')
    main = f'''<section class="sec page-head">
<p class="kicker">{bi('The team', 'L’équipe')}</p>
<h1>{bi('The people on your record.', 'Les gens derrière ton disque.')}</h1>
<p class="lede">{bi('Real musicians, each with a craft. The team grows as more artists come in.', 'De vrais musiciens, chacun avec son métier. L’équipe grandit avec les artistes.')}</p>
</section>
<section class="sec team-grid">
{chr(10).join(cards)}
</section>
<section class="sec page-cta">
<h2>{bi('Want this team on your song?', 'Tu veux cette équipe sur ta chanson ?')}</h2>
<p class="sub">{bi('Tell us what you have. We reply within 24 hours with your price.', 'Dis-nous ce que tu as. On répond en moins de 24 h avec ton prix.')}</p>
{CTA}
</section>'''
    page('people/index.html', 'The team · EclipseTone', 'The musicians, arrangers and engineers who make EclipseTone records. Human-made, never AI.', main, current='index.html#team')

    for p in team:
        others = [o for o in team if o['slug'] != p['slug']][:5]
        focus_en = ''.join(f'<li>{f}</li>' for f in p['focus_en'])
        focus_fr = ''.join(f'<li>{f}</li>' for f in p['focus_fr'])
        links = ''.join(
            f'<a class="btn ghost" href="{l["href"]}"{" target=\"_blank\" rel=\"noreferrer\"" if l["href"].startswith("http") else ""}>{bi(l["en"], l["fr"])}</a>'
            for l in p.get('links', []))
        bio_en = ''.join(f'<p>{x}</p>' for x in p['bio_en'])
        bio_fr = ''.join(f'<p>{x}</p>' for x in p['bio_fr'])
        main = f'''<section class="sec page-head profile-head">
<a class="back" href="index.html">{bi('← The whole team', '← Toute l’équipe')}</a>
<div class="profile-id">
<span class="avatar big" aria-hidden="true">{p['name'][0]}</span>
<div><h1>{p['name']}</h1><p class="role-line">{bi(p['role_en'], p['role_fr'])}</p></div>
</div>
<p class="lede">{bi(p['summary_en'], p['summary_fr'])}</p>
</section>
<section class="sec profile-body">
<article class="card prose"><div data-lang="en">{bio_en}</div><div data-lang="fr">{bio_fr}</div></article>
<aside class="card profile-side">
<p class="side-t">{bi('What they do', 'Ce qu’il fait')}</p>
<ul class="chips" data-lang="en">{focus_en}</ul><ul class="chips" data-lang="fr">{focus_fr}</ul>
<div class="side-actions">{CTA}{links}</div>
</aside>
</section>
{releases(p)}
<section class="sec more-team">
<p class="side-t">{bi('More from the team', 'Le reste de l’équipe')}</p>
<div class="chip-links">{''.join(f'<a href="{o["slug"]}.html">{o["name"]}</a>' for o in others)}<a href="index.html">{bi('Everyone', 'Tout le monde')}</a></div>
</section>'''
        page(f'people/{p["slug"]}.html', f'{p["name"]}, {p["role_en"]} · EclipseTone', f'{p["name"]}: {p["summary_en"]}', main, current='index.html#team')


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
            page(f'blog/{name}', p['title_' + lang] + ' · EclipseTone', p['teaser_' + lang], main, lang=lang, current='blog/index.html', og_type='article')


# ---------------- privacy ----------------
def build_privacy():
    main = (ROOT / 'docs/privacy.html').read_text()
    page('privacy/index.html', 'Privacy policy · EclipseTone', 'How EclipseTone collects, uses and protects your personal information.', main)


if __name__ == '__main__':
    build_team()
    build_blog()
    build_privacy()
    print('built')
