import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  loadLabels,
  loadCpaData,
  loadAppConfig,
  loadErrorMessages,
  loadMenuStructure,
  loadFormTemplates,
  preloadAllData,
  type NavigationItem,
  type FormTemplate,
  type ProfessionalRole,
  type ServiceCategory
} from '@/lib/data-loader';

interface AppDataContextType {
  labels: Record<string, any> | null;
  cpaData: {
    professionalRoles: Record<string, ProfessionalRole>;
    serviceCategories: Record<string, ServiceCategory>;
    timeEstimateCategories: Record<string, string>;
    proposalTypes: Record<string, { name: string; description: string }>;
    clientTypes: Record<string, string>;
    industries: Record<string, string>;
    seasonalPeriods: Record<string, any>;
  } | null;
  config: Record<string, any> | null;
  errorMessages: Record<string, Record<string, string>> | null;
  menuStructure: {
    mainNavigation: NavigationItem[];
    userMenu: NavigationItem[];
    adminMenu: NavigationItem[];
    footerLinks: NavigationItem[];
    quickActions: NavigationItem[];
  } | null;
  formTemplates: Record<string, FormTemplate> | null;
  isLoading: boolean;
  error: string | null;
  getLabel: (category: string, key: string, fallback?: string) => string;
  getErrorMessage: (category: string, key: string, params?: Record<string, any>) => string;
  getConfigValue: (path: string, fallback?: any) => any;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

interface AppDataProviderProps {
  children: ReactNode;
}

export function AppDataProvider({ children }: AppDataProviderProps) {
  const [labels, setLabels] = useState<Record<string, any> | null>(null);
  const [cpaData, setCpaData] = useState<AppDataContextType['cpaData']>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [errorMessages, setErrorMessages] = useState<Record<string, Record<string, string>> | null>(null);
  const [menuStructure, setMenuStructure] = useState<AppDataContextType['menuStructure']>(null);
  const [formTemplates, setFormTemplates] = useState<Record<string, FormTemplate> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        labelsData,
        cpaDataObj,
        configData,
        errorMessagesData,
        menuStructureData,
        formTemplatesData
      ] = await Promise.all([
        loadLabels(),
        loadCpaData(),
        loadAppConfig(),
        loadErrorMessages(),
        loadMenuStructure(),
        loadFormTemplates()
      ]);

      setLabels(labelsData);
      setCpaData(cpaDataObj);
      setConfig(configData);
      setErrorMessages(errorMessagesData);
      setMenuStructure(menuStructureData);
      setFormTemplates(formTemplatesData);
    } catch (err) {
      console.error('Failed to load application data:', err);
      setError('Failed to load application data');
    } finally {
      setIsLoading(false);
    }
  };

  const getLabel = (category: string, key: string, fallback?: string): string => {
    return labels?.[category]?.[key] || fallback || key;
  };

  const getErrorMessage = (category: string, key: string, params?: Record<string, any>): string => {
    let message = errorMessages?.[category]?.[key] || `Error: ${category}.${key}`;
    
    // Replace parameters in message
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
      });
    }
    
    return message;
  };

  const getConfigValue = (path: string, fallback?: any): any => {
    if (!config) return fallback;
    
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value !== undefined ? value : fallback;
  };

  const contextValue: AppDataContextType = {
    labels,
    cpaData,
    config,
    errorMessages,
    menuStructure,
    formTemplates,
    isLoading,
    error,
    getLabel,
    getErrorMessage,
    getConfigValue
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextType {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}

// Convenience hooks for specific data types
export function useLabels() {
  const { labels, getLabel, isLoading } = useAppData();
  return { labels, getLabel, isLoading };
}

export function useCpaData() {
  const { cpaData, isLoading } = useAppData();
  return { 
    professionalRoles: cpaData?.professionalRoles || {},
    serviceCategories: cpaData?.serviceCategories || {},
    timeEstimateCategories: cpaData?.timeEstimateCategories || {},
    proposalTypes: cpaData?.proposalTypes || {},
    clientTypes: cpaData?.clientTypes || {},
    industries: cpaData?.industries || {},
    seasonalPeriods: cpaData?.seasonalPeriods || {},
    isLoading 
  };
}

export function useAppConfig() {
  const { config, getConfigValue, isLoading } = useAppData();
  return { config, getConfigValue, isLoading };
}

export function useErrorMessages() {
  const { errorMessages, getErrorMessage, isLoading } = useAppData();
  return { errorMessages, getErrorMessage, isLoading };
}

export function useMenuStructure() {
  const { menuStructure, isLoading } = useAppData();
  return { 
    mainNavigation: menuStructure?.mainNavigation || [],
    userMenu: menuStructure?.userMenu || [],
    adminMenu: menuStructure?.adminMenu || [],
    footerLinks: menuStructure?.footerLinks || [],
    quickActions: menuStructure?.quickActions || [],
    isLoading 
  };
}

export function useFormTemplates() {
  const { formTemplates, isLoading } = useAppData();
  return { formTemplates: formTemplates || {}, isLoading };
}