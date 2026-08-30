import poop from "../assets/poop.png";

export default function Header() {
  return (
    <header
      className="
        w-full
        pt-6
        pb-4
        flex
        justify-center
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            border
            border-pink-500/20
            bg-pink-500/10
          "
        >
          <img
            src={poop}
            className="
                        text-4xl
                        font-black
                        tracking-tight
                        text-pink-400
                        h-8
                        w-8"
          />
        </div>

        <div>
          <h1
            className="
              text-3xl
              sm:text-4xl
              font-black
              tracking-tight
              text-pink-400
            "
          >
            CAGOMETRO
          </h1>

          <p
            className="
              text-xs
              uppercase
              tracking-[0.2em]
              text-zinc-500
            "
          >
            tracking professionale
          </p>
        </div>
      </div>
    </header>
  );
}
