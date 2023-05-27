import {
  ClerkApp,
  ClerkCatchBoundary,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/remix";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { dark } from "@clerk/themes";
import {
  AppShell,
  Burger,
  createEmotionCache,
  Footer,
  Header,
  MantineProvider,
  MediaQuery,
  Navbar,
  NavLink,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { StylesPlaceholder } from "@mantine/remix";
import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
// import type { TablerIcon } from "@tabler/icons";
// import {
//   IconPhotoPlus,
//   IconPhotoSearch,
//   IconPhotoX,
//   IconSettings,
//   IconUser,
// } from "@tabler/icons";
import { useState } from "react";
// import { theme } from "./theme";
import tailwind from './tailwind.css'

export const CatchBoundary = ClerkCatchBoundary();
createEmotionCache({ key: "mantine" });

export const links: LinksFunction = () => [
  // { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: tailwind },
  {
    rel: "icon",
    href: "/favicon.png",
    type: "image/png",
  },
  {
    rel: "icon",
    href: "/android-chrome-192x192.png",
    type: "image/png",
  },
  {
    rel: "icon",
    href: "/android-chrome-512x512.png",
    type: "image/png",
  },
  {
    rel: "icon",
    href: "/apple-touch-icon.png",
    type: "image/png",
  },
  {
    rel: "icon",
    href: "/favicon-16x16.png",
    type: "image/png",
  },
  {
    rel: "icon",
    href: "/favicon-32x32.png",
    type: "image/png",
  },
  {
    rel: "icon",
    href: "/favicon.ico",
    type: "image/png",
  },
];



export const loader: LoaderFunction = (args) => {
  return rootAuthLoader(args, ({ request }) => {
    const { sessionId, userId, getToken } = request.auth;



    // fetch data
    // return { yourData: "here", ENV: getGlobalEnvs() };
    return {}
  });
};

export type NavLinkType = {
  // icon: TablerIcon;
  label: string;
  description?: string;
  rightSection?: React.ReactNode // | TablerIcon;
  link: string;
};

const navLinks: Array<
  NavLinkType & {
    subLinks?: Array<NavLinkType>;
  }
> = [
    {
      // icon: IconPhotoSearch,
      label: "View Galleries",
      link: "/view-galleries",
    },
    {
      // icon: IconPhotoPlus,
      label: "Create Galleries",
      link: "/gallery/create-gallery",
    },
    {
      // icon: IconPhotoX,
      label: "View All Images",
      link: "/view-images",
    },
    {
      // icon: IconUser,
      label: "Profile",
      link: "/profile/overview",
      subLinks: [
        // { icon: IconSettings, label: "Settings", link: "/profile/settings" },
      ],
    },
  ];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

const Content = () => {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const { colorScheme } = useMantineTheme();

  return (
    <AppShell
      styles={{
        main: {
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        <SignedIn>
          <Navbar
            p="md"
            hiddenBreakpoint="sm"
            hidden={!opened}
            width={{ sm: 200, lg: 300 }}
          >
            {navLinks.map((item, index) => {
              return (
                <Link
                  to={item.link}
                  key={item.link}
                  onClick={() => {
                    // setActive(index);
                    setOpened(false);
                  }}
                >
                  <NavLink
                    key={item.label}
                    // update active to be based on path
                    // active={index === active}
                    label={item.label}
                    description={item.description}
                  // rightSection={
                  //   item.rightSection ? <item.rightSection /> : null
                  // }
                  // icon={<item.icon size={16} stroke={1.5} />}
                  // onClick={() => setActive(index)}
                  >
                    {/* for some reason this completely breaks the styling of the site. */}
                    {/* {item?.subLinks?.map((subItem) => {
                    return (
                      <Link to={subItem.link} key={subItem.link}>
                        <NavLink
                          key={subItem.label}
                          label={subItem.label}
                          description={subItem.description}
                          rightSection={
                            subItem.rightSection ? (
                              <subItem.rightSection />
                            ) : null
                          }
                          icon={<subItem.icon size={16} stroke={1.5} />}
                        />
                      </Link>
                    );
                  })} */}
                  </NavLink>
                </Link>
              );
            })}
          </Navbar>
        </SignedIn>
      }
      footer={
        <Footer height={60} p="md">
          Application footer
        </Footer>
      }
      header={
        <Header height={70} p="md">
          <div className="flex items-center h-full">
            <MediaQuery largerThan="sm" styles={{ display: "none" }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>

            <div className="flex justify-between items-center w-full">
              <div>
                <Link to="/" className="logo">
                  <div className="flex items-center">
                    <img
                      src="/android-chrome-512x512.png"
                      width="64"
                      height="64"
                      alt="Logo"
                    />
                    <Text size="xl" weight={500}>
                      Moop Share
                    </Text>
                  </div>
                </Link>
              </div>
              <div>
                <SignedOut>
                  <Link to="/sign-in">Sign in</Link>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    userProfileUrl="/profile"
                    afterSignOutUrl="/"
                    appearance={
                      colorScheme === "dark" ? { baseTheme: dark } : undefined
                    }
                  />
                </SignedIn>
              </div>
            </div>
          </div>
        </Header>
      }
    >
      <Outlet />
    </AppShell>
  );
};

function App() {
  const {  } = useLoaderData<typeof loader>();
  return (
    <MantineProvider // theme={theme}
      withGlobalStyles withNormalizeCSS>
      <html lang="en">
        <head>
          <StylesPlaceholder />
          <Meta />
          <Links />
        </head>
        <body>
          {/* <Header /> */}
          <Content />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          {/* Global Shared Envs. */}
          {/* <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(ENV)}`,
            }}
          /> */}

          {process.env.NODE_ENV === "development" && <LiveReload />}
        </body>
      </html>
    </MantineProvider>
  );
}

export default ClerkApp(App, { appearance: { baseTheme: dark } });
