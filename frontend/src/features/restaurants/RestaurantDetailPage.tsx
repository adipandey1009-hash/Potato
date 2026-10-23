import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { RestaurantDetail, MenuItem } from '../../types';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Clock, Plus, Check, ShoppingBag, Leaf, ChevronLeft } from 'lucide-react';

export const RestaurantDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addItem, cart } = useCart();
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  const { data: detail, isLoading, error } = useQuery<RestaurantDetail>({
    queryKey: ['restaurant-detail', slug],
    queryFn: () => apiRequest<RestaurantDetail>(`/api/v1/restaurants/${slug}`),
    enabled: !!slug,
  });

  const handleAddToCart = async (item: MenuItem) => {
    if (!detail) return;
    try {
      await addItem({
        restaurantId: detail.restaurant.id,
        menuItemId: item.id,
        quantity: 1,
      });
      setAddedItemId(item.id);
      setTimeout(() => setAddedItemId(null), 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-potato-ink">Kitchen Not Found</h2>
        <p className="text-potato-muted">We couldn't find the restaurant requested.</p>
        <Link to="/restaurants">
          <Button variant="outline">Back to Restaurants</Button>
        </Link>
      </div>
    );
  }

  const { restaurant, categories, allItems } = detail;
  const isDiffRestaurant = cart?.restaurant && cart.restaurant.id !== restaurant.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back button */}
      <div>
        <Link
          to="/restaurants"
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-potato-muted hover:text-potato-ink transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          All Kitchens
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-potato-surface border border-potato-border shadow-md">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-potato-lime text-potato-ink uppercase tracking-wider">
              {restaurant.cuisine}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {restaurant.name}
            </h1>
            <p className="text-sm text-gray-200 max-w-2xl leading-relaxed">
              {restaurant.description}
            </p>
          </div>
        </div>

        {/* Operational Bar */}
        <div className="px-6 py-4 bg-potato-surface flex flex-wrap items-center justify-between text-xs text-potato-muted gap-4 border-t border-potato-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-potato-olive" />
              <span>Est. Delivery: {restaurant.estimatedDeliveryMin}-{restaurant.estimatedDeliveryMax} mins</span>
            </div>
            <div>
              <span>Delivery Fee: <strong className="text-potato-ink font-mono">${restaurant.deliveryFee.toFixed(2)}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-potato-olive">Direct Kitchen Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* Cart conflict warning if active cart is from another restaurant */}
      {isDiffRestaurant && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>
            You have items in your cart from <strong>{cart.restaurant?.name}</strong>. Adding items here will start a new cart.
          </span>
          <Link to="/cart">
            <span className="underline font-bold ml-4">View Current Cart</span>
          </Link>
        </div>
      )}

      {/* Menu Sections */}
      <div className="space-y-12">
        {categories.map((category) => (
          <section key={category.id} className="space-y-6">
            <div className="border-b border-potato-border pb-3">
              <h2 className="text-2xl font-bold text-potato-ink">
                {category.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items.map((item) => {
                const isJustAdded = addedItemId === item.id;

                return (
                  <Card
                    key={item.id}
                    className="p-5 flex flex-col justify-between hover:border-potato-olive/50 transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-potato-ink">
                            {item.name}
                          </h3>
                          {item.isVegetarian && (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full" title="Vegetarian">
                              <Leaf className="w-3 h-3 mr-0.5" />
                              Veg
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-potato-muted leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-potato-border flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-potato-border/60 flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-potato-ink">
                        ${item.price.toFixed(2)}
                      </span>

                      {user ? (
                        <Button
                          variant={isJustAdded ? 'lime' : 'outline'}
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.isAvailable}
                          className="min-w-[100px]"
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      ) : (
                        <Link to="/login">
                          <Button variant="outline" size="sm">
                            Sign in to Order
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Bottom Cart Bar (if user has items) */}
      {cart && cart.totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-30 animate-in slide-in-from-bottom-5">
          <Link to="/cart">
            <Button variant="lime" size="lg" className="shadow-2xl flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <span>Review Cart ({cart.totalItems} items)</span>
              <span className="font-mono font-bold ml-1">${cart.estimatedTotal.toFixed(2)}</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
