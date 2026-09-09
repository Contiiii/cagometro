import poop from "../assets/poop.png";

export default function PoopButton({ onClick }) {
  return (
    <div className="relative my-4">
      <div
        className="
                    absolute
                    inset-0
                    scale-110
                    rounded-full
                    bg-pink-400/10
                    blur-2xl
                  "
      ></div>
      <button
        onClick={onClick}
        className="
                    relative
                    p-2
                    w-36
                    h-36
                    md:w-36
                    md:h-36
                    flex
                    items-center
                    justify-center
                    rounded-full

                    bg-gradient-to-b
                    from-pink-500
                    to-pink-700

                    border-2
                    border-pink-300/20

                    shadow-lg
                    shadow-pink-500/30

                    transition-all
                    duration-300

                    hover:scale-105
                    hover:shadow-pink-500/50
                    hover:from-pink-400
                    hover:to-pink-600

                    active:scale-95

                    cursor-pointer
                  "
      >
        <img src={poop} alt="Poop" className="w-28 h-28 object-contain pb-3" />
      </button>
    </div>
  );
}
