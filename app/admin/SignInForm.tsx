'use client';

import { useActionState } from 'react';
import { signIn, type ActionState } from './actions';

export function SignInForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, undefined);
  return (
    <form className="admin-signin" action={action}>
      <h1>IPA admin</h1>
      <p className="admin-muted">Sign in to manage regions, properties and access codes.</p>
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" autoFocus required />
      {state?.error && (
        <p className="admin-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="admin-btn primary" type="submit" disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
