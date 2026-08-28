import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <h1 className="text-8xl font-bold text-neutral-900 font-display">404</h1>
      <p className="mt-4 text-xl font-medium text-neutral-900">Page not found</p>
      <p className="mt-2 text-sm text-neutral-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-8">
        <Home size={16} />
        Back to Home
      </Link>
    </div>
  );
}
