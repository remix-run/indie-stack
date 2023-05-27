import { SignUp } from "@clerk/remix";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="container">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        appearance={{ baseTheme: dark }}
      />
    </div>
  );
}
