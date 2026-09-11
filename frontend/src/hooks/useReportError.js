import { reportError } from "../utils/reportError";

import { useAuth } from "./useAuth";

export function useReportError(feature) {
  const { user } = useAuth();

  return (error, options = {}) =>
    reportError(error, {
      ...options,
      feature,
      userId: options.userId ?? user?.id ?? null,
    });
}
