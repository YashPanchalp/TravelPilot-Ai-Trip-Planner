import React, { useEffect, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { googleLogout } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, PlaneTakeoff, Sparkles, X } from 'lucide-react';

const parseStoredUser = (rawUser) => {
  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser);

    if (typeof parsed === 'string') {
      try {
        return JSON.parse(parsed);
      } catch {
        return null;
      }
    }

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

function Header() {
  const [user, setUser] = useState(() => parseStoredUser(localStorage.getItem('user')));
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=e2e8f0&color=0f172a`;

  const userImage =
    user?.picture ||
    user?.photoURL ||
    user?.imageUrl ||
    user?.avatar_url ||
    user?.profile?.picture ||
    user?.profileObj?.imageUrl ||
    fallbackAvatar;
  const navigation = useNavigate();

  const syncUserFromStorage = () => {
    setUser(parseStoredUser(localStorage.getItem('user')));
    setAvatarFailed(false);
  };

  const goTo = (path) => {
    setMobileMenuOpen(false);
    navigation(path);
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('user-auth-changed'));
    setUser(null);
    setAvatarFailed(false);
    navigation('/');
  };

  useEffect(() => {
    window.addEventListener('storage', syncUserFromStorage);
    window.addEventListener('user-auth-changed', syncUserFromStorage);

    return () => {
      window.removeEventListener('storage', syncUserFromStorage);
      window.removeEventListener('user-auth-changed', syncUserFromStorage);
    };
  }, []);

  return (
    <header className='sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between gap-4'>
          <button className='group flex min-w-0 items-center gap-3' onClick={() => goTo('/')}>
            <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white transition-transform duration-300 group-hover:scale-105'>
              <PlaneTakeoff className='h-5 w-5' />
            </div>
            <div className='min-w-0 text-left'>
              <div className='flex items-center gap-2'>
                <h1 className='truncate text-sm font-semibold tracking-tight text-slate-950 sm:text-base'>Travel Pilot</h1>
                <span className='rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-700'>AI</span>
              </div>
              <p className='hidden text-xs text-slate-500 sm:block'>Plan polished trips in minutes</p>
            </div>
          </button>

          <div className='hidden items-center gap-2 lg:flex'>
            <button type='button' className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700' onClick={() => goTo('/create-trip')}>
              Create Trip
            </button>
            <button type='button' className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50' onClick={() => goTo('/my-trips')}>
              My Trips
            </button>
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  {avatarFailed ? (
                    <div className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold uppercase text-slate-700 transition-transform duration-300 hover:scale-105'>
                      {(user?.name || 'U').trim().charAt(0)}
                    </div>
                  ) : (
                    <img
                      className='h-10 w-10 cursor-pointer rounded-full border border-slate-200 object-cover transition-transform duration-300 hover:scale-105'
                      src={userImage}
                      referrerPolicy='no-referrer'
                      alt={user?.name || 'User profile'}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        setAvatarFailed(true);
                      }}
                    />
                  )}
                </PopoverTrigger>
                <PopoverContent className='w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl'>
                  <button onClick={handleLogout} className='flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100'>
                    <Sparkles className='h-4 w-4 text-indigo-600' />
                    Log Out
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <button type='button' className='rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500' onClick={() => goTo('/sign-in')}>
                Sign In
              </button>
            )}
          </div>

          <button
            type='button'
            className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 lg:hidden'
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label='Toggle navigation menu'
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className='pb-4 lg:hidden'>
            <div className='rounded-3xl border border-slate-200 bg-white p-3 shadow-sm'>
              <button type='button' className='flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50' onClick={() => goTo('/create-trip')}>
                Create Trip
                <ChevronDown className='h-4 w-4 text-slate-400' />
              </button>
              <button type='button' className='mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50' onClick={() => goTo('/my-trips')}>
                My Trips
                <ChevronDown className='h-4 w-4 text-slate-400' />
              </button>
              {user ? (
                <button type='button' className='mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50' onClick={handleLogout}>
                  Log Out
                  <ChevronDown className='h-4 w-4 text-slate-400' />
                </button>
              ) : (
                <button type='button' className='mt-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50' onClick={() => goTo('/sign-in')}>
                  Sign In
                  <ChevronDown className='h-4 w-4 text-slate-400' />
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default Header