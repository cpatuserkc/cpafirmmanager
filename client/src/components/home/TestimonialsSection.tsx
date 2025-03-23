import { Star, StarHalf } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "This platform has been a game-changer for my practice. The time tracking and proposal tools alone have saved me hours each week.",
      name: "Sarah Johnson, CPA",
      role: "Solo Practitioner",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      stars: 5
    },
    {
      quote: "The classification systems and integration with QuickBooks have streamlined our workflows significantly. Highly recommended for small firms.",
      name: "Michael Chen, CPA",
      role: "Small Firm Partner",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      stars: 5
    },
    {
      quote: "The analytics dashboard gives me insights into my practice I never had before. I can now identify our most profitable services and optimize accordingly.",
      name: "Jennifer Martinez, CPA",
      role: "Mid-size Firm Manager",
      imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      stars: 4.5
    }
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="fill-current text-[#f39c12]" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-current text-[#f39c12]" />);
    }
    
    return stars;
  };

  return (
    <section className="py-16 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-neutral-800 mb-4">What Accounting Professionals Say</h2>
          <p className="text-neutral-600 max-w-3xl mx-auto">Hear from CPAs who've transformed their practice with our platform.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center mb-4">
                <div className="text-[#f39c12] flex">
                  {renderStars(testimonial.stars)}
                </div>
              </div>
              <p className="text-neutral-600 mb-6 italic">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src={testimonial.imageUrl} 
                    alt={testimonial.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-800">{testimonial.name}</h4>
                  <p className="text-neutral-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
