export function reportError(error, options = {}) {
  const { feature = "app", userId = null, message = null, ...context } =
    options;

  const tag = [`[${feature}]`, userId ? `user=${userId}` : null]
    .filter(Boolean)
    .join(" ");

  const prefix = message ? `${tag} ${message}` : `${tag} Errore`;

  if (error == null) {
    console.error(prefix, context);
  } else {
    console.error(prefix, error, context);
  }
}