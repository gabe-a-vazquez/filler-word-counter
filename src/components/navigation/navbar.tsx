import Link from "next/link";
import { Button } from "@filler-word-counter/components/shadcn/button";

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/home" className="text-xl font-bold text-gray-800">
            Uhm Counter
          </Link>
        </div>

        <div className="flex gap-4">
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
