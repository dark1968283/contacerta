"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, type AuthActionState } from "../actions";

const initialState: AuthActionState = {
error: null,
};

function SubmitButton() {
const { pending } = useFormStatus();

return ( <button
   type="submit"
   disabled={pending}
   className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
{pending ? "A entrar..." : "Entrar"} </button>
);
}

export default function LoginPage() {
const [state, formAction] = useFormState(signIn, initialState);

return ( <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4"> <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"> <div className="mb-8 text-center"> <h1 className="text-3xl font-bold text-gray-900">
ContaCerta </h1>

```
      <p className="mt-2 text-sm text-gray-500">
        Entre na sua conta para continuar.
      </p>
    </div>

    {state?.error && (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>{state.error}</p>

        {state.emailNotConfirmed && state.email && (
          <div className="mt-2">
            <Link
              href={`/verificar-email?email=${encodeURIComponent(
                state.email
              )}`}
              className="font-medium underline"
            >
              Verificar email
            </Link>
          </div>
        )}
      </div>
    )}

    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Palavra-passe
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <SubmitButton />
    </form>

    <div className="mt-6 text-center text-sm text-gray-600">
      Ainda não tem uma conta?{" "}
      <Link
        href="/signup"
        className="font-medium text-blue-600 hover:underline"
      >
        Criar conta
      </Link>
    </div>
  </div>
</main>


);
}
