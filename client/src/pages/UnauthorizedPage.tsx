import { Link } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/solid';

const UnauthorizedPage = () => {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <LockClosedIcon className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Access Denied
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Sorry, you do not have the necessary permissions to access this page.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default UnauthorizedPage;