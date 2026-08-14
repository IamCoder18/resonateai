import { SignUpFormMobile } from "@/components/sign-up-form-mobile";

export default function AppSignUpPage() {
  return (
    <div className="mx-auto max-w-md pt-4">
      <h1 className="font-serif text-[2rem] leading-tight text-bone">
        Make an account.
      </h1>
      <p className="mt-2 font-mono text-[0.85rem] text-bone-70">
        Email, password, name.
      </p>
      <div className="mt-6">
        <SignUpFormMobile />
      </div>
    </div>
  );
}
