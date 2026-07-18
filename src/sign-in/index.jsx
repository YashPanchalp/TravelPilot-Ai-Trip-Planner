import React, { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const normalizeGoogleUser = (profile = {}) => ({
  ...profile,
  picture:
    profile?.picture ||
    profile?.photoURL ||
    profile?.imageUrl ||
    profile?.avatar_url ||
    profile?.profile?.picture ||
    profile?.profileObj?.imageUrl ||
    '',
});

function SignInPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    onSuccess: async (tokenInfo) => {
      try {
        const response = await axios.get(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenInfo.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${tokenInfo.access_token}`,
              Accept: 'application/json',
            },
          }
        );

        const normalizedUser = normalizeGoogleUser(response.data);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        globalThis.dispatchEvent(new Event('user-auth-changed'));
        toast.success('Signed in successfully');
        navigate('/', { replace: true });
      } catch (error) {
        toast.error('Could not load Google profile. Please try again.');
        console.error('GetUserProfile failed:', error?.response?.data || error.message || error);
      }
    },
    onError: () => {
      toast.error('Google sign in failed. Please try again.');
    },
  });

  return (
    <section className='relative flex min-h-[78vh] items-center justify-center overflow-hidden px-4 py-12 sm:px-8'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.2),transparent_38%)]' />
      <div className='pointer-events-none absolute -left-12 top-24 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl' />
      <div className='pointer-events-none absolute -right-12 bottom-16 h-64 w-64 rounded-full bg-fuchsia-300/25 blur-3xl' />

      <div className='relative w-full max-w-md rounded-3xl border border-white/60 bg-white/75 p-8 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_36px_90px_-28px_rgba(79,70,229,0.35)]'>
        <div className='mb-6 flex items-center justify-center gap-2'>
          <img className='h-8 w-8 rounded-md' src='/logo.png' alt='AI Trip Planner logo' />
          <span className='bg-linear-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-xl font-extrabold tracking-wide text-transparent'>AI Trip Planner</span>
        </div>

        <h1 className='text-center text-3xl font-extrabold text-slate-900'>Sign in with Google</h1>
        <p className='mt-3 text-center text-slate-600'>Sign in to access your saved trips, generate new plans, and continue your itinerary flow.</p>

        <Button
          className='mt-8 h-12 w-full rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30'
          onClick={login}
        >
          <FcGoogle />
          Sign In With Google
        </Button>
      </div>
    </section>
  );
}

export default SignInPage;
