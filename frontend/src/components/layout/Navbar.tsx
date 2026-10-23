import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import { ShoppingBag, UtensilsCrossed, ShieldAlert, LogOut, User, Menu, X, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = cart?.totalItems || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-potato-bg/90 backdrop-blur-md border-b border-potato-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-potato-olive flex items-center justify-center text-potato-lime shadow-sm transition-transform group-hover:scale-105">
              <span className="font-drama text-2xl font-black italic">P</span>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-potato-ink block leading-none">
                Potato
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-potato-muted block mt-0.5">
                Good food. Zero chaos.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/restaurants"
              className="text-sm font-semibold text-potato-ink hover:text-potato-olive transition-colors"
            >
              Explore Food
            </Link>

            {user && (
              <Link
                to="/account/orders"
                className="text-sm font-semibold text-potato-ink hover:text-potato-olive transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-potato-muted" />
                Track Orders
              </Link>
            )}

            {(user?.role === 'KITCHEN_STAFF' || user?.role === 'ADMIN') && (
              <Link
                to="/kitchen"
                className="text-sm font-semibold text-potato-olive bg-potato-lime/30 px-3 py-1.5 rounded-full border border-potato-lime/60 hover:bg-potato-lime/50 transition-colors flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Kitchen Queue
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="text-sm font-semibold text-potato-ink hover:text-potato-olive transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4 text-potato-muted" />
                Admin
              </Link>
            )}
          </nav>

          {/* Action Area: Cart & Auth */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-potato-surface border border-potato-border text-potato-ink hover:border-potato-olive transition-all"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-potato-olive text-potato-lime text-[11px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-potato-border">
                <div className="text-right">
                  <span className="block text-xs font-bold text-potato-ink leading-tight">
                    {user.fullName}
                  </span>
                  <span className="block text-[10px] uppercase font-semibold text-potato-muted">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Log Out">
                  <LogOut className="w-4 h-4 text-potato-muted hover:text-potato-error" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              to="/cart"
              className="relative p-2 rounded-full bg-potato-surface border border-potato-border text-potato-ink"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-potato-olive text-potato-lime text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-potato-ink hover:bg-black/5"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-potato-surface border-b border-potato-border px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4">
          <Link
            to="/restaurants"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-semibold text-potato-ink rounded-lg hover:bg-black/5"
          >
            Explore Food
          </Link>
          {user && (
            <Link
              to="/account/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-potato-ink rounded-lg hover:bg-black/5"
            >
              Order History & Status
            </Link>
          )}
          {(user?.role === 'KITCHEN_STAFF' || user?.role === 'ADMIN') && (
            <Link
              to="/kitchen"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-potato-olive bg-potato-lime/20 rounded-lg"
            >
              Kitchen Queue
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold text-potato-ink rounded-lg hover:bg-black/5"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-potato-border">
            {user ? (
              <div className="flex items-center justify-between px-3">
                <div>
                  <span className="block font-bold text-potato-ink text-sm">{user.fullName}</span>
                  <span className="block text-xs text-potato-muted">{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
