import { Link } from "wouter";

const HeroSection = () => {
  return (
    <section className="bg-primary text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
              Elevate Your CPA Practice
            </h1>
            <p className="text-lg md:text-xl mb-6 text-neutral-200">
              Access classification systems, track hours, create accurate proposals, and optimize your time management with our comprehensive platform built for CPAs.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/signup">
                <a className="bg-[#f39c12] text-neutral-800 font-semibold px-6 py-3 rounded-md text-center hover:bg-[#f7b541] transition">
                  Start Free Trial
                </a>
              </Link>
              <Link href="/resources">
                <a className="bg-white text-primary font-semibold px-6 py-3 rounded-md text-center hover:bg-neutral-200 transition">
                  Explore Resources
                </a>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Professional accountant at work" 
              className="rounded-lg shadow-lg" 
              width="600" 
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
