import toast from "react-hot-toast";

export function notify(message, variant = "success") {
  if (variant === "error") {
    toast.error(message);
  } else {
    toast.success(message);
  }

  const liveRegion = document.getElementById("team-live-region");

  if (liveRegion) {
    liveRegion.textContent = message;
  }
}