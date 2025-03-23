import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-heading font-bold text-xl mb-4">CPA Resource Hub</h3>
            <p className="mb-4">Empowering accounting professionals with the tools and resources they need to succeed.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-300 hover:text-white transition">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-neutral-300 hover:text-white transition">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard">
                  <a className="hover:text-white transition">Dashboard</a>
                </Link>
              </li>
              <li>
                <Link href="/time-tracking">
                  <a className="hover:text-white transition">Time Tracking</a>
                </Link>
              </li>
              <li>
                <Link href="/proposals">
                  <a className="hover:text-white transition">Proposals & Estimates</a>
                </Link>
              </li>
              <li>
                <Link href="/classification">
                  <a className="hover:text-white transition">Classification Systems</a>
                </Link>
              </li>
              <li>
                <Link href="#integrations">
                  <a className="hover:text-white transition">Integrations</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/resources?type=template&accessLevel=free">
                  <a className="hover:text-white transition">Free Templates</a>
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Blog</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Knowledge Base</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Webinars</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Case Studies</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Careers</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Contact</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} CPA Resource Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
