import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await registerUser(data.fullName, data.email, data.password);
      navigate('/restaurants');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-potato-olive text-potato-lime flex items-center justify-center mx-auto shadow-md">
          <span className="font-drama text-2xl font-black italic">P</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-potato-ink">Create Your Account</h1>
        <p className="text-sm text-potato-muted">
          Order from artisan restaurants with queue priority
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
            label="Full Name"
            placeholder="Jane Doe"
            {...register('fullName')}
            error={errors.fullName?.message}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <div className="relative">
            <Input
              label="Password (min 8 characters)"
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
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-potato-muted pt-2 border-t border-potato-border">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-potato-olive hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};
