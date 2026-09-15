import toast from "react-hot-toast";

import { announce } from "./announce";

export function notify(message, variant = "success") {
  if (variant === "error") {
    toast.error(message);
  } else {
    toast.success(message);
  }

  announce(message);
}