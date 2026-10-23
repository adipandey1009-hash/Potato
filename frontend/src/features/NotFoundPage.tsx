import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
      <div className="w-20 h-20 bg-potato-surface rounded-3xl border border-potato-border flex items-center justify-center mx-auto text-2xl font-black font-drama italic text-potato-olive shadow-sm">
        404
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-potato-ink">Dish Not Found</h1>
        <p className="text-sm text-potato-muted leading-relaxed">
          The page or route you were looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
};
