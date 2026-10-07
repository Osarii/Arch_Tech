import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../../components/auth/AuthShell';
import { roleHome } from '../../router/guards';
import { authService } from '../../services/authService';
import { getPortalSnapshot, type PortalRole } from '../../portal/data';
import { portalAuth } from '../../portal/demoAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const resolved = authService.isRemote()
        ? await authService.signIn(email, password)
        : portalAuth.signIn(email, password);
      if (!resolved) {
        setError(t('login.errorInvalidCredentials', 'Check the email and password.'));
        return;
      }
      navigate(roleHome(resolved.role), { replace: true });
    } catch {
      setError(t('login.errorRegisterFailed', 'The portal is unavailable. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = (role: PortalRole) => {
    const user = getPortalSnapshot().db.users.find((candidate) => candidate.role === role);
    if (!user) return;
    const session = portalAuth.signIn(user.email, user.password);
    if (session) navigate(roleHome(session.role), { replace: true });
  };

  return (
    <AuthShell title="Portal Access" description={t('auth.loginDescription', 'Review current project information, approvals and documents.')}>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.email', 'Email')}
          <input data-testid="login-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
        </label>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.password', 'Password')}
          <input data-testid="login-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
        </label>
        {error && <p role="alert" className="text-sm text-[#FFBF00]">{error}</p>}
        <button data-testid="login-submit" disabled={submitting} className="flex w-full items-center justify-between bg-[#79B791] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-black disabled:opacity-60">
          {submitting ? t('auth.checking', 'Checking…') : t('login.enterPortal', 'Enter portal')} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      {(import.meta.env.DEV || import.meta.env.MODE === 'test') && (
        <div className="mt-6 border-t border-[#ABD1B5]/25 pt-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#ABD1B5]">{t('login.quickAccess', 'Quick access')}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['client', 'architect', 'admin'] as PortalRole[]).map((role) => (
              <button key={role} type="button" data-testid={`quick-login-${role}`} onClick={() => quickLogin(role)} className="border border-[#ABD1B5]/35 px-2 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#EDF4ED] hover:border-[#79B791]">
                {t('login.roleAccess', '{{role}} access', { role })}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-6 text-sm text-[#ABD1B5]">{t('auth.needAccess', 'Need access?')} <Link to="/register" className="text-[#EDF4ED] underline underline-offset-4">{t('auth.createClientLink', 'Create a client account')}</Link>.</p>
      <Link to="/" className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-[#ABD1B5] hover:text-[#EDF4ED]">{t('auth.backToSite', 'Back to site')}</Link>
    </AuthShell>
  );
};
