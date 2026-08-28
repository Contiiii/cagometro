import poop from "../assets/poop.png";

export default function PoopButton({ onClick }) {
  return (
    <div className="relative my-4">
    <div className="absolute inset-0 scale-110 rounded-full bg-pink-400/5 blur-xl "></div>
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
    transition-all
    duration-200
    hover:scale-105
    cursor-pointer
    active:scale-95
    hover:from-pink-400
hover:to-pink-600

  "
      >
        <img src={poop} alt="Poop" className="w-28 h-28 object-contain pb-3" />
      </button>
    </div>
  );
}
