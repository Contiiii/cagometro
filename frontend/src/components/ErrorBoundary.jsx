import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Errore catturato da ErrorBoundary:", error, errorInfo);
  }

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
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
              className="
      rounded-xl
      border
      border-zinc-700
      bg-zinc-900
      px-5
      py-3
      font-semibold
      text-white
      transition
      hover:border-pink-500/50
    "
            >
              Riprova
            </button>

            <button
              onClick={this.handleGoHome}
              className="
      rounded-xl
      bg-pink-500
      px-5
      py-3
      font-semibold
      text-white
      transition
      hover:bg-pink-400
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
