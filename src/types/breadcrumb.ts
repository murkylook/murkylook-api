export interface Breadcrumb {
  text: string;
  tooltip: string;
  url: string;
  isActive: boolean;
}

export interface BreadcrumbTrail {
  items: Breadcrumb[];
  currentPage: string;
}

export type PageType = 'home' | 'continents' | 'continent' | 'country' | 'destination'; 