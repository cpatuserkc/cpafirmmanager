import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import ResourcesSection from "@/components/home/ResourcesSection";
import IntegrationsSection from "@/components/home/IntegrationsSection";
import PricingSection from "@/components/home/PricingSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";

const Home = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <div className="py-16 bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Powerful Dashboard for Your Practice</h2>
            <p className="text-neutral-600 max-w-3xl mx-auto">Track key metrics, manage client work, and optimize your time with our comprehensive dashboard.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
              alt="CPA Dashboard Preview" 
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
      <ResourcesSection />
      <IntegrationsSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Home;
