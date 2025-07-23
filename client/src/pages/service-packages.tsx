import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Package, RefreshCw, Globe, Users, Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { ServicePackage, ClientServiceInquiry, ServiceNetworkSync } from '@shared/schema';

interface ServicePackageWithServices extends ServicePackage {
  services?: any[];
}

interface SyncStatus {
  success: boolean;
  syncStatus: ServiceNetworkSync[];
  platforms: Array<{
    name: string;
    type: string;
    syncEnabled: boolean;
  }>;
}

export default function ServicePackagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFirmId, setSelectedFirmId] = useState<number>(1); // Default to first firm

  // Fetch service packages for sync
  const { data: packages = [], isLoading: packagesLoading } = useQuery<ServicePackageWithServices[]>({
    queryKey: ['/api/service-sync/packages', selectedFirmId],
    queryFn: async () => {
      const res = await fetch(`/api/service-sync/packages/${selectedFirmId}`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      return data.packages || [];
    },
    enabled: !!selectedFirmId,
  });

  // Fetch sync status
  const { data: syncStatus, isLoading: syncLoading } = useQuery<SyncStatus>({
    queryKey: ['/api/service-sync/status', selectedFirmId],
    queryFn: async () => {
      const res = await fetch(`/api/service-sync/status/${selectedFirmId}`);
      if (!res.ok) throw new Error('Failed to fetch sync status');
      return res.json();
    },
    enabled: !!selectedFirmId,
  });

  // Fetch client inquiries
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<ClientServiceInquiry[]>({
    queryKey: ['/api/service-sync/inquiries', selectedFirmId],
    queryFn: async () => {
      const res = await fetch(`/api/service-sync/inquiries/${selectedFirmId}`);
      if (!res.ok) throw new Error('Failed to fetch inquiries');
      const data = await res.json();
      return data.inquiries || [];
    },
    enabled: !!selectedFirmId,
  });

  // Sync to all platforms mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/service-sync/sync/${selectedFirmId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Successful",
        description: "Service packages have been synced to all external platforms",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-sync/status', selectedFirmId] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync service packages",
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'destructive';
      case 'normal':
        return 'default';
      case 'flexible':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateTime: Date | string | null) => {
    if (!dateTime) return 'Never';
    return new Date(dateTime).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Packages & Network Sync</h1>
          <p className="text-muted-foreground">
            Manage your service offerings and sync them to client-facing platforms
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          disabled={syncMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Sync All Platforms'}
        </Button>
      </div>

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packages">Service Packages</TabsTrigger>
          <TabsTrigger value="sync-status">Sync Status</TabsTrigger>
          <TabsTrigger value="inquiries">Client Inquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packagesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : packages.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Service Packages Found</h3>
                  <p className="text-muted-foreground text-center">
                    Create service packages to display them on client-facing sites
                  </p>
                </CardContent>
              </Card>
            ) : (
              packages.map((pkg) => (
                <Card key={pkg.id} className="relative">
                  {pkg.isPopular && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {pkg.marketingTitle || pkg.name}
                    </CardTitle>
                    <CardDescription>
                      {pkg.category} • {pkg.priceRange}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {pkg.marketingDescription || pkg.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {pkg.estimatedTimeframe}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        From ${pkg.basePrice}
                      </div>
                    </div>

                    {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Key Features:</h4>
                        <ul className="text-xs space-y-1">
                          {pkg.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{String(feature)}</span>
                            </li>
                          ))}
                          {pkg.features.length > 3 && (
                            <li className="text-muted-foreground">
                              +{pkg.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={pkg.isClientFacing ? 'default' : 'secondary'}>
                        {pkg.isClientFacing ? 'Client Facing' : 'Internal Only'}
                      </Badge>
                      <Badge variant="outline">
                        Order: {pkg.displayOrder}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sync-status" className="space-y-4">
          {syncLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {syncStatus?.platforms.map((platform) => (
                  <Card key={platform.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4" />
                        {platform.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Type:</span>
                          <Badge variant="outline">{platform.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Sync Enabled:</span>
                          <Badge variant={platform.syncEnabled ? 'default' : 'secondary'}>
                            {platform.syncEnabled ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Sync Activity</CardTitle>
                  <CardDescription>
                    Monitor synchronization status across all platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {syncStatus?.syncStatus.length === 0 ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Sync History</h3>
                      <p className="text-muted-foreground">
                        Start your first sync to see activity here
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Platform</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Sync</TableHead>
                          <TableHead>Packages</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncStatus?.syncStatus.map((sync) => (
                          <TableRow key={sync.id}>
                            <TableCell className="font-medium">
                              {sync.targetSite}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(sync.syncStatus || 'pending')}
                                <span className="capitalize">{sync.syncStatus || 'pending'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatTime(sync.lastSyncAt)}</TableCell>
                            <TableCell>
                              {sync.syncedPackages ? (sync.syncedPackages as number[]).length : 0}
                            </TableCell>
                            <TableCell>
                              {sync.syncError ? (
                                <Alert className="max-w-xs">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    {sync.syncError}
                                  </AlertDescription>
                                </Alert>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Sync successful
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Client Service Inquiries
              </CardTitle>
              <CardDescription>
                Leads and inquiries from your client-facing sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inquiriesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Inquiries Yet</h3>
                  <p className="text-muted-foreground">
                    Client inquiries from your external sites will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Service Interest</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <TableRow key={inquiry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{inquiry.clientName}</div>
                            <div className="text-sm text-muted-foreground">
                              {inquiry.clientEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{inquiry.companyName || 'Individual'}</div>
                            <div className="text-sm text-muted-foreground">
                              {inquiry.industry}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {inquiry.packageId ? `Package ID: ${inquiry.packageId}` : 'Custom Services'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getUrgencyColor(inquiry.urgency || 'normal') as any}>
                            {inquiry.urgency || 'normal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inquiry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(inquiry.createdAt ? inquiry.createdAt.toString() : null)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}