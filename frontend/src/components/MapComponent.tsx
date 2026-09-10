import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Habitation, CandidateSite, AllocationAssignment } from '../types';
import { RoleConfig } from '../context/RoleContext';
import { Layers, Search, Eye, Filter, Shield, AlertCircle } from 'lucide-react';

interface MapComponentProps {
  habitations: Habitation[];
  candidateSites: CandidateSite[];
  hazardGeoJson?: any;
  selectedHabitationId: string | null;
  onSelectHabitation: (id: string) => void;
  activeAssignments?: AllocationAssignment[];
  roleConfig: RoleConfig;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  habitations,
  candidateSites,
  hazardGeoJson,
  selectedHabitationId,
  onSelectHabitation,
  activeAssignments = [],
  roleConfig,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const habitationsLayerRef = useRef<L.LayerGroup | null>(null);
  const sitesLayerRef = useRef<L.LayerGroup | null>(null);
  const hazardsLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer Visibility Toggles
  const [showLandslides, setShowLandslides] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showCloudbursts, setShowCloudbursts] = useState(true);
  const [showSites, setShowSites] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered over Wayanad district (Meppadi - Kalpetta - Mananthavady corridor)
    const map = L.map(mapContainerRef.current, {
      center: roleConfig.mapCenter,
      zoom: roleConfig.mapZoom,
      minZoom: 9,
      maxZoom: 17,
      zoomControl: false,
    });

    const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
    if (!cartoApiKey) {
      throw new Error('CARTO API key missing. Set VITE_CARTO_API_KEY in frontend/.env.local.');
    }

    // CARTO's authenticated rastertiles endpoint requires the `key` query parameter.
    const cartoTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(`${cartoTileUrl}?key=${encodeURIComponent(cartoApiKey)}`, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initialize Layer Groups
    hazardsLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    habitationsLayerRef.current = L.layerGroup().addTo(map);
    sitesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(roleConfig.mapCenter, roleConfig.mapZoom);
  }, [roleConfig]);

  // Update Hazard Polygons
  useEffect(() => {
    if (!mapInstanceRef.current || !hazardsLayerRef.current || !hazardGeoJson) return;

    hazardsLayerRef.current.clearLayers();

    L.geoJSON(hazardGeoJson, {
      filter: (feature) => {
        const type = feature.properties?.hazard_type;
        if (type === 'LANDSLIDE' && !showLandslides) return false;
        if (type === 'FLOOD' && !showFloods) return false;
        if (type === 'CLOUDBURST_RUNOFF' && !showCloudbursts) return false;
        return true;
      },
      style: (feature) => {
        const color = feature?.properties?.color || '#ef4444';
        const opacity = feature?.properties?.fill_opacity || 0.4;
        return {
          color: color,
          weight: 2,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: opacity,
          dashArray: '4, 4',
        };
      },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        layer.bindPopup(`
          <div class="p-1 text-xs">
            <div class="font-bold text-sm text-red-400 mb-1">${p.name || 'Hazard Zone'}</div>
            <div class="text-slate-300"><strong>Type:</strong> ${p.hazard_type}</div>
            <div class="text-slate-300"><strong>Severity:</strong> <span class="text-red-400 font-bold">${p.severity}</span></div>
            <div class="text-slate-400 text-[11px] mt-1 italic">${p.trigger_condition || ''}</div>
          </div>
        `);
      },
    }).addTo(hazardsLayerRef.current);
  }, [hazardGeoJson, showLandslides, showFloods, showCloudbursts]);

  // Update Habitations Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !habitationsLayerRef.current) return;

    habitationsLayerRef.current.clearLayers();

    habitations.forEach((h) => {
      const tier = h.priority?.priority_tier || 'MONITOR';
      if (tierFilter !== 'ALL' && tier !== tierFilter) return;

      const riskBand = h.risk?.risk_band || 'GREEN';
      const isSelected = selectedHabitationId === h.id;
      const isImmediate = tier === 'IMMEDIATE';

      // Colors based on Risk Band / Urgency Tier
      let markerColor = '#22c55e'; // Green
      if (riskBand === 'RED' || isImmediate) markerColor = '#ef4444'; // Red
      else if (riskBand === 'ORANGE') markerColor = '#f97316'; // Orange
      else if (riskBand === 'WATCH') markerColor = '#eab308'; // Yellow

      // Radius scaled slightly by population (4 to 11 px)
      const radius = Math.min(Math.max(Math.sqrt(h.population) / 6.0, 5), 12);

      const circle = L.circleMarker([h.latitude, h.longitude], {
        radius: isSelected ? radius + 4 : radius,
        fillColor: markerColor,
        color: isSelected ? '#ffffff' : (isImmediate ? '#fca5a5' : markerColor),
        weight: isSelected ? 3 : (isImmediate ? 2 : 1),
        opacity: 1,
        fillOpacity: isImmediate ? 0.9 : 0.75,
      });

      // Hover Tooltip
      circle.bindTooltip(
        `<strong>${h.name}</strong><br/>Risk: ${h.risk?.composite_risk || 0}/100 | Tier: ${tier}`,
        { direction: 'top', className: 'bg-slate-900 text-white text-xs border border-slate-700' }
      );

      circle.on('click', () => {
        onSelectHabitation(h.id);
      });

      circle.addTo(habitationsLayerRef.current!);
    });
  }, [habitations, selectedHabitationId, tierFilter, onSelectHabitation]);

  // Update Candidate Relocation Sites Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !sitesLayerRef.current) return;

    sitesLayerRef.current.clearLayers();
    if (!showSites) return;

    candidateSites.forEach((site) => {
      const isExcluded = site.is_inside_hazard_zone || site.is_protected_eco_area;

      // Custom HTML Marker Icon
      const iconHtml = isExcluded
        ? `<div class="w-6 h-6 rounded-md bg-slate-800 border border-red-500/80 flex items-center justify-center text-red-400 text-[10px] font-bold shadow-lg" title="Hard Excluded">✕</div>`
        : `<div class="w-7 h-7 rounded-full bg-emerald-600/90 border-2 border-white flex items-center justify-center text-white shadow-xl shadow-emerald-950 font-bold text-xs hover:scale-110 transition-transform">
            ⚑
           </div>`;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-site-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([site.latitude, site.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="p-1 text-xs max-w-xs">
          <div class="flex items-center space-x-1.5 mb-1">
            <span class="w-2.5 h-2.5 rounded-full ${isExcluded ? 'bg-red-500' : 'bg-emerald-400'}"></span>
            <span class="font-bold text-sm text-white">${site.name}</span>
          </div>
          <div class="text-slate-300"><strong>Panchayat:</strong> ${site.panchayat}</div>
          <div class="text-slate-300"><strong>Safety Score:</strong> ${Math.round(site.safety_score * 100)}/100</div>
          <div class="text-slate-300"><strong>Effective Cap:</strong> <span class="text-emerald-400 font-bold">${site.effective_capacity?.toLocaleString() || 'N/A'}</span></div>
          <div class="text-amber-400 text-[11px] mt-1"><strong>Bottleneck:</strong> ${site.binding_constraint || 'None'}</div>
          ${isExcluded ? '<div class="text-red-400 font-bold mt-1 text-[11px]">HARD EXCLUDED: Inside hazard/eco buffer</div>' : ''}
        </div>
      `);

      marker.addTo(sitesLayerRef.current!);
    });
  }, [candidateSites, showSites]);

  // Update Allocation Routes
  useEffect(() => {
    if (!mapInstanceRef.current || !routesLayerRef.current) return;

    routesLayerRef.current.clearLayers();
    if (!showRoutes || !activeAssignments || activeAssignments.length === 0) return;

    activeAssignments.forEach((assign) => {
      if (assign.route_coordinates && assign.status === 'OPTIMAL_ASSIGNED') {
        const polyline = L.polyline(assign.route_coordinates, {
          color: '#38bdf8',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 8',
        });

        polyline.bindTooltip(
          `<strong>${assign.village_name} → ${assign.site_name}</strong><br/>Distance: ${assign.distance_km?.toFixed(1)} km | Pop: ${assign.population.toLocaleString()}`,
          { sticky: true, className: 'bg-slate-900 text-cyan-300 text-xs' }
        );

        polyline.addTo(routesLayerRef.current!);
      }
    });
  }, [activeAssignments, showRoutes]);

  // Handle Search & Zoom
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const query = searchQuery.toLowerCase().trim();
    const matchedHab = habitations.find(
      (h) => h.name.toLowerCase().includes(query) || h.panchayat.toLowerCase().includes(query)
    );

    if (matchedHab) {
      mapInstanceRef.current.setView([matchedHab.latitude, matchedHab.longitude], 14);
      onSelectHabitation(matchedHab.id);
      return;
    }

    const matchedSite = candidateSites.find((s) => s.name.toLowerCase().includes(query));
    if (matchedSite) {
      mapInstanceRef.current.setView([matchedSite.latitude, matchedSite.longitude], 14);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-105px)] bg-command-950 overflow-hidden flex flex-col">
      <div className="absolute top-3 right-16 z-[1000] px-3 py-2 rounded-lg border border-cyan-700/70 bg-command-950/95 backdrop-blur-md shadow-xl text-right">
        <div className="text-[10px] uppercase tracking-widest text-cyan-400">{roleConfig.label}</div>
        <div className="text-[11px] text-slate-300">{roleConfig.datasetScope}</div>
      </div>
      {/* Map Search & Filter Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 max-w-xl">
        <form onSubmit={handleSearch} className="flex items-center bg-command-900/95 backdrop-blur-md rounded-lg border border-command-700 p-1 shadow-2xl">
          <Search className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          <input
            type="text"
            placeholder="Search village or relocation site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-400 px-2 py-1 focus:outline-none w-48 sm:w-60"
          />
          <button type="submit" className="px-2.5 py-1 text-xs font-semibold bg-command-750 hover:bg-command-700 text-white rounded">
            Locate
          </button>
        </form>

        {/* Priority Tier Filter */}
        <div className="flex items-center bg-command-900/95 backdrop-blur-md rounded-lg border border-command-700 px-2.5 py-1 text-xs text-slate-300 shadow-2xl">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-command-900">All Habitations ({habitations.length})</option>
            <option value="IMMEDIATE" className="bg-command-900">Immediate Only</option>
            <option value="SHORT_TERM" className="bg-command-900">Short-Term Only</option>
            <option value="MEDIUM_TERM" className="bg-command-900">Medium-Term Only</option>
            <option value="MONITOR" className="bg-command-900">Monitor Only</option>
          </select>
        </div>
      </div>

      {/* Layer Visibility Controls */}
      <div className="absolute top-3 right-12 z-[1000] bg-command-900/95 backdrop-blur-md border border-command-700/90 rounded-lg p-2.5 shadow-2xl text-xs space-y-1.5 hidden sm:block">
        <div className="flex items-center space-x-1.5 font-bold text-slate-200 border-b border-command-700 pb-1 mb-1">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>GIS Hazard Overlays</span>
        </div>
        <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
          <input type="checkbox" checked={showLandslides} onChange={(e) => setShowLandslides(e.target.checked)} className="rounded text-red-600 focus:ring-0" />
          <span className="w-2.5 h-2.5 rounded bg-red-600"></span>
          <span>Landslide Scarps & Red Zones</span>
        </label>
        <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
          <input type="checkbox" checked={showFloods} onChange={(e) => setShowFloods(e.target.checked)} className="rounded text-blue-600 focus:ring-0" />
          <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
          <span>HAND Flood Inundation Basins</span>
        </label>
        <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
          <input type="checkbox" checked={showCloudbursts} onChange={(e) => setShowCloudbursts(e.target.checked)} className="rounded text-purple-600 focus:ring-0" />
          <span className="w-2.5 h-2.5 rounded bg-purple-600"></span>
          <span>Cloudburst Debris Funnels</span>
        </label>
        <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
          <input type="checkbox" checked={showSites} onChange={(e) => setShowSites(e.target.checked)} className="rounded text-emerald-600 focus:ring-0" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Candidate Relocation Sites</span>
        </label>
        {activeAssignments.length > 0 && (
          <label className="flex items-center space-x-2 text-slate-300 cursor-pointer hover:text-white">
            <input type="checkbox" checked={showRoutes} onChange={(e) => setShowRoutes(e.target.checked)} className="rounded text-cyan-500 focus:ring-0" />
            <span className="w-2.5 h-0.5 bg-cyan-400"></span>
            <span>Relocation Allocation Routes</span>
          </label>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-command-900/90 backdrop-blur-md border border-command-700 rounded-lg p-2.5 shadow-2xl text-[11px] space-y-1 hidden md:block">
        <div className="font-bold text-slate-300 text-xs mb-1">Habitation Urgency Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white"></span>
          <span className="text-slate-300">Immediate Relocation (Risk ≥ 70)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-300">Short-Term Priority (50-69)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="text-slate-300">Medium-Term Watch (30-49)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300">Monitor / Low Risk (&lt; 30)</span>
        </div>
        <div className="flex items-center space-x-2 pt-1 border-t border-command-700/60">
          <span className="text-emerald-400 font-bold">⚑</span>
          <span className="text-slate-300">Verified Safe Relocation Site</span>
        </div>
      </div>

      {/* Leaflet DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
