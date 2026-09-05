import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const navItemClass = ({ isActive }) => `
    flex
    h-14
    flex-1
    flex-col
    items-center
    justify-center
    gap-0.5
    rounded-2xl
    text-xs
    transition-all
    duration-200
    md:text-sm
    ${
      isActive
        ? `
          scale-105
          border
          border-pink-500/20
          bg-pink-500/15
          font-bold
          text-pink-400
          shadow-lg
          shadow-pink-500/10
        `
        : `
          border
          border-transparent
          text-zinc-400
          hover:-translate-y-0.5
          hover:bg-white/5
          hover:text-pink-300
        `
    }
  `;

  return (
    <nav
      aria-label="Navigazione principale"
      className="
    fixed
    bottom-4
    left-1/2
    z-40
    flex
    w-[calc(100%-2rem)]
    max-w-md
    -translate-x-1/2
    items-center
    justify-around
    rounded-[2rem]
    border
    border-pink-500/15
    bg-zinc-950/80
    px-2
    py-2
    shadow-[0_8px_30px_rgba(0,0,0,0.45)]
    backdrop-blur-xl
  "
    >
      <NavLink to="/" className={navItemClass}>
        <span className="text-lg leading-none">🏠</span>
        <span>Home</span>
      </NavLink>

      <NavLink to="/teams" className={navItemClass}>
        <span className="text-lg leading-none">👥</span>
        <span>Team</span>
      </NavLink>

      <NavLink to="/report" className={navItemClass}>
        <span className="text-lg leading-none">📊</span>
        <span>Report</span>
      </NavLink>

      <NavLink to="/achievements" className={navItemClass}>
        <span className="text-lg leading-none">🏆</span>
        <span>Traguardi</span>
      </NavLink>
    </nav>
  );
}
