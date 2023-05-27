
import { getAuth } from "@clerk/remix/ssr.server";
import { Tabs } from "@mantine/core";
import { LoaderFunction, redirect } from "@remix-run/node";
import { Outlet, useNavigate } from "@remix-run/react";
// import { IconChecklist, IconSettings2 } from "@tabler/icons";

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in");
  }
  return {};
};

export default function UserProfilePage() {
  const navigate = useNavigate();

  return (
    <div>
      <Tabs
        onTabChange={(value) => {
          navigate(`/profile/${value}`);
        }}
        defaultValue={"overview"}
      >
        <Tabs.List>
          <Tabs.Tab value="overview" // icon={<IconSettings2 />}
          >
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="settings" // icon={<IconSettings2 />}
          >
            Settings
          </Tabs.Tab>
          <Tabs.Tab value="plans" //icon={<IconChecklist />}
          >
            Plans
          </Tabs.Tab>
        </Tabs.List>
        <Outlet />
      </Tabs>
    </div>
  );
}
