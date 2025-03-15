export type HomeStats = {
    totalDestinations: number;
    totalCountries: number;
    totalHighlights: number;
    totalUsers: number;
    totalVisits: number;
    totalViews: number;
  };
  
  export type FeaturedDestination = {
    id: number;
    name: string;
    description: string;
    image_url: string;
    country: {
      name: string;
    };
    highlight_count: number;
    visit_count: number;
  };