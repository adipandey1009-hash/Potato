import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Order, OrderPriority } from '../../types';
import { generateIdempotencyKey } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, Zap, Clock, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';

const checkoutSchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  streetLine1: z.string().min(3, 'Street address is required'),
  streetLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  deliveryInstructions: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [priority, setPriority] = useState<OrderPriority>('REGULAR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize unique idempotency key for this checkout attempt
  const [idempotencyKey] = useState<string>(() => generateIdempotencyKey());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipientName: user?.fullName || 'Anshika Sharma',
      phone: '+1 (555) 019-2834',
      streetLine1: '742 Evergreen Terrace',
      streetLine2: 'Apt 12B',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      deliveryInstructions: 'Ring buzzer 12B or leave with concierge.',
    },
  });

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-potato-ink">Your cart is empty</h2>
        <p className="text-potato-muted">Please add dishes before navigating to checkout.</p>
        <Link to="/restaurants">
          <Button variant="primary">Browse Restaurants</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!cart.restaurant) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const order = await apiRequest<Order>('/api/v1/checkout', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: cart.restaurant.id,
          deliveryAddress: data,
          priority,
          idempotencyKey,
          demoPaymentReference: 'DEMO-AUTH-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        }),
      });

      // Clear local cart cache
      await clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete order. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/cart"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-potato-muted hover:text-potato-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Cart
        </Link>
        <h1 className="text-3xl font-extrabold text-potato-ink tracking-tight">Checkout</h1>
        <p className="text-sm text-potato-muted mt-1">
          Review delivery details, select queue priority, and authorize simulated payment.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-potato-error text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Delivery Address */}
            <Card className="p-6 space-y-5">
              <h2 className="text-lg font-bold text-potato-ink border-b border-potato-border pb-3">
                1. Delivery Destination
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Recipient Full Name"
                  {...register('recipientName')}
                  error={errors.recipientName?.message}
                />
                <Input
                  label="Contact Phone"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>

              <Input
                label="Street Address"
                {...register('streetLine1')}
                error={errors.streetLine1?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Apt / Suite / Floor"
                  {...register('streetLine2')}
                  error={errors.streetLine2?.message}
                />
                <Input
                  label="City"
                  {...register('city')}
                  error={errors.city?.message}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="State"
                    {...register('state')}
                    error={errors.state?.message}
                  />
                  <Input
                    label="Postal Code"
                    {...register('postalCode')}
                    error={errors.postalCode?.message}
                  />
                </div>
              </div>

              <Input
                label="Delivery Instructions (Optional)"
                placeholder="Gate codes, door buzzer, building details..."
                {...register('deliveryInstructions')}
              />
            </Card>

            {/* Queue Priority Selection */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-potato-border pb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-potato-ink">
                  2. Kitchen Queue Priority
                </h2>
                <span className="text-xs font-mono text-potato-olive">Deterministic Order</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPriority('REGULAR')}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    priority === 'REGULAR'
                      ? 'border-potato-olive bg-potato-olive/5 ring-2 ring-potato-olive/20'
                      : 'border-potato-border bg-potato-surface hover:border-potato-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-potato-ink text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-potato-muted" />
                      Regular FIFO
                    </span>
                    <span className="text-xs font-mono font-bold text-potato-olive">Included</span>
                  </div>
                  <p className="text-xs text-potato-muted leading-relaxed">
                    Processed in strict arrival sequence (Priority Rank 2). Standard kitchen backlog.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('EXPRESS')}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    priority === 'EXPRESS'
                      ? 'border-potato-olive bg-potato-lime/30 ring-2 ring-potato-lime'
                      : 'border-potato-border bg-potato-surface hover:border-potato-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-potato-ink text-sm flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-potato-olive fill-potato-lime" />
                      Express Priority
                    </span>
                    <Badge variant="express" />
                  </div>
                  <p className="text-xs text-potato-muted leading-relaxed">
                    Priority Rank 1. Jumps ahead of pending regular orders for rapid prep dispatch.
                  </p>
                </button>
              </div>
            </Card>

            {/* Demo Payment Section */}
            <Card className="p-6 space-y-4 bg-potato-surface border-[#D8D5C8]">
              <div className="flex items-center justify-between border-b border-potato-border pb-3">
                <h2 className="text-lg font-bold text-potato-ink flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-potato-olive" />
                  3. Demo Payment Flow
                </h2>
                <span className="text-[11px] font-bold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Sandbox Active
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Demo Sandbox Environment:</strong>
                  No real credit card, CVV, or banking details will ever be stored or charged. Clicking Place Order simulates an instantaneous payment authorization.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F1E8] border border-potato-border space-y-2 text-xs">
                <div className="flex justify-between font-mono text-potato-muted">
                  <span>Simulated Method:</span>
                  <span className="font-bold text-potato-ink">Potato Demo Card (•••• 4242)</span>
                </div>
                <div className="flex justify-between font-mono text-potato-muted">
                  <span>Idempotency Hash:</span>
                  <span className="font-semibold text-potato-olive">{idempotencyKey}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-5">
            <Card elevated className="p-6 space-y-6 sticky top-28 bg-potato-surface border-[#D8D5C8]">
              <h2 className="text-xl font-bold text-potato-ink">Order Confirmation</h2>

              <div className="space-y-3 divide-y divide-potato-border/60">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-potato-muted">
                    {cart.restaurant?.name}
                  </span>
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="text-potato-ink font-medium">
                        {item.quantity}× {item.name}
                      </span>
                      <span className="font-mono text-potato-muted">
                        ${item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-potato-muted">
                    <span>Subtotal</span>
                    <span className="font-mono text-potato-ink font-semibold">
                      ${cart.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-potato-muted">
                    <span>Delivery Fee</span>
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
                  {priority === 'EXPRESS' && (
                    <div className="flex justify-between text-potato-olive font-semibold text-xs">
                      <span>Express Priority Dispatch</span>
                      <span>Complimentary Demo</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-potato-border flex justify-between text-lg font-bold text-potato-ink">
                    <span>Total</span>
                    <span className="font-mono text-2xl text-potato-olive font-black">
                      ${cart.estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="lime"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-bold shadow-lg"
              >
                Place Order & Enqueue
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-potato-muted">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Protected against duplicate submissions via idempotency</span>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
