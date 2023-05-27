import { SignedIn, UserProfile } from "@clerk/remix";
import { dark } from "@clerk/themes";
import { useMantineTheme } from "@mantine/core";

const Settings = () => {
  const { colorScheme } = useMantineTheme();

  return (
    <SignedIn>
      <div className="flex justify-center w-full p-4">
        <UserProfile
          path="/profile/settings"
          routing="path"
          appearance={colorScheme === "dark" ? { baseTheme: dark } : undefined}
        /></div>
    </SignedIn>
  );
};

export default Settings;
