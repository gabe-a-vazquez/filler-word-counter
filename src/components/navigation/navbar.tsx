import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-800">
            Filler Word Counter
          </Link>
        </div>

        <div className="flex gap-4">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
