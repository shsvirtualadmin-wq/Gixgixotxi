import { Outlet } from 'react-router-dom';
import { BackgroundCanvas } from '../BackgroundCanvas';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * PublicLayout:
 * Used ONLY by public landing and marketing routes:
 * /, /features, /arena, /pricing, /reviews, /contact, /privacy, /terms.
 *
 * Auth pages, test engine, and dashboards MUST NEVER be wrapped by PublicLayout.
 */
export function PublicLayout() {
  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <BackgroundCanvas />
      <Navbar />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default PublicLayout;
