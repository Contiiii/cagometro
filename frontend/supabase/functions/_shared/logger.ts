type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

function emit(
  level: LogLevel,
  context: string,
  message: string,
  meta?: LogMeta,
) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    context,
    message,
    ...(meta ?? {}),
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export function createLogger(context: string) {
  return {
    debug: (message: string, meta?: LogMeta) =>
      emit("debug", context, message, meta),
    info: (message: string, meta?: LogMeta) =>
      emit("info", context, message, meta),
    warn: (message: string, meta?: LogMeta) =>
      emit("warn", context, message, meta),
    error: (message: string, meta?: LogMeta) =>
      emit("error", context, message, meta),
  };
}

export type Logger = ReturnType<typeof createLogger>;
