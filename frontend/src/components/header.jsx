import poop from "../assets/poop.png";

export default function Header() {
  return (
    <div
      className="flex items-center justify-center bg-zinc-950 border-b border-zinc-800 w-full "
    >
      <h1 className="text-4xl font-black text-pink-400 cursor-pointer hover:opacity-80 transition-all my-5">CAGOMETRO </h1>
      <img src={poop} alt="Logo Cagometro" className="h-14 object-contain ml-3" />
    </div>
  );
}
