import { useEffect } from 'react'
import './App.css'

const WHATSAPP = 'https://wa.me/14384668971'
const INSTAGRAM = 'https://instagram.com/eclipsetone'
const PHONE_DISPLAY = '+1 438 466 8971'

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

function App() {
  useReveal()

  return (
    <div className="site">
      <header className="nav">
        <a className="nav-brand" href="#top">
          <img src="/eclipsetone-logo.jpg" alt="" width={40} height={40} />
          <span>
            Eclipse<span className="tone">Tone</span>
          </span>
        </a>

        <input id="nav-menu" className="nav-checkbox" type="checkbox" />
        <label className="nav-toggle" htmlFor="nav-menu" aria-label="Menu">
          <span />
        </label>

        <nav className="nav-links" aria-label="Primary">
          <a href="#services">Services</a>
          <a href="#approach">Approach</a>
          <a href="#team">Team</a>
          <a className="nav-cta" href="#booking">
            Book
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-label="EclipseTone Productions">
          <div className="hero-visual" aria-hidden="true">
            <div className="eclipse" />
          </div>

          <div className="hero-copy">
            <div className="brand-lockup">
              <h1 className="brand-name">
                <span className="eclipse-word">Eclipse</span>
                <span className="tone-word">Tone</span>
              </h1>
              <p className="brand-sub">Productions</p>
            </div>

            <h2>Every artist has a sun. We help the world see it.</h2>
            <p className="hero-lead">
              Like a sun alone, your music can feel ordinary — until the right
              presence draws beside it, and the eclipse begins.
            </p>

            <div className="cta-row">
              <a className="btn btn-primary" href={WHATSAPP} target="_blank" rel="noreferrer">
                Book on WhatsApp
              </a>
              <a className="btn btn-ghost" href={INSTAGRAM} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>
          </div>
        </section>

        <section className="section services" id="services">
          <div className="section-inner">
            <div className="services-head reveal">
              <p className="section-label">Services</p>
              <h2 className="section-title">What we bring into focus</h2>
              <p className="section-lead">
                A service-based production house — we meet you in the process,
                across studios, and make what you hear in your head real.
              </p>
            </div>

            <div className="service-grid">
              <div className="service-col reveal">
                <h3>For artists</h3>
                <p>
                  From first take to final master — across styles, with a team
                  that builds around your voice.
                </p>
                <ul className="service-list">
                  <li>Recording songs</li>
                  <li>Arranging</li>
                  <li>Mixing</li>
                  <li>Mastering</li>
                  <li>Vocal production</li>
                  <li>Vocal coaching</li>
                </ul>
              </div>

              <div className="service-col reveal">
                <h3>For motion &amp; business</h3>
                <p>
                  Sound design and score that carry picture, brand, and story —
                  not just fill the silence.
                </p>
                <ul className="service-list">
                  <li>Sound for motion</li>
                  <li>Film &amp; media scoring</li>
                  <li>Brand &amp; commercial audio</li>
                  <li>Custom sound design</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="section approach" id="approach">
          <div className="section-inner approach-layout">
            <div className="approach-visual reveal" aria-hidden="true">
              <div className="vinyl" />
            </div>

            <div className="approach-copy reveal">
              <p className="section-label">Approach</p>
              <h2 className="section-title">Not a room you visit. A vision you hear.</h2>
              <p className="section-lead">
                We work with artists and creators across multiple studios. The
                place changes — the craft and the partnership stay.
              </p>
              <ol className="steps">
                <li>
                  <div>
                    <strong>Listen</strong>
                    <span>You show us the sun — the song, the scene, the feeling.</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Align</strong>
                    <span>We shape arrangement, performance, and tone around it.</span>
                  </div>
                </li>
                <li>
                  <div>
                    <strong>Reveal</strong>
                    <span>Mix, master, and deliver what the world is meant to hear.</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="section team" id="team">
          <div className="section-inner">
            <div className="team-head reveal">
              <p className="section-label">Team</p>
              <h2 className="section-title">Guided by people, not just process</h2>
              <p className="section-lead">
                Many hands, many styles — EclipseTone is a collective craft, not
                a one-person booth.
              </p>
            </div>

            <div className="team-list">
              <article className="person reveal">
                <h3>Smail Laouchedi</h3>
                <p className="role">Production guidance · Vocal production</p>
                <p>
                  Leads artists through recording and vocal production — helping
                  the performance land the way it was meant to feel.
                </p>
              </article>

              <article className="person reveal">
                <h3>Raouf Abbout</h3>
                <p className="role">Vocal coach</p>
                <p>
                  Strengthens the voice before and during the session — technique,
                  control, and confidence in the booth.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section booking" id="booking">
          <div className="section-inner">
            <div className="booking-panel">
              <div className="booking-copy reveal">
                <p className="section-label">Booking</p>
                <h2 className="section-title">Ready to start the eclipse?</h2>
                <p className="section-lead">
                  Message us on WhatsApp — tell us about your project, your
                  timeline, and the sound you want the world to see.
                </p>
                <div className="cta-row">
                  <a
                    className="btn btn-primary"
                    href={WHATSAPP}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp {PHONE_DISPLAY}
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @eclipsetone
                  </a>
                </div>
                <div className="contact-meta">
                  <p>
                    <strong>Based in</strong>
                    Montréal, Québec
                  </p>
                  <a href={WHATSAPP} target="_blank" rel="noreferrer">
                    <strong>Preferred</strong>
                    WhatsApp · {PHONE_DISPLAY}
                  </a>
                </div>
              </div>

              <div className="booking-aside reveal">
                <img
                  src="/eclipsetone-logo.jpg"
                  alt="EclipseTone Productions logo"
                  width={256}
                  height={256}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>
            Eclipse<span className="tone">Tone</span>
          </strong>
          <div>Productions · Montréal</div>
        </div>
        <div>© 2026 EclipseTone Productions</div>
      </footer>
    </div>
  )
}

export default App
