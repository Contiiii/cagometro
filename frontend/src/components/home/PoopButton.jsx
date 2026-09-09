// components/PoopButton.jsx
import { motion } from "framer-motion";
import poopIcon from "../../assets/poop.png";

export default function PoopButton({
  onClick,
  burst,
  theme,
  prefersReducedMotion,
}) {
  return (
    <div className="relative grid h-[228px] w-[228px] place-items-center sm:h-[258px] sm:w-[258px]">
      {/* Anello rotante esterno */}
      <motion.div
        aria-hidden="true"
        className={`absolute inset-1 rounded-full border ${theme.counterRing}`}
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      />

      {/* Bordo tratteggiato */}
      <div
        aria-hidden="true"
        className={`absolute inset-5 rounded-full border border-dashed ${theme.buttonOuter}`}
      />

      {/* Bottone principale — key=burst per rilanciare l'animazione ad ogni click */}
      <motion.button
        type="button"
        aria-label="Aggiungi una registrazione"
        onClick={onClick}
        whileHover={prefersReducedMotion ? {} : { scale: 1.035 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
        animate={
          burst === 0 || prefersReducedMotion ? {} : { scale: [1, 1.08, 1] }
        }
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 18,
        }}
        className={`relative z-10 grid h-[172px] w-[172px] place-items-center rounded-full border-4 border-pink-300/30 bg-pink-500 ${theme.buttonShadow} transition-colors hover:bg-pink-400 sm:h-[194px] sm:w-[194px] `}
      >
        {/* FIX: usa <img>, non {poopIcon} */}
        <img
          src={poopIcon}
          alt=""
          aria-hidden="true"
          className="h-24 w-24 sm:h-28 sm:w-28 object-contain select-none"
          draggable="false"
        />
        <span className="sr-only">Registra attività</span>
      </motion.button>

      {/* Particelle burst */}
      {!prefersReducedMotion && burst > 0 && (
        <>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <motion.span
              key={`${burst}-${item}`}
              aria-hidden="true"
              initial={{ opacity: 0.85, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1,
                x: Math.cos((item * Math.PI) / 3) * 112,
                y: Math.sin((item * Math.PI) / 3) * 112,
              }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute z-20 h-2.5 w-2.5 rounded-full bg-pink-300"
            />
          ))}
        </>
      )}
    </div>
  );
}
