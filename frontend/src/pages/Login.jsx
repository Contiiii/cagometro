import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Cloud, CloudOff } from "lucide-react";

import Header from "../components/Header";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

import toast from "react-hot-toast";

const CLOUD_BENEFITS = [
  "Sincronizza i tuoi progressi su tutti i dispositivi",
  "Proteggi i dati in caso di cambio o smarrimento del telefono",
  "Condividi squadre, traguardi e profilo con gli altri",
];

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();
  const { resolvedTheme } = useTheme();

  const [loggingIn, setLoggingIn] = useState(false);

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  async function handleLogin() {
    if (loggingIn) return;

    setLoggingIn(true);

    try {
      await login();

      if (user) {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Errore durante il login:", error);
      toast.error("Non è stato possibile completare l'accesso");
      setLoggingIn(false);
    }
  }

  const theme = isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "bg-zinc-900/80 border-white/[0.08]",
        soft: "bg-white/[0.035] border-white/[0.07]",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        primaryText: "text-zinc-50",
        overlay: "bg-zinc-950/60",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "bg-white/85 border-zinc-200/80",
        soft: "bg-zinc-900/[0.035] border-zinc-900/[0.07]",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        primaryText: "text-zinc-950",
        overlay: "bg-zinc-950/55",
      };

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
    >
      <Header eyebrow="Account" title="Accedi" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
        <section className="mx-auto max-w-2xl">
          {authLoading ? (
            <div
              className={`rounded-[2rem] border p-8 text-center ${theme.surface}`}
            >
              <p className={`text-sm font-semibold ${theme.muted}`}>
                Verifica dell'accesso in corso...
              </p>
            </div>
          ) : (
            <div
              className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${theme.surface}`}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-pink-500/[0.10] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-400/[0.07] blur-3xl" />

              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-[1.35rem] bg-pink-500 shadow-[0_12px_30px_rgba(236,72,153,0.28)]">
                  <Cloud className="h-7 w-7 text-white" strokeWidth={2.3} />
                </div>

                <h1
                  className={`mt-6 text-[clamp(1.75rem,5vw,2.6rem)] font-black leading-[0.98] tracking-[-0.06em] ${theme.primaryText}`}
                >
                  Salva i tuoi progressi
                  <br />
                  nel cloud
                </h1>

                <p className={`mt-3 max-w-[52ch] text-sm leading-relaxed ${theme.muted}`}>
                  Accedi con Google per proteggere la tua storia e portarla
                  ovunque, su qualsiasi dispositivo.
                </p>

                <ul className={`mt-6 grid gap-3 text-sm ${theme.muted}`}>
                  {CLOUD_BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-pink-500/10 text-pink-500">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="font-medium leading-snug">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loggingIn}
                  className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(236,72,153,0.24)] transition-colors hover:bg-pink-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/40"
                >
                  {loggingIn ? "Accesso in corso..." : "Accedi con Google"}
                </button>

                <div
                  className={`mt-6 rounded-[1.4rem] border p-4 ${theme.soft}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-500">
                      <CloudOff className="h-4 w-4" strokeWidth={2.2} />
                    </span>

                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${theme.primaryText}`}>
                        Modalità offline
                      </p>

                      <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
                        Senza account i tuoi dati restano solo su questo
                        dispositivo. Puoi continuare a registrarti, ma senza
                        sincronizzazione.
                      </p>

                      <button
                        type="button"
                        onClick={() => navigate("/")}
                        className={`mt-3 inline-flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg ${theme.primaryText}`}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
                        Continua in modalità offline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}