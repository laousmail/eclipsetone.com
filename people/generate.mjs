import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const profiles = JSON.parse(readFileSync(join(__dirname, 'profiles.json'), 'utf8'))

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function nav(activeSlug) {
  return `<header class="nav">
        <a class="nav-brand" href="../index.html">
          <img src="../eclipsetone-logo.jpg" alt="" width="40" height="40" />
          <span>Eclipse<span class="tone">Tone</span></span>
        </a>
        <div class="nav-actions">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" data-lang-btn="en" aria-pressed="true">EN</button>
            <button type="button" data-lang-btn="fr" aria-pressed="false">FR</button>
          </div>
        </div>
        <input id="nav-menu" class="nav-checkbox" type="checkbox" />
        <label class="nav-toggle" for="nav-menu" aria-label="Menu"><span></span></label>
        <nav class="nav-links" aria-label="Primary">
          <a href="../index.html#team"><span data-lang="en">People</span><span data-lang="fr">Équipe</span></a>
          <a href="index.html"${activeSlug === 'index' ? ' aria-current="page"' : ''}><span data-lang="en">All profiles</span><span data-lang="fr">Tous les profils</span></a>
          <a class="nav-cta" href="../index.html#booking"><span data-lang="en">Book</span><span data-lang="fr">Réserver</span></a>
        </nav>
      </header>`
}

function footer() {
  return `<footer class="footer">
        <div>
          <strong>Eclipse<span class="tone">Tone</span></strong>
          <div>Laousmail · Montréal</div>
        </div>
        <div>© 2026 EclipseTone Productions</div>
      </footer>`
}

