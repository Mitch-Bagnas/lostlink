import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center space-y-5 animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-paper border border-line flex items-center justify-center text-lost">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-ink">404 — Page Not Found</h1>
        <p className="text-sm text-muted max-w-sm mx-auto">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary" size="md">
          Return to Home
        </Button>
      </Link>
    </div>
  );
};
