import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link, Outlet, useLocation, useNavigation } from "react-router-dom";
import { useTheme } from "../Hooks/useTheme";
import { booksPagePath, qrPagePath } from "../services/pagePaths";
import RouteSkeleton from "../Components/RouteSkeleton";
import faviconUrl from "../../assets/favicon.png";
import burgerMenuUrl from "../../assets/burger-menu.svg";
import darkThemeUrl from "../../assets/dark-theme.svg";
import systemThemeUrl from "../../assets/system-theme.svg";
import lightThemeUrl from "../../assets/light-theme.svg";
import booksMenuArt from "../../assets/books-menu-art.svg";
import qrMenuArt from "../../assets/qr-menu-art.svg";

const themeModes = [
  { value: "dark", src: darkThemeUrl, name: "Dark" },
  { value: "system", src: systemThemeUrl, name: "System" },
  { value: "light", src: lightThemeUrl, name: "Light" },
] as const;

function Scaffold() {
  const { mode, theme, setMode } = useTheme();
  const navigation = useNavigation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuDialogRef = useRef<HTMLElement>(null);
  const shellBackground =
    theme === "dark" ? "bg-jade-spotlight" : "bg-jade-zakhrafa-light";
  const isNavigating = navigation.state !== "idle";
  const destinationPath = navigation.location?.pathname ?? location.pathname;

  function closeMenu() {
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => menuToggleRef.current?.focus());
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = menuDialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={`${shellBackground} app-shell app-shell--${theme}`}
      data-theme={theme}
    >
      <header className="app-header glass-frost">
        <Link className="app-header__brand" to={booksPagePath}>
          <img src={faviconUrl} alt="" aria-hidden="true" />
          <span>Inside the Book</span>
        </Link>
        <div className="div-1">
          <div className="theme-switch" role="group" aria-label="Color theme">
            {themeModes.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`theme-switch__option ${mode === option.value ? "is-active" : ""}`}
                aria-label={`${option.name} theme`}
                aria-pressed={mode === option.value}
                onClick={() => setMode(option.value)}
              >
                <img src={option.src} alt="" className="theme-image" />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="app-menu-toggle"
            aria-label={isMenuOpen ? "Close page navigation" : "Open page navigation"}
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            ref={menuToggleRef}
            onClick={() => setIsMenuOpen(true)}
          >
            <img src={burgerMenuUrl} alt="" className="burger-menu" />
          </button>
        </div>
      </header>
      {isNavigating ? (
        <RouteSkeleton pathname={destinationPath} />
      ) : (
        <Outlet />
      )}
      {isMenuOpen && (
        <div
          className="app-menu-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <section
            className="app-menu-dialog"
            ref={menuDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-menu-title"
            onKeyDown={handleMenuKeyDown}
          >
            <div className="app-menu-dialog__heading">
              <h2 id="app-menu-title">Where would you like to go?</h2>
              <button
                type="button"
                className="app-menu-dialog__close"
                aria-label="Close navigation"
                autoFocus
                onClick={closeMenu}
              >
                ×
              </button>
            </div>
            <nav className="app-menu-dialog__choices" aria-label="Main pages">
              <Link
                className="app-menu-choice app-menu-choice--books"
                to={booksPagePath}
                style={{ "--menu-art": `url("${booksMenuArt}")` } as CSSProperties}
                onClick={closeMenu}
              >
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M4 7.5c4.2-1.6 8.5-.9 12 1.1v18c-3.5-2-7.8-2.7-12-1.1v-18Zm24 0c-4.2-1.6-8.5-.9-12 1.1v18c3.5-2 7.8-2.7 12-1.1v-18Z" />
                </svg>
                <span>Books</span>
                <small>Browse and manage the collection</small>
              </Link>
              <Link
                className="app-menu-choice app-menu-choice--qr"
                to={qrPagePath}
                style={{ "--menu-art": `url("${qrMenuArt}")` } as CSSProperties}
                onClick={closeMenu}
              >
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M4 4h9v9H4V4Zm3 3v3h3V7H7Zm14-3h7v9h-9V4h2Zm1 3v3h3V7h-3ZM4 19h9v9H4v-9Zm3 3v3h3v-3H7Zm9-18h3v3h-3V4Zm0 6h3v3h-3v-3Zm3 3h3v3h-3v-3Zm3 3h3v3h-3v-3Zm3 3h3v3h-3v-3Zm-9 0h3v3h-3v-3Zm3 3h3v3h-3v-3Zm6 0h3v3h-3v-3Z" />
                </svg>
                <span>QR codes</span>
                <small>Filter books and prepare print-ready codes</small>
              </Link>
            </nav>
          </section>
        </div>
      )}
    </div>
  );
}
export default Scaffold;
