import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-cream mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
        <div>
          <p className="text-lg font-semibold text-hills mb-2">MIZERO</p>
          <p className="text-sm text-ink/60 leading-relaxed max-w-xs">
            An AI-assisted lost-and-found platform for Rwanda — helping people reunite with
            lost belongings through smart matching, not luck.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-3 font-medium">Platform</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/how-it-works" className="text-ink/70 hover:text-clay">How it Works</Link></li>
            <li><Link to="/about" className="text-ink/70 hover:text-clay">About</Link></li>
            <li><Link to="/map" className="text-ink/70 hover:text-clay">Map</Link></li>
            <li><Link to="/search" className="text-ink/70 hover:text-clay">Browse</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-3 font-medium">Legal &amp; Contact</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="text-ink/70 hover:text-clay">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-ink/70 hover:text-clay">Terms of Use</Link></li>
            <li><Link to="/contact" className="text-ink/70 hover:text-clay">Contact</Link></li>
            <li>
              <a
                href="https://github.com/valentin396/MIZERO-AI-FULL-STACK-PROJECT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink/70 hover:text-clay"
              >
                GitHub repo
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-ink/40 text-center">
          © {year} MIZERO. A graduation project — not a commercial or law-enforcement service.
        </div>
      </div>
    </footer>
  );
}
