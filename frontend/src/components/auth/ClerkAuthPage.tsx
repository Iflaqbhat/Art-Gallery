import { SignIn, SignUp } from '@clerk/react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '@/components/ui/logo'

export default function ClerkAuthPage({ mode = 'sign-in', admin = false }: { mode?: 'sign-in' | 'sign-up'; admin?: boolean }) {
  const Component = mode === 'sign-up' ? SignUp : SignIn
  const isSignUp = mode === 'sign-up'

  return (
    <main className="min-h-screen bg-background px-4 py-3 sm:py-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[26rem] items-center sm:min-h-[calc(100vh-2.5rem)]">
        <section className="relative w-full overflow-hidden border border-border bg-card shadow-frame">
          <div className="h-0.5 w-full bg-champagne" aria-hidden="true" />

          <div className="border-b border-border px-5 py-4 text-center sm:px-7">
            <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center">
              <Link
                to="/"
                className="inline-flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-champagne/60 hover:text-champagne"
                aria-label="Return to the gallery"
                title="Back to gallery"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex justify-center"><Logo variant={admin ? 'admin' : undefined} /></div>
              <span aria-hidden="true" />
            </div>

            <h1 className="mt-4 font-display text-2xl leading-tight text-ivory sm:text-3xl">
              {admin ? 'Curator sign in' : isSignUp ? 'Create account' : 'Sign in'}
            </h1>
          </div>

          <Component
            routing="hash"
            fallbackRedirectUrl={admin ? '/admin' : '/'}
            signUpUrl="/auth/register"
            signInUrl={admin ? '/admin/secret-login-panel-2024' : '/auth/login'}
            appearance={{
              elements: {
                rootBox: '!w-full !min-w-0 !max-w-full',
                cardBox: '!w-full !min-w-0 !max-w-full !border-0 !shadow-none',
                card: '!w-full !min-w-0 !max-w-full !rounded-none !border-0 !bg-transparent !shadow-none',
                header: 'hidden',
                main: '!px-5 !py-4 sm:!px-7',
                socialButtonsBlockButton: '!h-10 !rounded-none !border-border !bg-background text-ivory hover:!border-champagne/50 hover:!bg-secondary',
                socialButtonsBlockButtonText: 'font-medium text-ivory',
                dividerRow: '!my-3.5',
                dividerLine: 'bg-border',
                dividerText: 'text-xs uppercase text-muted-foreground',
                form: '!gap-3.5',
                formFieldLabel: '!mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory',
                formFieldInput: '!h-10 !rounded-none !border-border !bg-background !px-3 text-ivory placeholder:text-muted-foreground focus:!border-champagne focus:!ring-1 focus:!ring-champagne/30',
                formButtonPrimary: '!mt-1 !h-10 !rounded-none bg-champagne font-medium text-primary-foreground shadow-none hover:bg-ivory',
                footer: '!rounded-none border-t border-border !bg-secondary/30 !px-5 !py-2.5 sm:!px-7',
                footerAction: '!mb-0',
                footerActionText: 'text-muted-foreground',
                footerActionLink: 'font-medium text-champagne hover:text-ivory',
                footerPages: 'text-muted-foreground',
                identityPreview: '!rounded-none !border-border !bg-background',
                identityPreviewText: 'text-ivory',
                identityPreviewEditButton: 'text-champagne',
                formFieldErrorText: 'mt-1 text-red-400',
                formResendCodeLink: 'text-champagne',
              },
            }}
          />
        </section>
      </div>
    </main>
  )
}
