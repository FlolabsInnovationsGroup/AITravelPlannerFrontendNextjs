'use client';

import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MARKER_COLORS } from './ProfessionalMapMarkers';

export interface ClusterConfig {
  gridSize: number;
  maxZoom: number;
  minimumClusterSize: number;
  styles: ClusterStyle[];
  enableRetinaIcons: boolean;
  ignoreHidden: boolean;
  algorithm?: any;
}

export interface ClusterStyle {
  url: string;
  width: number;
  height: number;
  textColor: string;
  textSize: number;
  fontFamily?: string;
  fontWeight?: string;
}

// Create professional cluster icons as SVG data URLs
const createClusterIcon = (
  color: string, 
  size: number, 
  count: number
): string => {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer ring with shadow effect -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" 
        fill="${color}" 
        stroke="white" 
        stroke-width="3" 
        drop-shadow="0 2px 4px rgba(0,0,0,0.2)"
        style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2))"/>
      
      <!-- Inner glow effect -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 6}" 
        fill="white" 
        opacity="0.2"/>
      
      <!-- Text background for readability -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" 
        fill="${color}" 
        opacity="0.9"/>
        
      <!-- Count text -->
      <text x="${size/2}" y="${size/2 + 2}" 
        text-anchor="middle" 
        dominant-baseline="central"
        fill="white" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-weight="600" 
        font-size="${Math.max(10, size * 0.3)}"
        style="user-select: none;">
        ${count > 999 ? '999+' : count}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml,${  encodeURIComponent(svg)}`;
};

// Professional cluster styles for different sizes and densities
export const ENHANCED_CLUSTER_STYLES: ClusterStyle[] = [
  // Small clusters (2-9 locations)
  {
    url: createClusterIcon(MARKER_COLORS.primary, 40, 5),
    width: 40,
    height: 40,
    textColor: 'white',
    textSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600'
  },
  // Medium clusters (10-99 locations)
  {
    url: createClusterIcon(MARKER_COLORS.warning, 50, 25),
    width: 50,
    height: 50,
    textColor: 'white',
    textSize: 14,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600'
  },
  // Large clusters (100+ locations)
  {
    url: createClusterIcon(MARKER_COLORS.danger, 60, 100),
    width: 60,
    height: 60,
    textColor: 'white',
    textSize: 16,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600'
  },
  // Extra large clusters (1000+ locations)
  {
    url: createClusterIcon(MARKER_COLORS.secondary, 70, 1000),
    width: 70,
    height: 70,
    textColor: 'white',
    textSize: 18,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600'
  }
];

// Enhanced cluster configuration for better performance and UX
export const ENHANCED_CLUSTER_CONFIG: ClusterConfig = {
  gridSize: 60, // Increased for better clustering
  maxZoom: 15,  // Cluster until zoom level 15
  minimumClusterSize: 2, // Minimum 2 markers to form a cluster
  styles: ENHANCED_CLUSTER_STYLES,
  enableRetinaIcons: true,
  ignoreHidden: true, // Don't cluster hidden markers
};

// Smart clustering algorithm that considers location types
export class SmartLocationClusterer {
  private clusterer: MarkerClusterer | null = null;

  private map: google.maps.Map | null = null;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.initializeClusterer();
  }

  private initializeClusterer() {
    if (!this.map) return;

    // Use enhanced clustering with custom renderer
    this.clusterer = new MarkerClusterer({
      map: this.map,
      markers: [],
      renderer: {
        render: ({ count, position }, stats, map) => {
          // Create dynamic cluster marker based on count and zoom level
          const zoom = map.getZoom() || 10;
          let style: ClusterStyle;
          let color: string;

          // Dynamic sizing based on count and zoom level
          if (count < 10) {
            [style] = ENHANCED_CLUSTER_STYLES;
            ({ primary: color } = MARKER_COLORS);
          } else if (count < 100) {
            [, style] = ENHANCED_CLUSTER_STYLES;
            ({ warning: color } = MARKER_COLORS);
          } else if (count < 1000) {
            [, , style] = ENHANCED_CLUSTER_STYLES;
            ({ danger: color } = MARKER_COLORS);
          } else {
            [, , , style] = ENHANCED_CLUSTER_STYLES;
            ({ secondary: color } = MARKER_COLORS);
          }

          // Adjust size based on zoom level (smaller at higher zoom)
          const zoomFactor = Math.max(0.6, Math.min(1.2, (zoom - 8) / 10));
          const adjustedSize = Math.round(style.width * zoomFactor);

          // Create the cluster marker element
          const clusterElement = document.createElement('div');
          clusterElement.style.cssText = `
            width: ${adjustedSize}px;
            height: ${adjustedSize}px;
            background-image: url('${createClusterIcon(color, adjustedSize, count)}');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            cursor: pointer;
            transform: translate(-50%, -50%);
            transition: transform 0.2s ease;
            user-select: none;
          `;

          // Add hover effects
          clusterElement.addEventListener('mouseenter', () => {
            clusterElement.style.transform = 'translate(-50%, -50%) scale(1.1)';
          });

          clusterElement.addEventListener('mouseleave', () => {
            clusterElement.style.transform = 'translate(-50%, -50%) scale(1.0)';
          });

          // Create advanced marker element for cluster
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position,
            content: clusterElement,
            zIndex: 1000 + count, // Higher z-index for larger clusters
          });

          // Add click handler to zoom into cluster
          clusterElement.addEventListener('click', () => {
            // const bounds = new google.maps.LatLngBounds();
            
            // Get all markers in this cluster and fit bounds
            // Note: This would need access to the actual markers in the cluster
            // For now, we'll just zoom in towards the cluster position
            map.setCenter(position);
            const currentZoom = map.getZoom() || 10;
            map.setZoom(Math.min(currentZoom + 2, 18));
          });

          return marker;
        }
      }
    });
  }

  // Add markers to the clusterer
  addMarkers(markers: google.maps.marker.AdvancedMarkerElement[]) {
    if (this.clusterer) {
      this.clusterer.addMarkers(markers);
    }
  }

  // Remove markers from the clusterer
  removeMarkers(markers: google.maps.marker.AdvancedMarkerElement[]) {
    if (this.clusterer) {
      this.clusterer.removeMarkers(markers);
    }
  }

  // Clear all markers
  clearMarkers() {
    if (this.clusterer) {
      this.clusterer.clearMarkers();
    }
  }

  // Update cluster configuration
  updateConfig(/* config: Partial<ClusterConfig> */) {
    // Reinitialize clusterer with new config if needed
    this.initializeClusterer();
  }

  // Destroy the clusterer
  destroy() {
    if (this.clusterer) {
      this.clusterer.setMap(null);
      this.clusterer = null;
    }
  }

  // Get clusterer instance for advanced operations
  getClusterer(): MarkerClusterer | null {
    return this.clusterer;
  }
}

// Utility function to calculate optimal cluster grid size based on zoom level
export function getOptimalGridSize(zoomLevel: number): number {
  // Smaller grid size at higher zoom levels for finer clustering
  if (zoomLevel >= 16) return 30;
  if (zoomLevel >= 14) return 40;
  if (zoomLevel >= 12) return 60;
  if (zoomLevel >= 10) return 80;
  return 100;
}

export default {
  SmartLocationClusterer,
  ENHANCED_CLUSTER_STYLES,
  ENHANCED_CLUSTER_CONFIG,
  getOptimalGridSize,
  createClusterIcon
};