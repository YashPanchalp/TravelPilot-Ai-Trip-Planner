import React, { useEffect, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { googleLogout } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

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
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
  <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:px-6 lg:px-8">
    <button className="group flex min-w-0 items-center gap-2 sm:gap-3" onClick={() => navigation('/')}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 shadow-md transition-transform duration-300 group-hover:scale-105">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-white"
          aria-hidden="true"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      </div>
      <h1 className="max-w-28 truncate bg-linear-to-r from-indigo-600 to-fuchsia-500 bg-clip-text text-base font-extrabold tracking-tight text-transparent sm:max-w-none sm:text-xl">
        Travel Pilot
      </h1>
    </button>

    {user ?
    <div className='flex max-w-[62%] flex-wrap items-center justify-end gap-2 sm:max-w-none sm:gap-3'> 
    <button
      type="button"
      className="h-9 whitespace-nowrap rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 focus:outline-none sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
      onClick={() => navigation('/create-trip')}
    >
    Create Trip
    </button>
    <button
      type="button"
      className="h-9 whitespace-nowrap rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md focus:outline-none sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
      onClick={() => navigation('/my-trips')}
    >
    My Trips
    </button>
    <Popover>
  <PopoverTrigger asChild>
    {avatarFailed ? (
      <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-slate-200 text-sm font-bold uppercase text-slate-700 shadow-md transition-transform duration-300 hover:scale-105">
        {(user?.name || 'U').trim().charAt(0)}
      </div>
    ) : (
    <img
      className="h-10 w-10 cursor-pointer rounded-full border-2 border-white object-cover shadow-md transition-transform duration-300 hover:scale-105"
      src={userImage}
      referrerPolicy="no-referrer"
      alt={user?.name || 'User profile'}
      onError={(e) => {
        e.currentTarget.onerror = null;
        setAvatarFailed(true);
      }}
    />
    )}
  </PopoverTrigger>
  <PopoverContent className='w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-xl'>
    <button onClick={handleLogout} className='w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100'>
      Log Out
    </button>
  </PopoverContent>
</Popover>
    </div>
    : <div className='flex max-w-[62%] flex-wrap items-center justify-end gap-2 sm:max-w-none sm:gap-3'>
      <button
        type="button"
        className="h-9 whitespace-nowrap rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 focus:outline-none sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
        onClick={() => navigation('/create-trip')}
      >
        Create Trip
      </button>
      <button
        className="h-9 whitespace-nowrap rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md focus:outline-none sm:h-10 sm:px-4 sm:py-2 sm:text-sm"
        onClick={() => navigation('/sign-in')}
      >
        Sign In
      </button>
    </div>}
  </div>
</header>
  )
}

export default Header