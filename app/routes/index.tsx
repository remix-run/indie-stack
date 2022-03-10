import { Link } from "remix";
import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();
  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <div className="relative sm:pb-16">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="https://upload.wikimedia.org/wikipedia/commons/6/68/Sonic_Youth_live_20050707.jpg"
                alt="Sonic Youth On Stage"
              />
              <div className="absolute inset-0 bg-[color:rgba(254,204,27,0.5)] mix-blend-multiply" />
            </div>
            <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <h1 className="text-center text-6xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
                <span className="block text-yellow-500 drop-shadow-md">
                  INDIE STACK
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-lg text-center text-xl text-white sm:max-w-3xl">
                Check the README.md file for instructions on how to get this
                project deployed.
              </p>
              <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                {user ? (
                  <Link
                    to="/notes"
                    className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-yellow-700 shadow-sm hover:bg-yellow-50 sm:px-8"
                  >
                    View Notes for {user.email}
                  </Link>
                ) : (
                  <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
                    <Link
                      to="/join"
                      className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-yellow-700 shadow-sm hover:bg-yellow-50 sm:px-8"
                    >
                      Sign up
                    </Link>
                    <Link
                      to="/login"
                      className="flex items-center justify-center rounded-md  bg-yellow-500 px-4 py-3 font-medium text-white hover:bg-yellow-600  "
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl py-2 px-4 sm:px-6 lg:px-8">
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            {[
              {
                src: "https://fly.io/public/images/brand/logo.svg",
                alt: "Fly.io",
              },
              {
                src: "https://upload.wikimedia.org/wikipedia/commons/3/38/SQLite370.svg",
                alt: "SQLite",
              },
              {
                src: "https://raw.githubusercontent.com/prisma/presskit/main/Logos/Logo-Default-Prisma.svg",
                alt: "Prisma",
              },
              {
                src: "https://tailwindcss.com/_next/static/media/tailwindcss-logotype.ed60a6f85c663923c4d6ee9d85f359cd.svg",
                alt: "Tailwind",
              },
              {
                src: "https://raw.githubusercontent.com/cypress-io/cypress-icons/master/src/logo/cypress-io-logo.svg",
                alt: "Cypress",
              },
            ].map((img) => (
              <div key={img.src} className="flex justify-center">
                <img className="w-32 grayscale" alt={img.alt} src={img.src} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// <div className="bg-[url('https://upload.wikimedia.org/wikipedia/commons/6/68/Sonic_Youth_live_20050707.jpg')] flex flex-col items-center justify-center min-h-screen bg-center bg-cover bg-no-repeat">
// <div className="flex-1">
//   <p>
//     <strong>Welcome to the Remix Indie Stack!</strong>
//     <br />
//     Please check the README.md file for instructions on how to get this
//     project deployed.
//   </p>
//   <p className="pt-4">Learn more about Remix:</p>
//   <ul className="pt-2 list-disc list-inside">
//     <li>
//       <a
//         className="underline text-blue-500"
//         href="https://remix.run/docs"
//       >
//         Remix Docs
//       </a>
//     </li>
//     <li>
//       <a
//         className="underline text-blue-500"
//         href="https://remix.run/stacks"
//       >
//         Remix Stacks
//       </a>
//     </li>
//     <li>
//       <a
//         className="underline text-blue-500"
//         href="https://rmx.as/discord"
//       >
//         Remix Discord Community
//       </a>
//     </li>
//     <li>
//       <a
//         className="underline text-blue-500"
//         href="https://github.com/remix-run/remix"
//       >
//         Remix GitHub
//       </a>
//     </li>
//   </ul>
// </div>
