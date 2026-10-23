import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Restaurant, ApiResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import gsap from 'gsap';
import { ArrowRight, Clock, ShieldCheck, Flame, UtensilsCrossed, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { data: restaurantsData } = useQuery<{ content: Restaurant[] }>({
    queryKey: ['featured-restaurants'],
    queryFn: () => apiRequest<any>('/api/v1/restaurants?size=4'),
  });

  const featuredRestaurants = restaurantsData?.content || [];

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', {
        opacity: 0,
        y: -15,
        duration: 0.6,
        ease: 'power3.out',
      });

      gsap.from('.hero-title', {
        opacity: 0,
        y: 25,
        duration: 0.8,
        delay: 0.1,
        ease: 'power3.out',
      });

      gsap.from('.hero-sub', {
        opacity: 0,
        y: 20,
        duration: 0.7,
        delay: 0.25,
        ease: 'power3.out',
      });

      gsap.from('.hero-cta', {
        opacity: 0,
        scale: 0.95,
        duration: 0.6,
        delay: 0.4,
        ease: 'power2.out',
      });

      gsap.from('.queue-demo-card', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        delay: 0.5,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div ref={containerRef} className="space-y-24 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-potato-surface border border-potato-border shadow-xs">
              <span className="w-2 h-2 rounded-full bg-potato-lime animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-potato-olive">
                Durable Kitchen Queue Architecture
              </span>
            </div>

            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-potato-ink leading-[1.08]">
              Good food. <br />
              <span className="font-drama italic font-normal text-potato-olive">
                Zero chaos.
              </span>
            </h1>

            <p className="hero-sub text-lg sm:text-xl text-potato-muted max-w-2xl leading-relaxed">
              Experience dining orchestrated with precision. Potato replaces unpredictable delivery delays with an atomic, deterministic kitchen order queue.
            </p>

            <div className="hero-cta flex flex-wrap items-center gap-4 pt-2">
              <Link to="/restaurants">
                <Button variant="primary" size="lg" className="shadow-md">
                  Explore Food
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/account/orders">
                <Button variant="outline" size="lg">
                  <Clock className="w-4 h-4 mr-2 text-potato-muted" />
                  Track Existing Order
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Simulated Queue Card */}
          <div className="lg:col-span-5 queue-demo-card">
            <Card elevated className="bg-potato-surface border-[#D8D5C8] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-potato-lime/15 rounded-full blur-2xl -mr-10 -mt-10" />

              <div className="flex items-center justify-between pb-4 border-b border-potato-border">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-potato-olive uppercase">
                    Kitchen Telemetry
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-potato-bg text-potato-muted">
                  FIFO + Priority
                </span>
              </div>

              {/* Queue visualization */}
              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-xl bg-potato-lime/25 border border-potato-lime/60 flex items-center justify-between transition-transform hover:scale-[1.01]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-potato-olive">#POT-EXP-01</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-potato-olive text-potato-lime">
                        EXPRESS #1
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-potato-ink">Truffle Confit Smash Bowl</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-potato-olive">Next Claim</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-potato-border flex items-center justify-between opacity-80">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-potato-muted">#POT-REG-02</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-gray-200 text-gray-700">
                        REGULAR #2
                      </span>
                    </div>
                    <p className="text-xs text-potato-ink">Braised Short Rib Hearth Potato</p>
                  </div>
                  <span className="text-xs font-mono text-potato-muted">Queued 2m ago</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F6F0] border border-potato-border flex items-center justify-between opacity-60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-potato-muted">#POT-REG-03</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-gray-200 text-gray-700">
                        REGULAR #3
                      </span>
                    </div>
                    <p className="text-xs text-potato-ink">Charred Broccolini Pilaf</p>
                  </div>
                  <span className="text-xs font-mono text-potato-muted">Queued 4m ago</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-potato-border/60 flex items-center justify-between text-xs text-potato-muted">
                <span>Concurrency Engine: Active</span>
                <span className="font-mono text-potato-olive font-semibold">FOR UPDATE SKIP LOCKED</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Kitchens Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-potato-muted block mb-1">
              Curated Craft Partners
            </span>
            <h2 className="text-3xl font-extrabold text-potato-ink">
              Featured Kitchens
            </h2>
          </div>
          <Link to="/restaurants" className="text-sm font-bold text-potato-olive hover:underline inline-flex items-center">
            View all restaurants
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredRestaurants.slice(0, 3).map((restaurant) => (
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
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-potato-surface/90 backdrop-blur-md text-potato-ink border border-potato-border">
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
      </section>

      {/* 3 Core Value Propositions */}
      <section className="bg-potato-surface border-y border-potato-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-potato-muted">
              Why Potato
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-potato-ink">
              Engineered to eliminate culinary bottlenecks
            </h2>
            <p className="text-potato-muted text-sm sm:text-base">
              Traditional food apps accept orders blindly. Potato processes every request through an atomic state machine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-[#FAF8F3] border-potato-border/80 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-potato-lime/40 text-potato-olive flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-potato-ink">
                Durable Order Queue
              </h3>
              <p className="text-sm text-potato-muted leading-relaxed">
                Orders enter a database-backed FIFO queue. Express orders gain priority rank 1, jumping ahead safely without interrupting dishes already on the stove.
              </p>
            </Card>

            <Card className="bg-[#FAF8F3] border-potato-border/80 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-potato-olive text-potato-lime flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-potato-ink">
                Zero Double-Billing
              </h3>
              <p className="text-sm text-potato-muted leading-relaxed">
                Every checkout request is governed by client-generated idempotency keys. Retried clicks or connectivity blips never create duplicate orders or charges.
              </p>
            </Card>

            <Card className="bg-[#FAF8F3] border-potato-border/80 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-potato-ink">
                Atomic Claim Safety
              </h3>
              <p className="text-sm text-potato-muted leading-relaxed">
                Kitchen stations atomically lock and claim orders using PostgreSQL row locks. Two cooks will never prepare the same ticket twice.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
