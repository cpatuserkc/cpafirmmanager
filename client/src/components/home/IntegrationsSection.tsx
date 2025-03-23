import { Card, CardContent } from "@/components/ui/card";

const IntegrationsSection = () => {
  const integrations = [
    { name: "QuickBooks", acronym: "QB" },
    { name: "Xero", acronym: "XR" },
    { name: "TaxAct", acronym: "TA" },
    { name: "Harvest", acronym: "HV" },
    { name: "FreshBooks", acronym: "FB" }
  ];

  return (
    <section className="py-16 bg-neutral-100" id="integrations">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Seamless Integrations</h2>
          <p className="text-neutral-600 max-w-3xl mx-auto">Connect with your favorite accounting and tax software to streamline your workflow.</p>
        </div>
        
        <Card className="bg-white rounded-xl shadow-lg">
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {integrations.map((integration, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg p-6 border border-neutral-200 hover:border-primary transition"
                >
                  <div className="w-16 h-16 mb-4 flex items-center justify-center">
                    <div className="bg-neutral-100 rounded-full w-16 h-16 flex items-center justify-center text-neutral-800 font-bold">
                      {integration.acronym}
                    </div>
                  </div>
                  <h3 className="font-semibold text-center">{integration.name}</h3>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-neutral-600 mb-4">Don't see your platform? We're constantly adding new integrations.</p>
              <a href="#" className="inline-block text-primary font-semibold hover:text-primary-dark">
                Request an Integration →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default IntegrationsSection;
