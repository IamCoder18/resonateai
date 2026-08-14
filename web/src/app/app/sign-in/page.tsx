import { SignInFormMobile } from "@/components/sign-in-form-mobile";

export default function AppSignInPage() {
  return (
    <div className="mx-auto max-w-md pt-4">
      <h1 className="font-serif text-[2rem] leading-tight text-bone">
        Sign in.
      </h1>
      <p className="mt-2 font-mono text-[0.85rem] text-bone-70">
        Resume your queue.
      </p>
      <div className="mt-6">
        <SignInFormMobile />
      </div>
    </div>
  );
}
