import { Link } from "wouter";

const CTASection = () => {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading font-bold text-3xl mb-4">Ready to Transform Your CPA Practice?</h2>
          <p className="text-neutral-200 mb-8 text-lg">
            Join thousands of accounting professionals who are optimizing their time, improving accuracy, and growing their practice with our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/signup">
              <a className="bg-white text-primary font-semibold px-8 py-3 rounded-md text-center hover:bg-neutral-100 transition">
                Start Your Free Trial
              </a>
            </Link>
            <a href="#" className="bg-transparent border border-white text-white font-semibold px-8 py-3 rounded-md text-center hover:bg-white hover:text-primary transition">
              Schedule a Demo
            </a>
          </div>
          <p className="text-neutral-300 mt-6">No credit card required. 14-day free trial.</p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
