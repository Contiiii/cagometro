import poop from "../assets/poop.png";
import { useAuth } from "../hooks/useAuth";
import ProfileButton from "./ProfileButton";
import SyncStatus from "./SyncStatus";

export default function Header() {
  const { user, login, logout } = useAuth();

  return (
    <header className="w-full bg-transparent">
      <div
        className="
          relative
          mx-auto
          flex
          min-h-20
pt-10
pb-16
          w-full
          max-w-6xl
          items-center
          px-4
          sm:h-24
          sm:px-6
        "
      >
        <div
          className="
            absolute
            left-1/2
            flex
            -translate-x-1/2
            items-center
            gap-2
            sm:gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-pink-500/20
              bg-pink-500/10
              shadow-lg
              shadow-pink-950/20
              sm:h-12
              sm:w-12
            "
          >
            <img
              src={poop}
              alt="Logo Cagometro"
              className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            />
          </div>

          <div className="min-w-0">
            <h1
              className="
                whitespace-nowrap
                text-2xl
                font-black
                tracking-tight
                text-pink-400
                sm:text-4xl
              "
            >
              CAGOMETRO
            </h1>

            <p
              className="
                hidden
                text-xs
                uppercase
                tracking-[0.18em]
                text-zinc-500
                sm:block
              "
            >
              Tracking professionale
            </p>
          </div>
        </div>

        <div className="ml-auto shrink-0">
          <div className="ml-auto shrink-0 flex flex-col items-center">
  <ProfileButton
    user={user}
    login={login}
    logout={logout}
  />

  <SyncStatus />
</div>
        </div>
      </div>
    </header>
  );
}
