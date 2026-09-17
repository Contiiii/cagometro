import { Component } from "react";
import { RefreshCw } from "lucide-react";

export const RETRY_FEEDBACK_MS = 600;

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      retrying: false,
    };

    this.retryTimer = null;
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
      retrying: false,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Errore catturato da ErrorBoundary:", error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  handleReset = () => {
    if (this.state.retrying) return;

    // Il tentativo di reset è sincrono: se i figli lanciano di nuovo, React
    // torna subito alla schermata di errore. Il ritardo fa dipingere lo stato
    // "in corso" così l'utente vede che il pulsante ha reagito.
    this.setState({ retrying: true });

    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.setState({ hasError: false, retrying: false });
    }, RETRY_FEEDBACK_MS);
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    const { retrying } = this.state;

    if (this.state.hasError) {
      return (
        <div
          className="
            flex
            min-h-dvh
            flex-col
            items-center
            justify-center
            gap-6
            bg-black
            px-6
            text-center
            text-white
          "
        >
          <div className="text-6xl">💥</div>

          <div>
            <h1 className="text-2xl font-bold">Qualcosa è andato storto</h1>

            <p className="mt-2 text-zinc-400">
              Cagometro ha incontrato un errore imprevisto.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={this.handleReset}
              disabled={retrying}
              aria-busy={retrying}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-zinc-700
                bg-zinc-900
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:border-accent/50
                disabled:cursor-not-allowed
                disabled:opacity-70
              "
            >
              {retrying ? (
                <>
                  <RefreshCw
                    className="h-4 w-4 animate-spin"
                    strokeWidth={2.2}
                  />
                  Riprovo…
                </>
              ) : (
                "Riprova"
              )}
            </button>

            <button
              onClick={this.handleGoHome}
              className="
                rounded-xl
                bg-accent
                px-5
                py-3
                font-semibold
                text-white
                transition
                hover:bg-accent hover:brightness-110
              "
            >
              Torna alla Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
