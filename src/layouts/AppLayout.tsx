import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const pageTitle = location.pathname.startsWith("/monitors")
    ? "Monitors"
    : location.pathname === "/settings"
      ? "Settings"
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

  const closeMobileNav = () => setIsMobileNavOpen(false);
  const handleLogout = () => {
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
          <div className="account">
            <div className="avatar">{presentationFallback.initials}</div>
            <div className="account-copy"><strong>{user?.email ?? presentationFallback.displayName}</strong><span>{presentationFallback.workspaceName}</span></div>
            <button className="account-menu" type="button" aria-label="Log out" onClick={handleLogout}><Icon name="more" size={18} /></button>
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
