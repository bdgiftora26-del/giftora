import { StorefrontShell } from '@/components/layout/StorefrontShell'
import { AuthForm } from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <StorefrontShell>
      <AuthForm mode="register" />
    </StorefrontShell>
  )
}
