import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#EBE8DE] border-t border-potato-border mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-potato-border/70">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-potato-olive flex items-center justify-center text-potato-lime shadow-sm">
                <span className="font-drama text-lg font-black italic">P</span>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-potato-ink">
                Potato
              </span>
            </div>
            <p className="text-sm text-potato-muted max-w-sm leading-relaxed">
              Premium food delivery engineered with a durable, atomic kitchen queue.
              Good food. Zero chaos.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-potato-olive">
                Queue Engine: Operational (PostgreSQL 16 FOR UPDATE SKIP LOCKED)
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-potato-ink mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-potato-muted">
              <li>
                <Link to="/restaurants" className="hover:text-potato-olive transition-colors">
                  All Restaurants
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-potato-olive transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="hover:text-potato-olive transition-colors">
                  Order Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-potato-ink mb-3">
              Staff & Ops
            </h4>
            <ul className="space-y-2 text-sm text-potato-muted">
              <li>
                <Link to="/kitchen" className="hover:text-potato-olive transition-colors">
                  Kitchen Display Queue
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-potato-olive transition-colors">
                  Admin Control Panel
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-potato-olive transition-colors">
                  Staff Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-potato-muted gap-4">
          <p>© {new Date().getFullYear()} Potato Food Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>WCAG 2.1 AA Compliant</span>
            <span>Zero Real Financial Data (Demo Mode)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
