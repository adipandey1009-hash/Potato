import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../components/layout/RootLayout';
import { LandingPage } from '../features/home/LandingPage';
import { RestaurantListPage } from '../features/restaurants/RestaurantListPage';
import { RestaurantDetailPage } from '../features/restaurants/RestaurantDetailPage';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { OrderDetailPage } from '../features/orders/OrderDetailPage';
import { OrderHistoryPage } from '../features/orders/OrderHistoryPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { KitchenQueuePage } from '../features/kitchen/KitchenQueuePage';
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage';
import { NotFoundPage } from '../features/NotFoundPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'restaurants', element: <RestaurantListPage /> },
      { path: 'restaurants/:slug', element: <RestaurantDetailPage /> },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/orders',
        element: (
          <ProtectedRoute>
            <OrderHistoryPage />
          </ProtectedRoute>
        ),
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'kitchen',
        element: (
          <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'ADMIN']}>
            <KitchenQueuePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
