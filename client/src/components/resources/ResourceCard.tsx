import { Download, Lock } from "lucide-react";
import { Resource } from "@shared/schema";

interface ResourceCardProps {
  resource: Resource;
}

const ResourceCard = ({ resource }: ResourceCardProps) => {
  const { title, description, type, accessLevel, downloadUrl, imageUrl } = resource;
  
  return (
    <div className="bg-neutral-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-neutral-200 text-neutral-700 px-3 py-1 rounded-full text-xs font-semibold capitalize">
            {type}
          </span>
          <span className={`${
            accessLevel === "free" 
              ? "bg-green-100 text-success" 
              : "bg-blue-100 text-primary"
          } px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
            {accessLevel}
          </span>
        </div>
        <h3 className="font-heading font-bold text-xl mb-2 text-neutral-800">{title}</h3>
        <p className="text-neutral-600 mb-4">{description}</p>
        <a 
          href={accessLevel === "free" ? downloadUrl : "#"} 
          className="text-primary font-semibold hover:text-primary-dark flex items-center"
        >
          {accessLevel === "free" ? (
            <>
              Download Now
              <Download className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Access Guide
              <Lock className="ml-1 h-4 w-4" />
            </>
          )}
        </a>
      </div>
    </div>
  );
};

export default ResourceCard;
