import { useContext } from "react";

import { ProfileContext } from "../context/profile-context";

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useProfile deve essere usato dentro ProfileProvider",
    );
  }

  return context;
}