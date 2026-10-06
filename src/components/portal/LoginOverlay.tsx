import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { getPortalSnapshot, PortalRole } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';
import { authService } from '../../services/authService';
import { ArchTechLogo } from '../brand/ArchTechLogo';

export const LoginOverlay: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const showQuickAccess = import.meta.env.DEV || import.meta.env.MODE === 'test';

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button, input') ?? []);
    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!authService.isRemote()) {
      const session = portalAuth.signIn(email, password);
      if (!session) {
        setError('Check the email and password.');
        return;
      }
      setError('');
      onSuccess();
      return;
    }
    void authService
      .signIn(email, password)
      .then((session) => {
        if (!session) {
          setError('Check the email and password.');
          return;
        }
        setError('');
        onSuccess();
      })
      .catch((err) => {
        setError(err instanceof Error && err.message ? err.message : 'Check the email and password.');
      });
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!registerName.trim() || !email.trim() || password.length < 8 || password !== confirmPassword) {
      setError('Enter your name, a valid email, a password of at least 8 characters and a matching confirmation.');
      return;
    }
    try {
      await authService.register({
        name: registerName,
        email,
        password,
        role: 'client',
        status: 'active',
        projectIds: [],
      });
      setError('');
      onSuccess();
    } catch (registrationError) {
      setError(
        registrationError instanceof Error ? registrationError.message : 'Registration could not be completed.',
      );
    }
  };

  const handleQuickLogin = (role: PortalRole) => {
    const user = getPortalSnapshot().db.users.find((candidate) => candidate.role === role);
    if (!user) {
      setError('This access is unavailable.');
      return;
    }
    if (!authService.isRemote()) {
      const session = portalAuth.signIn(user.email, user.password);
      if (!session) {
        setError('This access is unavailable.');
        return;
      }
      setError('');
      onSuccess();
      return;
    }
    void authService
      .signIn(user.email, user.password)
      .then((session) => {
        if (!session) {
          setError('This access is unavailable.');
          return;
        }
        setError('');
        onSuccess();
      })
      .catch((err) => {
        setError(err instanceof Error && err.message ? err.message : 'This access is unavailable.');
      });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-login-title"
        className="w-full max-w-lg border border-white/15 bg-[#111216]/95 p-6 text-[#f4efe8] shadow-2xl sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close login"
          className="ml-auto flex h-9 w-9 items-center justify-center border border-white/15 text-stone-300 transition-colors hover:border-white hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mt-6">
          <ArchTechLogo variant="stacked" tone="mint-cream" theme="dark" className="login-overlay-mark mb-6" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">Private access</p>
          <h1 id="client-login-title" className="mt-5 font-serif text-5xl font-light tracking-tight">
            Portal Access
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
            Review project progress, updates, documents and the current model.
          </p>

          {showQuickAccess && (
            <div className="mt-8 border-y border-white/10 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">Quick access</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(['client', 'architect', 'admin'] as PortalRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    data-testid={`quick-login-${role}`}
                    onClick={() => handleQuickLogin(role)}
                    className="border border-white/20 px-2 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-stone-200 transition-colors hover:border-white hover:bg-white hover:text-black"
                  >
                    {`${role[0].toUpperCase()}${role.slice(1)} access`}
                  </button>
                ))}
              </div>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">
                — or use credentials manually —
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4 border-b border-white/10 pb-3 font-mono text-[10px] uppercase tracking-[0.18em]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              aria-pressed={mode === 'login'}
              className={mode === 'login' ? 'text-white' : 'text-stone-500'}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              aria-pressed={mode === 'register'}
              className={mode === 'register' ? 'text-white' : 'text-stone-500'}
            >
              Register
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleSubmit : handleRegister} className="mt-8 space-y-7">
            {mode === 'register' && (
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Name
                <input
                  data-testid="register-name"
                  type="text"
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
                />
              </label>
            )}
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Email
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
              />
            </label>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Password
              <input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
              />
            </label>
            {mode === 'register' && (
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Confirm password
                <input
                  data-testid="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              data-testid="login-submit"
              type="submit"
              className="group flex w-full items-center justify-between bg-[#f4efe8] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-black transition-transform duration-200 active:translate-y-px"
            >
              {mode === 'login' ? 'Enter portal' : 'Create account'}{' '}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <p className="mt-6 font-mono text-[10px] leading-5 text-stone-500">Authorized project access.</p>
        </div>
      </div>
    </div>
  );
};
