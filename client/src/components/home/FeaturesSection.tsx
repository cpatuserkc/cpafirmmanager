import {
  FolderKanban,
  Clock,
  FileChartLine,
  Link2,
  CloudDownload,
  LineChart
} from "lucide-react";
import { Link } from "wouter";

const FeaturesSection = () => {
  const features = [
    {
      icon: <FolderKanban className="h-8 w-8" />,
      title: "Classification Systems",
      description: "Access standardized classification systems for various accounting scenarios to ensure consistency and accuracy.",
      href: "/classification"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Time Tracking",
      description: "Track hours by client and project with our intuitive time management system designed specifically for accounting work.",
      href: "/time-tracking"
    },
    {
      icon: <FileChartLine className="h-8 w-8" />,
      title: "Proposals & Estimates",
      description: "Create accurate proposals and estimates based on historical data and optimized time budgets.",
      href: "/proposals"
    },
    {
      icon: <Link2 className="h-8 w-8" />,
      title: "Platform Integrations",
      description: "Connect to your existing tax and time tracking platforms to leverage your data and enhance productivity.",
      href: "#integrations"
    },
    {
      icon: <CloudDownload className="h-8 w-8" />,
      title: "Free Resources",
      description: "Access a library of free templates, checklists, and guides to support your accounting practice.",
      href: "/resources"
    },
    {
      icon: <LineChart className="h-8 w-8" />,
      title: "Analytics Dashboard",
      description: "Gain insights into productivity, project profitability, and time allocation with visual analytics.",
      href: "/dashboard"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Essential Tools for Modern CPAs</h2>
          <p className="text-neutral-600 max-w-3xl mx-auto">Our platform provides the key resources accounting professionals need to optimize workflows, improve accuracy, and grow their practice.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-neutral-100 rounded-lg p-6 shadow-sm hover:shadow-md transition">
              <div className="text-primary mb-4">
                {feature.icon}
              </div>
              <h3 className="font-heading font-bold text-xl mb-3 text-neutral-800">{feature.title}</h3>
              <p className="text-neutral-600 mb-4">{feature.description}</p>
              <Link href={feature.href} className="text-primary font-semibold hover:text-primary-dark flex items-center">
                Learn more
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 ml-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
