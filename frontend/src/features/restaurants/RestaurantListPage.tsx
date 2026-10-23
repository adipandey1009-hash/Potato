import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Restaurant } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { Search, Clock, DollarSign, Utensils } from 'lucide-react';

const CUISINES = [
  'All',
  'Artisan Comfort',
  'Organic & Clean',
  'Japanese Craft',
  'Italian Osteria',
  'Gourmet Smokehouse',
];

export const RestaurantListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const { data, isLoading, error } = useQuery<{ content: Restaurant[] }>({
    queryKey: ['restaurants', searchTerm, selectedCuisine],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (selectedCuisine !== 'All') params.set('cuisine', selectedCuisine);
      return apiRequest<any>(`/api/v1/restaurants?${params.toString()}`);
    },
  });

  const restaurants = data?.content || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-potato-ink tracking-tight">
          Craft Kitchens & Menus
        </h1>
        <p className="text-potato-muted text-sm sm:text-base max-w-2xl">
          Order from artisan restaurants with live queue transparency. Each kitchen guarantees order sequence and freshness.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Input
            placeholder="Search by restaurant or dish style..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11"
          />
          <Search className="w-5 h-5 text-potato-muted absolute left-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Cuisine Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CUISINES.map((cuisine) => {
            const isSelected = selectedCuisine === cuisine;
            return (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-potato-olive text-potato-surface shadow-xs'
                    : 'bg-potato-surface text-potato-muted border border-potato-border hover:border-potato-olive'
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Kitchens */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="p-0 overflow-hidden space-y-4">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 bg-potato-surface rounded-[2rem] border border-potato-border p-8 space-y-4">
          <div className="w-14 h-14 bg-potato-bg rounded-2xl flex items-center justify-center mx-auto text-potato-muted">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-potato-ink">No kitchens found</h3>
          <p className="text-sm text-potato-muted max-w-md mx-auto">
            We couldn't find any restaurants matching "{searchTerm}". Try another search term or reset your filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCuisine('All');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/restaurants/${restaurant.slug}`}
              className="group block"
            >
              <Card elevated className="h-full overflow-hidden p-0 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="relative aspect-[16/10] overflow-hidden bg-potato-border">
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-potato-surface/90 backdrop-blur-md text-potato-ink border border-potato-border flex items-center gap-1 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-potato-muted" />
                      {restaurant.estimatedDeliveryMin}-{restaurant.estimatedDeliveryMax} min
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-potato-muted uppercase tracking-wider">
                      {restaurant.cuisine}
                    </span>
                    <span className="text-xs font-mono font-medium text-potato-olive">
                      ${restaurant.deliveryFee.toFixed(2)} delivery
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-potato-ink group-hover:text-potato-olive transition-colors">
                    {restaurant.name}
                  </h3>

                  <p className="text-sm text-potato-muted line-clamp-2 leading-relaxed">
                    {restaurant.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
