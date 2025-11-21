import { Info, LogIn, UserPlus, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { InfoModal } from './InfoModal';
import { authApi } from '../services/api';
import { useStore } from '../store';
import { isApiError } from '../utils/typeGuards';

type AuthView = 'login' | 'register' | 'verify-email';

const REGISTRATION_ENABLED = import.meta.env.VITE_REGISTRATION_ENABLED === 'true';

export const WelcomeBar = () => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [expanded, setExpanded] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const verificationAttempted = useRef(false);

  const setUser = useStore(state => state.setUser);

  const verifyEmailWithToken = async (token: string) => {
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    setLoading(true);
    setError('');
    setSuccess('');

    const response = await authApi.verifyEmail(token);

    if (isApiError(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setSuccess(response.message);
    setLoading(false);

    setTimeout(() => {
      setAuthView('login');
      window.history.pushState({}, '', window.location.pathname);
    }, 3000);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');

    if (verificationToken) {
      setAuthView('verify-email');
      setExpanded(true);
      verifyEmailWithToken(verificationToken);
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@usc\.edu\.ph$/i;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    const response = await authApi.login({ email, password });

    if (isApiError(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setUser(response.user, response.token);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid @usc.edu.ph email address');
      setLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const response = await authApi.register({ email, password });

    if (isApiError(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setRegisteredEmail(email);
    setSuccess('Registration successful! Check your email for verification link.');
    setAuthView('verify-email');
    setLoading(false);
  };

  const handleResendVerification = async () => {
    const emailToUse = registeredEmail || email;

    if (!emailToUse) {
      setError('Please enter your email address');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const response = await authApi.resendVerification({ email: emailToUse });

    if (isApiError(response)) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setSuccess('Verification email sent! Please check your inbox.');
    setLoading(false);
  };

  const switchToLogin = () => {
    setAuthView('login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setExpanded(false);
  };

  const switchToRegister = () => {
    setAuthView('register');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setExpanded(true);
  };

  if (!expanded && authView === 'login') {
    return (
      <>
        <div className='fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-4 py-3 z-50'>
          <div className='flex flex-row gap-3 items-center'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1'>
                <h3 className='font-bold text-black text-sm mb-1'>
                  Welcome to DCISM Place
                </h3>
                <p className='text-gray-700 text-xs leading-tight'>
                  {REGISTRATION_ENABLED
                    ? 'Sign in with your USC email to start painting'
                    : 'Registration will open on Monday, Nov. 24'}
                </p>
              </div>
              <button
                onClick={() => setShowInfoModal(true)}
                className='bg-white text-black p-2 border-2 border-black hover:bg-gray-100 transition-colors shrink-0 hover:cursor-pointer'
                title='Information'
              >
                <Info size={16} />
              </button>
            </div>

            <div className='flex gap-2'>
              <button
                onClick={() => setExpanded(true)}
                disabled={!REGISTRATION_ENABLED}
                className={`px-4 py-2 border-2 transition-colors flex items-center gap-2 text-sm font-semibold ${
                  REGISTRATION_ENABLED
                    ? 'bg-black text-white border-black hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                }`}
                title='Sign In'
              >
                <LogIn size={16} />
                Sign In
              </button>
              <button
                onClick={switchToRegister}
                disabled={!REGISTRATION_ENABLED}
                className={`px-4 py-2 border-2 transition-colors flex items-center gap-2 text-sm font-semibold ${
                  REGISTRATION_ENABLED
                    ? 'bg-white text-black border-black hover:bg-gray-100'
                    : 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                }`}
                title='Register'
              >
                <UserPlus size={16} />
                Register
              </button>
            </div>
          </div>
        </div>

        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className='fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border-2 border-black p-6 z-50 max-w-md w-full'>
        <div className='flex justify-between items-start mb-4'>
        <div className='flex flex-col'>
          <h3 className='font-bold text-black text-lg'>
            {authView === 'login' && 'Sign In'}
            {authView === 'register' && 'Create Account'}
            {authView === 'verify-email' && 'Email Verification'}
          </h3>
          <p className='font-light text-black text-sm'>{authView === 'register' && 'You will be prompted with an email verification once you sign up.'}</p>
        </div>
          {authView === 'login' && (
            <button
              onClick={() => setExpanded(false)}
              className='text-black hover:text-gray-600 transition-colors'
              title='Close'
            >
              <X size={20} />
            </button>
          )}
        </div>

        {authView === 'login' && (
          <form onSubmit={handleLogin} className='space-y-4'>
            <div>
              <label htmlFor='email' className='block text-sm font-semibold text-black mb-1'>
                USC Email
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='yourname@usc.edu.ph'
                disabled={loading}
                autoFocus
                className='w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100'
              />
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-semibold text-black mb-1'>
                Password
              </label>
              <input
                type='password'
                id='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your password'
                disabled={loading}
                className='w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100'
              />
            </div>

            {error && (
              <div className='bg-white border-2 border-red-500 p-2 text-xs text-red-700'>
                {error}
                {error.includes('Email not verified') && (
                  <button
                    type='button'
                    onClick={handleResendVerification}
                    disabled={loading}
                    className='mt-2 text-xs underline hover:no-underline block'
                  >
                    {loading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}

            {success && (
              <div className='bg-green-50 border-2 border-green-500 p-2 text-xs text-green-800'>
                {success}
              </div>
            )}

            <button
              type='submit'
              disabled={loading || !email || !password}
              className='w-full py-2 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed text-sm font-semibold'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className='text-center'>
              <button
                type='button'
                onClick={switchToRegister}
                className='text-xs text-gray-600 hover:text-black underline'
              >
                Don't have an account? Register
              </button>
            </div>
          </form>
        )}

        {authView === 'register' && (
          <form onSubmit={handleRegister} className='space-y-4'>
            <div>
              <label htmlFor='email' className='block text-sm font-semibold text-black mb-1'>
                USC Email
              </label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='yourname@usc.edu.ph'
                disabled={loading}
                autoFocus
                className='w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100'
              />
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-semibold text-black mb-1'>
                Password
              </label>
              <input
                type='password'
                id='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Min 8 characters'
                disabled={loading}
                className='w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Must contain uppercase, lowercase, and numbers
              </p>
            </div>

            <div>
              <label htmlFor='confirmPassword' className='block text-sm font-semibold text-black mb-1'>
                Confirm Password
              </label>
              <input
                type='password'
                id='confirmPassword'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Re-enter password'
                disabled={loading}
                className='w-full px-3 py-2 border-2 border-black text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 disabled:bg-gray-100'
              />
            </div>

            {error && (
              <div className='bg-white border-2 border-red-500 p-2 text-xs text-red-700'>
                {error}
              </div>
            )}

            {success && (
              <div className='bg-green-50 border-2 border-green-500 p-2 text-xs text-green-800'>
                {success}
              </div>
            )}

            <button
              type='submit'
              disabled={loading || !email || !password || !confirmPassword}
              className='w-full py-2 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed text-sm font-semibold'
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className='text-center'>
              <button
                type='button'
                onClick={switchToLogin}
                className='text-xs text-gray-600 hover:text-black underline'
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {authView === 'verify-email' && (
          <div className='space-y-4'>
            {loading && (
              <div className='text-center py-4'>
                <div className='animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black mx-auto mb-2'></div>
                <p className='text-sm text-gray-600'>Verifying your email...</p>
              </div>
            )}

            {!loading && success && (
              <div className='bg-green-50 border-2 border-green-500 p-3 text-sm text-green-800'>
                {success}
              </div>
            )}

            {!loading && error && (
              <div className='bg-white border-2 border-red-500 p-3 text-sm text-red-700'>
                {error}
              </div>
            )}

            {!loading && !success && !error && (
              <>
                <div className='bg-blue-50 border-2 border-blue-500 p-3'>
                  <p className='text-sm text-blue-800 font-semibold mb-1'>Check Your Email</p>
                  <p className='text-xs text-blue-700'>
                    We've sent a verification email to <strong>{registeredEmail}</strong>.
                    Click the link in the email to verify your account.
                  </p>
                </div>

                <button
                  onClick={handleResendVerification}
                  disabled={loading}
                  className='w-full py-2 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed text-sm font-semibold'
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </>
            )}

            <div className='text-center'>
              <button
                type='button'
                onClick={switchToLogin}
                className='text-xs text-gray-600 hover:text-black underline'
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
};
