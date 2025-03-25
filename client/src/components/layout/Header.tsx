import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { Menu, ChevronDown } from "lucide-react";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, logout } = useContext(AuthContext);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Organize navigation into groups
  const navGroups = [
    { 
      label: "Dashboard", 
      href: "/dashboard" 
    },
    {
      label: "Client Management",
      items: [
        { href: "/clients", label: "Clients" },
        { href: "/proposals", label: "Proposals" },
        { href: "/external-proposals", label: "External Requests" },
      ]
    },
    {
      label: "Time & Planning",
      items: [
        { href: "/time-tracking", label: "Time Tracking" },
        { href: "/season-planner", label: "Season Planner" },
      ]
    },
    {
      label: "Resources",
      items: [
        { href: "/resources", label: "Resources" },
        { href: "/classification", label: "Classifications" },
        { href: "/analytics", label: "Analytics" },
      ]
    },
  ];

  // Flatten nav items for mobile view
  const flatNavLinks = navGroups.flatMap(group => 
    group.items ? group.items : [{ href: group.href, label: group.label }]
  );

  const renderMainNav = () => (
    <div className="hidden md:flex items-center space-x-6">
      {navGroups.map((group, index) => {
        // If it's a simple link
        if (!group.items) {
          return (
            <Link key={index} href={group.href}>
              <Button 
                variant="link" 
                className={location === group.href ? "text-primary font-semibold" : "text-neutral-700"}
              >
                {group.label}
              </Button>
            </Link>
          );
        }
        
        // If it's a dropdown group
        return (
          <DropdownMenu key={index}>
            <DropdownMenuTrigger asChild>
              <Button variant="link" className="text-neutral-700 flex items-center gap-1">
                {group.label} <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {group.items.map((item, itemIndex) => (
                <Link key={itemIndex} href={item.href}>
                  <DropdownMenuItem className="cursor-pointer">
                    <span className={location === item.href ? "text-primary font-semibold" : ""}>
                      {item.label}
                    </span>
                  </DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="link" className="text-primary font-heading font-bold text-2xl p-0">
                CPA Resource Hub
              </Button>
            </Link>
          </div>
          
          {renderMainNav()}
          
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
                  <Button variant="ghost" className="text-primary hover:text-primary-dark">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary text-white hover:bg-primary-dark">
                    Sign Up
                  </Button>
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
              {flatNavLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                  <Button
                    variant="link"
                    className={`justify-start ${
                      location === link.href 
                        ? "text-primary font-semibold" 
                        : "text-neutral-700"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Button>
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
