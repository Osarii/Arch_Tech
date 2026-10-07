import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../../components/auth/AuthShell';
import { roleHome } from '../../router/guards';
import { authService } from '../../services/authService';
import { isCostaRicanId, lookupHaciendaIdentity, normalizeCostaRicanId } from '../../services/haciendaService';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingId, setCheckingId] = useState(false);

  const checkIdentity = async () => {
    if (!isCostaRicanId(identification)) {
      setMessage(t('auth.identityInvalid', 'Enter a valid Costa Rican identification number.'));
      return;
    }
    setCheckingId(true);
    const result = await lookupHaciendaIdentity(identification);
    setCheckingId(false);
    if (result.status === 'found') {
      setName((current) => current || result.name);
      setMessage(t('auth.identityFound', 'Identity found: {{name}}.', { name: result.name }));
    } else if (result.status === 'not-found') {
      setMessage(t('auth.identityMissing', 'No public name was returned. You can still enter your name and continue.'));
    } else {
      setMessage(result.retryAfter ? t('auth.identityRetry', 'Lookup is temporarily unavailable. Try again in {{seconds}} seconds.', { seconds: result.retryAfter }) : t('auth.identityUnavailable', 'Lookup is temporarily unavailable. You can still enter your name and continue.'));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isCostaRicanId(identification) || !name.trim() || password.length < 8 || password !== confirmation) {
      setMessage(t('auth.registrationValidation', 'Enter your identification, name, email and a matching password of at least 8 characters.'));
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const session = await authService.register({ name, email, password, role: 'client', status: 'active', projectIds: [] });
      navigate(roleHome(session.role), { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t('auth.registerTitle', 'Create client access')} description={t('auth.registerDescription', 'A client account keeps project access connected to a single identity.')}>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('auth.costaRicaId', 'Costa Rica ID')}
          <div className="mt-2 flex gap-2">
            <input data-testid="register-cedula" required inputMode="numeric" value={identification} onChange={(event) => setIdentification(normalizeCostaRicanId(event.target.value))} className="min-w-0 flex-1 border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
            <button type="button" onClick={checkIdentity} disabled={checkingId} className="border border-[#ABD1B5]/40 px-3 text-[10px] text-[#EDF4ED] disabled:opacity-60">{checkingId ? t('auth.checking', 'Checking…') : t('auth.check', 'Check')}</button>
          </div>
        </label>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.name', 'Name')}
          <input data-testid="register-name" required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
        </label>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.email', 'Email')}
          <input data-testid="register-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
        </label>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.password', 'Password')}
          <input data-testid="register-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
        </label>
        <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[#ABD1B5]">{t('login.confirmPassword', 'Confirm password')}
          <input data-testid="register-confirm-password" required type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full border-0 border-b border-[#ABD1B5]/40 bg-transparent px-0 py-3 text-sm text-[#EDF4ED] outline-none focus:border-[#79B791]" />
        </label>
        {message && <p role="status" className="text-sm text-[#ABD1B5]">{message}</p>}
        <button data-testid="register-submit" disabled={submitting} className="flex w-full items-center justify-between bg-[#79B791] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-black disabled:opacity-60">
          {submitting ? t('auth.creating', 'Creating…') : t('auth.createClientAccount', 'Create client account')} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-6 text-sm text-[#ABD1B5]">{t('auth.alreadyRegistered', 'Already registered?')} <Link to="/login" className="text-[#EDF4ED] underline underline-offset-4">{t('login.signIn', 'Sign in')}</Link>.</p>
    </AuthShell>
  );
};
