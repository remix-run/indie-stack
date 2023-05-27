import { SignIn } from "@clerk/remix";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="flex w-full h-full justify-center items-center">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{ baseTheme: dark }}
      />
    </div>
  );
}
