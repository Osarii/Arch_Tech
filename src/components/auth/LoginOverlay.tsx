import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
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
        setError(t('login.errorInvalidCredentials', 'Check the email and password.'));
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
          setError(t('login.errorInvalidCredentials', 'Check the email and password.'));
          return;
        }
        setError('');
        onSuccess();
      })
      .catch((err) => {
        setError(err instanceof Error && err.message ? err.message : t('login.errorInvalidCredentials', 'Check the email and password.'));
      });
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!registerName.trim() || !email.trim() || password.length < 8 || password !== confirmPassword) {
      setError(t('login.errorRegisterValidation', 'Enter your name, a valid email, a password of at least 8 characters and a matching confirmation.'));
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
        registrationError instanceof Error ? registrationError.message : t('login.errorRegisterFailed', 'Registration could not be completed.'),
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
        className="relative w-full max-w-lg border border-white/15 bg-[#111216]/95 p-6 text-[#f4efe8] shadow-2xl sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label={t('login.close', 'Close login')}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center border border-white/15 text-stone-300 transition-colors hover:border-white hover:text-white sm:right-6 sm:top-6"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center pt-3 text-center">
          <div className="mb-6 flex justify-center">
            <ArchTechLogo variant="full" theme="dark" className="login-overlay-mark" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-500">{t('login.privateAccess', 'Private access')}</p>
          <h1 id="client-login-title" className="mt-5 font-serif text-5xl font-light tracking-tight">
            {t('login.title', 'Portal Access')}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
            {t('login.description', 'Review project progress, updates, documents and the current model.')}
          </p>

          {showQuickAccess && (
            <div className="mt-8 border-y border-white/10 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">{t('login.quickAccess', 'Quick access')}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(['client', 'architect', 'admin'] as PortalRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    data-testid={`quick-login-${role}`}
                    onClick={() => handleQuickLogin(role)}
                    className="border border-white/20 px-2 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-stone-200 transition-colors hover:border-white hover:bg-white hover:text-black"
                  >
                    {t('login.roleAccess', '{{role}} access', { role: role[0].toUpperCase() + role.slice(1) })}
                  </button>
                ))}
              </div>
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">
                {t('login.orCredentials', '— or use credentials manually —')}
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
              {t('login.signIn', 'Sign in')}
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
              {t('login.register', 'Register')}
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleSubmit : handleRegister} className="mt-8 space-y-7">
            {mode === 'register' && (
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
                {t('login.name', 'Name')}
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
              {t('login.email', 'Email')}
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-white"
              />
            </label>
            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
              {t('login.password', 'Password')}
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
                {t('login.confirmPassword', 'Confirm password')}
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
              {mode === 'login' ? t('login.enterPortal', 'Enter portal') : t('login.createAccount', 'Create account')}{' '}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <p className="mt-6 font-mono text-[10px] leading-5 text-stone-500">{t('login.authorizedAccess', 'Authorized project access.')}</p>
        </div>
      </div>
    </div>
  );
};
