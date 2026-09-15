import { motion } from "framer-motion";

export default function TinySwitch({ value, accentColor }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition"
      style={{
        backgroundColor: value ? accentColor : "rgba(113, 113, 122, 0.26)",
      }}
    >
      <motion.span
        animate={{ x: value ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="h-5 w-5 rounded-full bg-white shadow-sm"
      />
    </span>
  );
}
