import { Link } from "react-router-dom";

export default function ProfileButton({ user, login }) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="
          rounded-xl
          border
          border-pink-500/20
          bg-pink-500/10
          px-4
          py-2
          text-sm
          font-semibold
          text-pink-300
          transition
          hover:bg-pink-500/20
          focus:outline-none
          focus:ring-2
          focus:ring-pink-400/60
          focus:ring-offset-2
          focus:ring-offset-zinc-950
        "
      >
        Accedi
      </button>
    );
  }

  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const userName = user.user_metadata?.name || user.email || "Profilo";

  return (
    <Link
      to="/Settings"
      aria-label={`Esci dall'account ${userName}`}
      title={`Esci da ${userName}`}
      className="
      group
      relative
      h-10
      w-10
      shrink-0
      overflow-hidden
      rounded-full
      border
      border-pink-400/40
      bg-zinc-900
      shadow-lg
      shadow-pink-950/30
      transition-all
      duration-200
      hover:scale-105
      hover:border-pink-300
      hover:shadow-pink-500/30
      focus:outline-none
      focus:ring-2
      focus:ring-pink-400/70
      focus:ring-offset-2
      focus:ring-offset-zinc-950
      active:scale-95
    "
    >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-center
          transition-transform
          duration-200
          group-hover:scale-110
        "
          />
        ) : (
          <span
            aria-hidden="true"
            className="
          absolute
          inset-0
          flex
          items-center
          justify-center
          bg-gradient-to-br
          from-pink-400
          to-fuchsia-600
          text-sm
          font-bold
          text-white
        "
          >
            {userName.charAt(0).toUpperCase()}
          </span>
        )}
    </Link>
  );
}
