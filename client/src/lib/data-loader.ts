/**
 * Data Loader Utility
 * Loads configuration and data from ProjectToolkit JSON files
 */

// Type definitions for our data structures
export interface NavigationItem {
  id: string;
  label: string;
  path?: string;
  action?: string;
  icon: string;
  description?: string;
  badge?: string;
  requiredRole?: string;
  submenu?: NavigationItem[];
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  validation?: string;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  dependsOn?: string;
  searchable?: boolean;
  calculated?: boolean;
  default?: string;
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormTemplate {
  title: string;
  sections: FormSection[];
}

export interface ProfessionalRole {
  name: string;
  description: string;
  topTierRate: string;
  midTierRatePercent: string;
  lowTierRatePercent: string;
}

export interface ServiceCategory {
  name: string;
  description: string;
  services: Record<string, string>;
}

// Cache for loaded data
const dataCache = new Map<string, any>();

/**
 * Generic function to load JSON data from ProjectToolkit
 */
async function loadJsonData<T>(filename: string): Promise<T> {
  if (dataCache.has(filename)) {
    return dataCache.get(filename);
  }

  try {
    const response = await fetch(`/ProjectToolkit/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    
    const data = await response.json();
    dataCache.set(filename, data);
    return data;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    throw error;
  }
}

/**
 * Load application labels and text
 */
export async function loadLabels() {
  return loadJsonData<Record<string, any>>('labels.json');
}

/**
 * Load CPA-specific data (roles, services, etc.)
 */
export async function loadCpaData() {
  return loadJsonData<{
    professionalRoles: Record<string, ProfessionalRole>;
    serviceCategories: Record<string, ServiceCategory>;
    timeEstimateCategories: Record<string, string>;
    proposalTypes: Record<string, { name: string; description: string }>;
    clientTypes: Record<string, string>;
    industries: Record<string, string>;
    seasonalPeriods: Record<string, any>;
  }>('cpa-data.json');
}

/**
 * Load application configuration
 */
export async function loadAppConfig() {
  return loadJsonData<Record<string, any>>('application-config.json');
}

/**
 * Load error messages
 */
export async function loadErrorMessages() {
  return loadJsonData<Record<string, Record<string, string>>>('error-messages.json');
}

/**
 * Load menu structure
 */
export async function loadMenuStructure() {
  return loadJsonData<{
    mainNavigation: NavigationItem[];
    userMenu: NavigationItem[];
    adminMenu: NavigationItem[];
    footerLinks: NavigationItem[];
    quickActions: NavigationItem[];
  }>('menu-structure.json');
}

/**
 * Load form templates
 */
export async function loadFormTemplates() {
  return loadJsonData<Record<string, FormTemplate>>('form-templates.json');
}

/**
 * Helper function to get a specific label
 */
export async function getLabel(category: string, key: string, fallback?: string): Promise<string> {
  try {
    const labels = await loadLabels();
    return labels[category]?.[key] || fallback || key;
  } catch (error) {
    console.warn(`Failed to load label ${category}.${key}:`, error);
    return fallback || key;
  }
}

/**
 * Helper function to get error message
 */
export async function getErrorMessage(category: string, key: string, params?: Record<string, any>): Promise<string> {
  try {
    const errors = await loadErrorMessages();
    let message = errors[category]?.[key] || `Error: ${category}.${key}`;
    
    // Replace parameters in message
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
      });
    }
    
    return message;
  } catch (error) {
    console.warn(`Failed to load error message ${category}.${key}:`, error);
    return `Error: ${category}.${key}`;
  }
}

/**
 * Helper function to get form template
 */
export async function getFormTemplate(templateName: string): Promise<FormTemplate | null> {
  try {
    const templates = await loadFormTemplates();
    return templates[templateName] || null;
  } catch (error) {
    console.warn(`Failed to load form template ${templateName}:`, error);
    return null;
  }
}

/**
 * Helper function to get navigation items
 */
export async function getNavigationItems(type: 'main' | 'user' | 'admin' | 'footer' | 'quickActions'): Promise<NavigationItem[]> {
  try {
    const menu = await loadMenuStructure();
    switch (type) {
      case 'main':
        return menu.mainNavigation;
      case 'user':
        return menu.userMenu;
      case 'admin':
        return menu.adminMenu;
      case 'footer':
        return menu.footerLinks;
      case 'quickActions':
        return menu.quickActions;
      default:
        return [];
    }
  } catch (error) {
    console.warn(`Failed to load navigation items for ${type}:`, error);
    return [];
  }
}

/**
 * Helper function to get professional roles
 */
export async function getProfessionalRoles(): Promise<Record<string, ProfessionalRole>> {
  try {
    const cpaData = await loadCpaData();
    return cpaData.professionalRoles;
  } catch (error) {
    console.warn('Failed to load professional roles:', error);
    return {};
  }
}

/**
 * Helper function to get service categories
 */
export async function getServiceCategories(): Promise<Record<string, ServiceCategory>> {
  try {
    const cpaData = await loadCpaData();
    return cpaData.serviceCategories;
  } catch (error) {
    console.warn('Failed to load service categories:', error);
    return {};
  }
}

/**
 * Helper function to get configuration value
 */
export async function getConfigValue(path: string, fallback?: any): Promise<any> {
  try {
    const config = await loadAppConfig();
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value !== undefined ? value : fallback;
  } catch (error) {
    console.warn(`Failed to load config value ${path}:`, error);
    return fallback;
  }
}

/**
 * Clear cache (useful for development or when data updates)
 */
export function clearDataCache(): void {
  dataCache.clear();
}

/**
 * Preload all data (useful for performance optimization)
 */
export async function preloadAllData(): Promise<void> {
  try {
    await Promise.all([
      loadLabels(),
      loadCpaData(),
      loadAppConfig(),
      loadErrorMessages(),
      loadMenuStructure(),
      loadFormTemplates()
    ]);
    console.log('All data preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some data:', error);
  }
}