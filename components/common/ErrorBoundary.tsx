
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  // ReactNode is used here to allow any valid React children.
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary is a class component that catches JavaScript errors anywhere in its child component tree.
 */
// Use React.Component with explicit Props and State generic types to ensure props and state are correctly inherited and recognized by TypeScript.
class ErrorBoundary extends React.Component<Props, State> {
  // Fix: Explicitly declare props as a class field to resolve "Property 'props' does not exist" errors in this environment.
  public props: Props;

  // Fix: Explicitly declare and initialize state as a class field to resolve "Property 'state' does not exist" errors.
  public state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
    // Fix: Explicitly assign props to ensure availability on the class instance for render and other methods.
    this.props = props;
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for later analysis.
    console.error("Uncaught error:", error, errorInfo);
  }

  // Explicitly typing the return as ReactNode for better consistency with the render method's expectations.
  render(): ReactNode {
    // Accessing this.state which is now correctly recognized via the class field declaration.
    if (this.state.hasError) {
      // Fallback UI to show when an error occurs.
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="text-center p-8 bg-white shadow-lg rounded-lg border border-red-200">
                <h1 className="text-2xl font-bold text-red-600">عذرًا، حدث خطأ ما.</h1>
                <p className="mt-2 text-slate-600">
                    لقد واجه التطبيق مشكلة غير متوقعة. يرجى محاولة تحديث الصفحة.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700"
                >
                    تحديث الصفحة
                </button>
            </div>
        </div>
      );
    }

    // Accessing this.props which is correctly inherited from React.Component<Props, State>.
    // Fix: Redundant check removed since props is now explicitly declared on the class.
    return this.props.children;
  }
}

export default ErrorBoundary;
