import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { presentationFallback } from "../config/presentationFallback";
import { useAuth } from "../auth/useAuth";
import Icon from "../components/Icon";

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const pageTitle = location.pathname.startsWith("/monitors")
    ? "Monitors"
    : location.pathname === "/settings"
      ? "Settings"
      : location.pathname === "/account"
        ? "Account"
        : location.pathname === "/help"
        ? "Help center"
        : "Overview";

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const closeMobileNav = () => setIsMobileNavOpen(false);
  const closeAccountMenu = () => setIsAccountMenuOpen(false);
  const closeAccountMenuAndNavigation = () => {
    closeAccountMenu();
    closeMobileNav();
  };
  const handleLogout = () => {
    closeAccountMenu();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <button
        className={`mobile-nav-backdrop ${isMobileNavOpen ? "visible" : ""}`}
        aria-label="Close navigation menu"
        onClick={() => setIsMobileNavOpen(false)}
        tabIndex={isMobileNavOpen ? 0 : -1}
      />
      <aside className={`sidebar ${isMobileNavOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <span>Watch<span className="brand-accent">Dog</span></span>
        </div>
        <div className="workspace-label">Workspace</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <NavLink to="/dashboard" onClick={closeMobileNav} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon name="dashboard" className="nav-icon" /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/monitors" onClick={closeMobileNav} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon name="monitors" className="nav-icon" /> <span>Monitors</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings" onClick={closeMobileNav} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon name="settings" className="nav-icon" /> <span>Settings</span></NavLink>
          <NavLink to="/help" onClick={closeMobileNav} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon name="help" className="nav-icon" /> <span>Help center</span></NavLink>
          <div className="account" ref={accountRef}>
            <button
              className="account-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-controls="account-menu"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
            >
              <span className="avatar">{presentationFallback.initials}</span>
              <span className="account-copy"><strong>{user?.email ?? presentationFallback.displayName}</strong><span>{presentationFallback.workspaceName}</span></span>
              <Icon name="chevron-down" size={15} />
            </button>
            {isAccountMenuOpen && (
              <div className="account-dropdown" id="account-menu" role="menu" aria-label="Account menu">
                <div className="account-dropdown-identity">
                  <strong>{user?.email ?? presentationFallback.displayName}</strong>
                  <span>Personal account</span>
                </div>
                <NavLink to="/account" role="menuitem" onClick={closeAccountMenuAndNavigation}>Profile / Account</NavLink>
                <NavLink to="/settings" role="menuitem" onClick={closeAccountMenuAndNavigation}>Settings</NavLink>
                <NavLink to="/help" role="menuitem" onClick={closeAccountMenuAndNavigation}>Help</NavLink>
                <button type="button" role="menuitem" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <button className="mobile-menu-button" type="button" aria-label="Open navigation menu" aria-expanded={isMobileNavOpen} onClick={() => setIsMobileNavOpen(true)}><Icon name="menu" size={20} /></button>
          <div className="mobile-brand"><div className="brand-mark" aria-hidden="true"><span /></div>Watch<span className="brand-accent">Dog</span></div>
          <span className="breadcrumb">Workspace <span>/</span> {pageTitle}</span>
          <div className="topbar-actions"><span className="workspace-indicator"><span />Monitoring workspace</span><button className="icon-button" type="button" aria-label="Notifications"><Icon name="activity" size={19} /></button></div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
