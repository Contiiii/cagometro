export function buildTechExport({
  app,
  versione,
  generatoIl,
  utenteLoggato,
  syncStatus,
  label,
  modificheInAttesa,
  giorniRegistrati,
  totaleSegnalazioni,
  entries,
}) {
  return {
    app,
    versione,
    generatoIl,
    utenteLoggato,
    stato: {
      syncStatus,
      label,
      modificheInAttesa,
    },
    giorniRegistrati,
    totaleSegnalazioni,
    entries,
  };
}