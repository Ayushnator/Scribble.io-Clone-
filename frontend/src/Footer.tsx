import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-section-icon">📝</div>
          <h3>About</h3>
          <p>
            Scribble.io is a free online multiplayer drawing and guessing pictionary game.
            A normal game consists of a few rounds, where every round a player has to draw their
            chosen word and others have to guess it to gain points!
          </p>
        </div>

        <div className="footer-section">
          <div className="footer-section-icon">🎮</div>
          <h3>How to Play</h3>
          <ul className="footer-list">
            <li>When it's your turn, choose a word you want to draw</li>
            <li>Draw it on the canvas for other players to guess</li>
            <li>Other players guess what you're drawing</li>
            <li>Earn points for correct guesses and drawings</li>
            <li>The player with the most points wins!</li>
          </ul>
        </div>

        <div className="footer-section">
          <div className="footer-section-icon">🔗</div>
          <h3>Links</h3>
          <div className="footer-links">
            <a href="mailto:contact@example.com" className="footer-link">Contact</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/credits" className="footer-link">Credits</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-disclaimer">
          The owner of this site is not responsible for any user generated content
          (drawings, messages, usernames)
        </p>
        <p className="footer-copyright">© 2026 Scribble.io. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
