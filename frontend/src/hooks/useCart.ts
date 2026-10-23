import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Cart } from '../types';
import { useAuth } from '../context/AuthContext';

export function useCart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: cart, isLoading, error } = useQuery<Cart>({
    queryKey: ['cart'],
    queryFn: () => apiRequest<Cart>('/api/v1/cart'),
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
  });

  const addItemMutation = useMutation({
    mutationFn: (variables: { restaurantId: string; menuItemId: string; quantity: number }) =>
      apiRequest<Cart>('/api/v1/cart/items', {
        method: 'POST',
        body: JSON.stringify(variables),
      }),
    onSuccess: (newCart) => {
      queryClient.setQueryData(['cart'], newCart);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: (variables: { cartItemId: string; quantity: number }) =>
      apiRequest<Cart>(`/api/v1/cart/items/${variables.cartItemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: variables.quantity }),
      }),
    onSuccess: (newCart) => {
      queryClient.setQueryData(['cart'], newCart);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (cartItemId: string) =>
      apiRequest<Cart>(`/api/v1/cart/items/${cartItemId}`, {
        method: 'DELETE',
      }),
    onSuccess: (newCart) => {
      queryClient.setQueryData(['cart'], newCart);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () =>
      apiRequest<void>('/api/v1/cart', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cart,
    isLoading,
    error,
    addItem: addItemMutation.mutateAsync,
    isAdding: addItemMutation.isPending,
    updateQuantity: updateQuantityMutation.mutateAsync,
    isUpdating: updateQuantityMutation.isPending,
    removeItem: removeItemMutation.mutateAsync,
    isRemoving: removeItemMutation.isPending,
    clearCart: clearCartMutation.mutateAsync,
    isClearing: clearCartMutation.isPending,
  };
}
