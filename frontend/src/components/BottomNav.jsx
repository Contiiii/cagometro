import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <div
      className="   fixed
                    bottom-4
                    left-4
                    right-4
                    w-auto
                    bg-zinc-900/80
                    backdrop-blur-lg
                    border-t
                    border-pink-500/20
                    flex
                    justify-around
                    items-center
                    py-2
                    shadow-[0_-5px_20px_rgba(0,0,0,0.3)]
                    rounded-[2rem]
                    "
    >
      <NavLink
        to="/report"
        className={({ isActive }) =>
          `
        w-20
      flex
      flex-col
      items-center
      transition-colors
      duration-200
      cursor-pointer
      gap-1
      text-xs
      md:text-sm
      ${
        isActive
          ? "text-pink-400 font-bold scale-105 bg-pink-500/15 rounded-2xl px-2 py-1"
          : "text-zinc-400 hover:text-pink-300"
      }
    `
        }
      >
        <span className="text-lg">📊</span>
        <span>Report</span>
      </NavLink>

      <NavLink
        to="/"
        className={({ isActive }) =>
          `
        w-20
      flex
      flex-col
      items-center
      transition-colors
      duration-200
      cursor-pointer
      gap-1
      text-xs
      md:text-sm


      ${
        isActive
          ? "text-pink-400 font-bold scale-105 bg-pink-500/15 rounded-2xl px-2 py-1"
          : "text-zinc-400 hover:text-pink-300"
      }
    `
        }
      >
        <span className="text-lg">🏠 </span>
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/Achievements"
        className={({ isActive }) =>
          `
        w-20
      flex
      flex-col
      items-center
      transition-colors
      duration-200
      cursor-pointer
      gap-1
      text-xs
      md:text-sm
      ${
        isActive
          ? "text-pink-400 font-bold scale-105 bg-pink-500/15 rounded-2xl px-2 py-1"
          : "text-zinc-400 hover:text-pink-300"
      }
    `
        }
      >
        <span className="text-lg">🏆</span>
        <span>Achievements</span>
      </NavLink>
    </div>
  );
}
