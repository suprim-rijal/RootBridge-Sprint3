import { Component } from "react";

// If any page throws while drawing, show a friendly message instead of a
// blank white screen. React needs a class component for this.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    // In a bigger product this would go to an error service.
    console.error("A page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div className="crash-screen" role="alert">
        <h1>Something went wrong on this page</h1>
        <p>Your progress is saved. Try going back to the start.</p>
        <div className="crash-actions">
          <button type="button" className="btn btn-dark" onClick={() => window.location.assign("/")}>
            Go to the home page
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Reload this page
          </button>
        </div>
      </div>
    );
  }
}
