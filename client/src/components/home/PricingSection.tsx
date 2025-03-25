import { Check } from "lucide-react";
import { Link } from "wouter";

const PricingSection = () => {
  const pricingTiers = [
    {
      name: "Free",
      description: "For solo practitioners",
      price: 0,
      features: [
        "Basic classification library",
        "Simple time tracking",
        "5 client limit",
        "Basic proposal templates",
        "Free resources library"
      ],
      buttonText: "Get Started",
      buttonLink: "/signup",
      popular: false
    },
    {
      name: "Professional",
      description: "For growing practices",
      price: 49,
      features: [
        "Full classification library",
        "Advanced time tracking",
        "25 client limit",
        "Custom proposal builder",
        "Premium resources",
        "2 platform integrations",
        "Basic analytics"
      ],
      buttonText: "Start Free Trial",
      buttonLink: "/signup",
      popular: true
    },
    {
      name: "Enterprise",
      description: "For established firms",
      price: 99,
      features: [
        "Everything in Professional",
        "Unlimited clients",
        "Advanced analytics",
        "Unlimited integrations",
        "Team collaboration tools",
        "Dedicated account manager",
        "Priority support"
      ],
      buttonText: "Contact Sales",
      buttonLink: "#",
      popular: false
    }
  ];

  return (
    <section className="py-16 bg-white" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-neutral-600 max-w-3xl mx-auto">Choose the plan that fits your practice needs.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div 
              key={index} 
              className={`${
                tier.popular 
                  ? "bg-white rounded-lg overflow-hidden border-2 border-primary shadow-lg relative" 
                  : "bg-neutral-50 rounded-lg overflow-hidden border border-neutral-200 hover:shadow-md transition"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-sm font-semibold">
                  Popular
                </div>
              )}
              <div className="p-6 border-b border-neutral-200">
                <h3 className="font-heading font-bold text-xl mb-1 text-neutral-800">{tier.name}</h3>
                <p className="text-neutral-600 mb-4">{tier.description}</p>
                <div className="flex items-end mb-4">
                  <span className="text-3xl font-heading font-bold text-neutral-800">${tier.price}</span>
                  <span className="text-neutral-600 ml-1 mb-1">/month</span>
                </div>
                <Link href={tier.buttonLink} className={`block text-center ${
                  tier.popular
                    ? "bg-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-primary-dark transition"
                    : "bg-white text-primary font-semibold px-6 py-2 rounded-md border border-primary hover:bg-primary hover:text-white transition"
                }`}>
                  {tier.buttonText}
                </Link>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="text-[#28a745] h-5 w-5 mr-2 mt-1" />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center bg-neutral-50 p-6 rounded-lg max-w-3xl mx-auto">
          <h3 className="font-heading font-bold text-xl mb-2">Need a custom solution?</h3>
          <p className="text-neutral-600 mb-4">We offer tailored plans for larger accounting firms with specific requirements.</p>
          <a href="#" className="inline-block bg-neutral-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-neutral-700 transition">
            Contact Our Sales Team
          </a>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
