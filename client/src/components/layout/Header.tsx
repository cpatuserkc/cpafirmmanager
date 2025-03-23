import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useContext(AuthContext);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/resources", label: "Resources" },
    { href: "/time-tracking", label: "Time Tracking" },
    { href: "/classification", label: "Classifications" },
    { href: "/proposals", label: "Proposals" },
    { href: "/external-proposals", label: "External Requests" },
    { href: "/clients", label: "Clients" },
    { href: "/season-planner", label: "Season Planner" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-primary font-heading font-bold text-2xl">CPA Resource Hub</a>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                <a className={`${
                  location === link.href 
                    ? "text-primary font-semibold" 
                    : "text-neutral-700 hover:text-primary"
                } transition`}>
                  {link.label}
                </a>
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                className="text-primary hover:text-primary-dark transition"
                onClick={logout}
              >
                Log Out
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <a className="text-primary hover:text-primary-dark transition">
                    Sign In
                  </a>
                </Link>
                <Link href="/signup">
                  <a className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition">
                    Sign Up
                  </a>
                </Link>
              </>
            )}
          </div>
          <button
            className="md:hidden text-neutral-800"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href}>
                  <a
                    className={`${
                      location === link.href 
                        ? "text-primary font-semibold" 
                        : "text-neutral-700 hover:text-primary"
                    } transition`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
