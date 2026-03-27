// src/app/onboarding/page.tsx
import { OnboardingForm } from '@/features/onboarding/components/OnboardingForm'

export default function OnboardingPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-4">
      <OnboardingForm />
    </div>
  )
}
