export type Role = 'CUSTOMER' | 'KITCHEN_STAFF' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  imageUrl: string;
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  categoryId?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isVegetarian: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface RestaurantDetail {
  restaurant: Restaurant;
  categories: MenuCategory[];
  allItems: MenuItem[];
}

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  description: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  restaurant?: Restaurant;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  estimatedTax: number;
  estimatedTotal: number;
}

export type OrderStatus = 'QUEUED' | 'CLAIMED' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type OrderPriority = 'REGULAR' | 'EXPRESS';

export interface OrderStatusEvent {
  id: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  actorUserId?: string;
  note: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutAddress {
  recipientName: string;
  phone: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  deliveryInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  address: CheckoutAddress;
  status: OrderStatus;
  priority: OrderPriority;
  priorityRank: number;
  queuedAt: string;
  claimedAt?: string;
  completedAt?: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentReference: string;
  items: OrderItem[];
  statusEvents: OrderStatusEvent[];
  createdAt: string;
}

export interface QueueOrderSummary {
  id: string;
  orderNumber: string;
  restaurantName: string;
  recipientName: string;
  itemCount: number;
  priority: OrderPriority;
  priorityRank: number;
  status: OrderStatus;
  queuedAt: string;
  waitMinutes: number;
}

export interface QueueStatus {
  totalPending: number;
  expressPending: number;
  regularPending: number;
  nextEligibleOrder?: QueueOrderSummary;
  queueBacklog: QueueOrderSummary[];
}

export interface AdminMetrics {
  totalOrders: number;
  pendingQueueSize: number;
  expressQueueSize: number;
  activeRestaurants: number;
  totalCustomers: number;
  totalRevenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}
