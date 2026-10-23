import { Link, Outlet } from "react-router-dom";
import { useTheme } from "../Hooks/useTheme";
import { booksPagePath } from "../services/pagePaths";
import faviconUrl from "../../assets/favicon.png";

const themeModes = [
  { value: "dark", src: "../../../assets/dark-theme.svg", name: "Dark" },
  { value: "system", src: "../../../assets/system-theme.svg", name: "System" },
  { value: "light", src: "../../../assets/light-theme.svg", name: "Light" },
] as const;

function Scaffold() {
  const { mode, theme, setMode } = useTheme();

  return (
    <div className={`app-shell app-shell--${theme}`} data-theme={theme}>
      <header className="app-header">
        <Link className="app-header__brand" to={booksPagePath}>
          <img src={faviconUrl} alt="" aria-hidden="true" />
          <span>Inside the Book</span>
        </Link>
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
              <img src={option.src} alt="" className="theme-image"/>
            </button>
          ))}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
export default Scaffold;
