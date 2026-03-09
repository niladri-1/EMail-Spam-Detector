import Navbar from "../components/Navbar";

const features = [
  {
    icon: "✦",
    title: "Instant Inbox Access",
    desc: "Connect your Gmail in seconds and browse every email from a clean, distraction-free interface.",
  },
  {
    icon: "⊹",
    title: "Smart Email Preview",
    desc: "See sender, subject, and snippet at a glance — no more hunting through cluttered tabs.",
  },
  {
    icon: "◈",
    title: "Resizable Layout",
    desc: "Drag the divider to set exactly how much space your email list and reading pane get.",
  },
  {
    icon: "⬡",
    title: "Secure OAuth Login",
    desc: "We never store your password. Authentication is handled entirely through Google's secure OAuth 2.0 flow.",
  },
];

function Home() {
  const login = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URI}/auth/google`;
  };

  return (
    <div className="home-wrapper">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">Spam Email Classification — Reimagined</div>

        <h1 className="hero-title">
          Your inbox,
          <br />
          <span className="hero-accent">beautifully simple.</span>
        </h1>

        <p className="hero-sub">
          A modern interface for reading Gmail. Clean, fast, and built for
          focus. No ads. No clutter. Just your emails.
        </p>

        <button className="cta-btn" onClick={login}>
          Get Started
          <span className="cta-arrow">→</span>
        </button>

        <p className="hero-note">Free to use · Secured by Google OAuth</p>
      </section>

      {/* Divider */}
      <div className="section-divider">
        <span>What you get</span>
      </div>

      {/* Features */}
      <section className="features">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="bottom-cta">
        <h2>Ready to read smarter?</h2>
        <p>Connect your Gmail account and get started in under 30 seconds.</p>
        <button className="cta-btn" onClick={login}>
          Get Started
          <span className="cta-arrow">→</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span>Spam Email Classification</span>
        <span>Built with React · Secured by Google</span>
      </footer>
    </div>
  );
}

export default Home;