function shell({ title, description, body, activeSlug }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="../favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${esc(description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../styles.css" />
    <title>${esc(title)}</title>
  </head>
  <body>
    <div class="site">
      ${nav(activeSlug)}
      ${body}
      ${footer()}
    </div>
    <script src="../main.js" defer></script>
  </body>
</html>
`
}

function profilePage(p, others) {
  const focusEn = p.focus.en.map((f) => `<li>${esc(f)}</li>`).join('')
  const focusFr = p.focus.fr.map((f) => `<li>${esc(f)}</li>`).join('')
  const bodyEn = p.body.en.map((para) => `<p data-lang="en">${esc(para)}</p>`).join('\n          ')
  const bodyFr = p.body.fr.map((para) => `<p data-lang="fr">${esc(para)}</p>`).join('\n          ')
  const more = others
    .filter((o) => o.slug !== p.slug)
    .slice(0, 4)
    .map(
      (o) => `<a class="profile-chip" href="${o.slug}.html">${esc(o.name)}</a>`,
    )
    .join('')

  const body = `<main class="profile">
        <div class="profile-inner">
          <a class="profile-back" href="index.html">
            <span data-lang="en">← All people</span>
            <span data-lang="fr">← Toute l’équipe</span>
          </a>

          <div class="profile-hero">
            <div class="profile-avatar" aria-hidden="true">${esc(p.name.slice(0, 1))}</div>
            <div>
              <p class="section-label">
                <span data-lang="en">Profile</span><span data-lang="fr">Profil</span>
              </p>
              <h1 class="profile-name">${esc(p.name)}</h1>
              <p class="profile-role">
                <span data-lang="en">${esc(p.role.en)}</span>
                <span data-lang="fr">${esc(p.role.fr)}</span>
              </p>
            </div>
          </div>

          <p class="profile-summary">
            <span data-lang="en">${esc(p.summary.en)}</span>
            <span data-lang="fr">${esc(p.summary.fr)}</span>
          </p>

          <div class="profile-grid">
            <div class="profile-copy">
              ${bodyEn}
              ${bodyFr}
            </div>
            <aside class="profile-aside">
              <p class="section-label">
                <span data-lang="en">Focus</span><span data-lang="fr">Focus</span>
              </p>
              <div data-lang="en"><ul class="profile-focus">${focusEn}</ul></div>
              <div data-lang="fr"><ul class="profile-focus">${focusFr}</ul></div>
              <div class="cta-row" style="margin-top: 1.5rem">
                ${
                  p.artistSite
                    ? `<a class="btn btn-primary" href="${esc(p.artistSite)}">
                  <span data-lang="en">Explore his music</span>
                  <span data-lang="fr">Explorer sa musique</span>
                </a>`
                    : ''
                }
                ${
                  p.spotifyUrl
                    ? `<a class="btn btn-ghost" href="${esc(p.spotifyUrl)}" target="_blank" rel="noreferrer">Spotify</a>`
                    : ''
                }
                <a class="btn btn-ghost" href="../index.html#booking">
                  <span data-lang="en">Book a session</span>
                  <span data-lang="fr">Réserver une session</span>
                </a>
              </div>
              ${
                p.instagram || p.tiktok
                  ? `<p class="muted-note" style="margin-top:1rem">
                  ${p.instagram ? `<a href="${esc(p.instagram)}" target="_blank" rel="noreferrer">Instagram</a>` : ''}
                  ${p.instagram && p.tiktok ? ' · ' : ''}
                  ${p.tiktok ? `<a href="${esc(p.tiktok)}" target="_blank" rel="noreferrer">TikTok</a>` : ''}
                </p>`
                  : ''
              }
            </aside>
          </div>

          <div class="profile-more">
            <p class="section-label">
              <span data-lang="en">More from the crew</span>
              <span data-lang="fr">Autres profils</span>
            </p>
            <div class="profile-chip-row">${more}</div>
          </div>
        </div>
      </main>`

  return shell({
    title: `${p.name} · EclipseTone`,
    description: `${p.name} · ${p.role.en} · EclipseTone Productions · Montréal`,
    body,
    activeSlug: p.slug,
  })
}

function indexPage() {
  const cards = profiles
    .map(
      (p) => `<a class="person person-link reveal" href="${p.slug}.html">
              <h3>${esc(p.name)}</h3>
              <p class="role">
                <span data-lang="en">${esc(p.role.en)}</span>
                <span data-lang="fr">${esc(p.role.fr)}</span>
              </p>
              <p>
                <span data-lang="en">${esc(p.summary.en)}</span>
                <span data-lang="fr">${esc(p.summary.fr)}</span>
              </p>
              <span class="person-cta">
                <span data-lang="en">View profile →</span>
                <span data-lang="fr">Voir le profil →</span>
              </span>
            </a>`,
    )
    .join('\n            ')

  const body = `<main class="section team" style="padding-top: calc(var(--nav-h) + 3rem)">
        <div class="section-inner">
          <p class="section-label">
            <span data-lang="en">People</span><span data-lang="fr">Équipe</span>
          </p>
          <h1 class="section-title">
            <span data-lang="en">Profiles</span>
            <span data-lang="fr">Profils</span>
          </h1>
          <p class="section-lead">
            <span data-lang="en">Artist first. The crew that builds EclipseTone with him.</span>
            <span data-lang="fr">L’artiste d’abord. L’équipe qui bâtit EclipseTone avec lui.</span>
          </p>
          <div class="team-list" style="margin-top: 2.5rem; border-top: 1px solid var(--line); padding-top: 2rem">
            ${cards}
          </div>
        </div>
      </main>`

  return shell({
    title: 'People · EclipseTone',
    description: 'EclipseTone crew profiles: Laousmail and collaborators in Montréal.',
    body,
    activeSlug: 'index',
  })
}

mkdirSync(__dirname, { recursive: true })
writeFileSync(join(__dirname, 'index.html'), indexPage())
for (const p of profiles) {
  writeFileSync(join(__dirname, `${p.slug}.html`), profilePage(p, profiles))
}
console.log(`Wrote ${profiles.length + 1} people pages`)
