export default function BottomNav() {
  return (
    <div
      className="fixed
                    bottom-0
                    left-0
                    w-full
                    bg-zinc-900/80
                    backdrop-blur-md
                    border-t
                    border-pink-500/20
                    flex
                    justify-around
                    items-center
                    py-4
                    shadow-[0_-5px_20px_rgba(0,0,0,0.3)]
                    rounded-t-3xl
                    "
    >
      <button
        className=" flex
                    flex-col
                    items-center
                    text-zinc-400
                    hover:text-pink-300
                    transition-colors
                    duration-200
                    cursor-pointer
                    gap-1
                    text-xs 
                    md:text-sm">
        <span>📊</span>
        <span>Report</span>
      </button>

      <button
        className="
                    flex    
                    flex-col
                    items-center
                    text-pink-400
                    transition-colors
                    duration-200
                    font-bold
                    cursor-pointer
                    gap-1
                    scale-105
                    text-xs 
                    md:text-sm">
            <span>🏠 </span>
            <span>Home</span>
        </button>

      <button
        className=" flex
                    flex-col
                    items-center
                    text-zinc-400
                    hover:text-pink-300
                    transition-colors
                    duration-200
                    cursor-pointer
                    gap-1
                    text-xs 
                    md:text-sm">
        <span>🏆</span>
        <span>Badge</span> 
       </button>
    </div>
  );
}
