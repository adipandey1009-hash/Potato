import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Eye, EyeOff, AlertCircle, ChefHat, ShieldCheck, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await login(data.email, data.password);
      if (user.role === 'KITCHEN_STAFF') {
        navigate('/kitchen');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
      setIsLoading(false);
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-potato-olive text-potato-lime flex items-center justify-center mx-auto shadow-md">
          <span className="font-drama text-2xl font-black italic">P</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-potato-ink">Sign in to Potato</h1>
        <p className="text-sm text-potato-muted">
          Access your cart, order queue, and kitchen dashboard
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-potato-error text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Card elevated className="p-6 sm:p-8 space-y-6 bg-potato-surface border-[#D8D5C8]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-potato-muted hover:text-potato-ink"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button
            type="submit"
            variant="lime"
            size="lg"
            isLoading={isLoading}
            className="w-full text-base font-bold shadow-md mt-2"
          >
            Sign In
          </Button>
        </form>

        <div className="pt-4 border-t border-potato-border space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-potato-muted block text-center">
            One-Click Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('customer@potato.local', 'PotatoDemo123!')}
              className="p-2 rounded-xl border border-potato-border bg-potato-bg hover:border-potato-olive text-left transition-colors text-xs"
            >
              <User className="w-3.5 h-3.5 text-potato-olive mb-1" />
              <strong className="block text-[11px] text-potato-ink leading-tight">Customer</strong>
              <span className="text-[9px] text-potato-muted">Anshika</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('kitchen@potato.local', 'PotatoKitchen123!')}
              className="p-2 rounded-xl border border-potato-border bg-potato-bg hover:border-potato-olive text-left transition-colors text-xs"
            >
              <ChefHat className="w-3.5 h-3.5 text-potato-olive mb-1" />
              <strong className="block text-[11px] text-potato-ink leading-tight">Kitchen</strong>
              <span className="text-[9px] text-potato-muted">Chef Marco</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('admin@potato.local', 'PotatoAdmin123!')}
              className="p-2 rounded-xl border border-potato-border bg-potato-bg hover:border-potato-olive text-left transition-colors text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-potato-olive mb-1" />
              <strong className="block text-[11px] text-potato-ink leading-tight">Admin</strong>
              <span className="text-[9px] text-potato-muted">Manager</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-potato-muted">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-potato-olive hover:underline">
            Register here
          </Link>
        </div>
      </Card>
    </div>
  );
};
