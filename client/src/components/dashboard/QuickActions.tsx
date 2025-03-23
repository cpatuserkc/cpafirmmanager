import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Clock, 
  FileText, 
  UserPlus, 
  Download, 
  FolderKanban 
} from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      icon: <Clock className="text-primary mr-3" />,
      label: "Start Time Entry",
      href: "/time-tracking",
    },
    {
      icon: <FileText className="text-primary mr-3" />,
      label: "Create New Proposal",
      href: "/proposals",
    },
    {
      icon: <UserPlus className="text-primary mr-3" />,
      label: "Add New Client",
      href: "/clients",
    },
    {
      icon: <Download className="text-primary mr-3" />,
      label: "Download Report",
      href: "#",
    },
    {
      icon: <FolderKanban className="text-primary mr-3" />,
      label: "Classification Library",
      href: "/classification",
    },
  ];

  return (
    <Card className="bg-neutral-50 border border-neutral-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-neutral-700 font-heading text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <a className="block bg-white border border-neutral-200 p-3 rounded-lg hover:bg-neutral-100 transition flex items-center">
                {action.icon}
                <span className="font-semibold text-neutral-700">{action.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
