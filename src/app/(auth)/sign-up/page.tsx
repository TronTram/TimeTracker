import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div>
      {/* Back to home link */}
      <div className="text-center mb-6">
        <Link 
          href="/" 
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1"
        >
          ← Back to home
        </Link>
      </div>

      <div className="flex justify-center">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 bg-transparent",
              headerTitle: "text-2xl font-bold text-gray-900 dark:text-white",
              headerSubtitle: "text-gray-600 dark:text-gray-400",
              socialButtonsBlockButton: "border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors",
              socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-300 font-medium",
              dividerLine: "bg-gray-200 dark:bg-gray-600",
              dividerText: "text-gray-500 dark:text-gray-400",
              formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
              formFieldInput: "border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors",
              formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200",
              footerActionLink: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium",
              identityPreviewText: "text-gray-700 dark:text-gray-300",
              formResendCodeLink: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            }
          }}
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          redirectUrl="/onboarding"
          afterSignUpUrl="/onboarding"
        />
      </div>

      {/* Additional sign-in link */}
      <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link 
          href="/sign-in" 
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
} 