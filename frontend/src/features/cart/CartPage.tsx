import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag, Utensils } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { cart, isLoading, updateQuantity, removeItem, clearCart, isUpdating, isClearing } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-potato-olive border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-potato-surface rounded-3xl border border-potato-border flex items-center justify-center mx-auto text-potato-muted shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-potato-ink">Your cart is empty</h1>
          <p className="text-potato-muted text-sm max-w-sm mx-auto">
            Explore our curated craft restaurants and add dishes to start your order.
          </p>
        </div>
        <Link to="/restaurants">
          <Button variant="primary" size="lg">
            Explore Food
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-potato-border">
        <div>
          <h1 className="text-3xl font-extrabold text-potato-ink tracking-tight">Your Cart</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-potato-muted mt-1">
            Kitchen: <span className="text-potato-ink">{cart.restaurant?.name}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearCart()}
          disabled={isClearing}
          className="text-potato-muted hover:text-potato-error text-xs"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-potato-border overflow-hidden flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-potato-ink">{item.name}</h3>
                  <p className="text-xs font-mono text-potato-muted">
                    ${item.unitPrice.toFixed(2)} each
                  </p>
                </div>
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-potato-border/60">
                <div className="flex items-center gap-2 bg-[#F3F0E6] rounded-full p-1 border border-potato-border">
                  <button
                    onClick={() => updateQuantity({ cartItemId: item.id, quantity: item.quantity - 1 })}
                    disabled={isUpdating}
                    className="w-7 h-7 rounded-full bg-potato-surface hover:bg-white flex items-center justify-center text-potato-ink disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity({ cartItemId: item.id, quantity: item.quantity + 1 })}
                    disabled={isUpdating}
                    className="w-7 h-7 rounded-full bg-potato-surface hover:bg-white flex items-center justify-center text-potato-ink disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <span className="font-mono text-base font-bold text-potato-ink">
                    ${item.lineTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-potato-muted hover:text-potato-error transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <Card elevated className="p-6 space-y-6 bg-potato-surface border-[#D8D5C8]">
            <h2 className="text-xl font-bold text-potato-ink">Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-potato-muted">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span className="font-mono text-potato-ink font-semibold">
                  ${cart.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-potato-muted">
                <span>Estimated Delivery Fee</span>
                <span className="font-mono text-potato-ink font-semibold">
                  ${cart.deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-potato-muted">
                <span>Estimated Tax (8.25%)</span>
                <span className="font-mono text-potato-ink font-semibold">
                  ${cart.estimatedTax.toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-potato-border flex justify-between text-base font-bold text-potato-ink">
                <span>Estimated Total</span>
                <span className="font-mono text-xl text-potato-olive font-extrabold">
                  ${cart.estimatedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              variant="lime"
              size="lg"
              onClick={() => navigate('/checkout')}
              className="w-full text-base font-bold shadow-md"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="text-center">
              <span className="text-[11px] text-potato-muted block">
                Deterministic calculation applied by server Decimal engine.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
