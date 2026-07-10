"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Place {
  id: string;
  name: string;
  fullName?: string | null;
  placeType?: string | null;
  historicalName?: string | null;
  currentName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

interface Person {
  id: string;
  surname?: string | null;
  givenName?: string | null;
  sex?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  generationNumber?: number | null;
  branchId?: string | null;
  nativePlace?: Place | null;
  residencePlace?: Place | null;
}

interface Branch {
  id: string;
  name: string;
}

interface MigrationMapContentProps {
  persons: Person[];
  places: Place[];
  branches: Branch[];
}

export default function MigrationMapContent({
  persons,
  places,
  branches,
}: MigrationMapContentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix default Leaflet icon paths
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png",
    });

    // Initialize map centering on Central-East China region
    const map = L.map(mapContainerRef.current, {
      center: [31.0, 119.0],
      zoom: 6,
      minZoom: 3,
      maxZoom: 15,
    });

    // CartoDB Voyager tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Filter persons
    const filteredPersons = persons.filter((p) => {
      // Branch filter
      if (selectedBranchId !== "ALL" && p.branchId !== selectedBranchId) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const fullName = `${p.surname || ""}${p.givenName || ""}`;
        if (!fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      return true;
    });

    // 2. Gather place usages to display markers
    const placeUsages: { [placeId: string]: { place: Place; birthCount: number; residenceCount: number; people: string[] } } = {};

    filteredPersons.forEach((p) => {
      const fullName = `${p.surname || ""}${p.givenName || ""}`;
      
      if (p.nativePlace && p.nativePlace.latitude && p.nativePlace.longitude) {
        const place = p.nativePlace;
        if (!placeUsages[place.id]) {
          placeUsages[place.id] = { place, birthCount: 0, residenceCount: 0, people: [] };
        }
        placeUsages[place.id].birthCount += 1;
        if (!placeUsages[place.id].people.includes(fullName)) {
          placeUsages[place.id].people.push(fullName);
        }
      }

      if (p.residencePlace && p.residencePlace.latitude && p.residencePlace.longitude) {
        const place = p.residencePlace;
        if (!placeUsages[place.id]) {
          placeUsages[place.id] = { place, birthCount: 0, residenceCount: 0, people: [] };
        }
        placeUsages[place.id].residenceCount += 1;
        if (!placeUsages[place.id].people.includes(fullName)) {
          placeUsages[place.id].people.push(fullName);
        }
      }
    });

    // 3. Draw place markers
    const bounds: L.LatLngExpression[] = [];

    Object.values(placeUsages).forEach(({ place, birthCount, residenceCount, people }) => {
      if (place.latitude && place.longitude) {
        const latLng: L.LatLngExpression = [place.latitude, place.longitude];
        bounds.push(latLng);

        // Antique red-brown styling for historical places
        const total = birthCount + residenceCount;
        const radius = Math.min(18, Math.max(6, total * 3));

        const circleMarker = L.circleMarker(latLng, {
          radius: radius,
          fillColor: "#854d0e", // Amber-800
          color: "#78350f", // Amber-900
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.5,
        });

        const popupContent = `
          <div class="font-sans text-xs space-y-1.5 text-slate-800 max-w-[200px]">
            <h4 class="font-bold text-amber-900 border-b pb-1 text-sm">📍 ${place.name}</h4>
            ${place.fullName ? `<p class="text-[10px] text-slate-500">${place.fullName}</p>` : ""}
            ${place.historicalName ? `<p class="text-[10px] text-amber-800">古称: ${place.historicalName}</p>` : ""}
            <div class="text-[10px] bg-amber-50/50 p-1.5 rounded border border-amber-900/10 mt-1">
              <p><strong>出生籍贯:</strong> ${birthCount} 人</p>
              <p><strong>迁入常住:</strong> ${residenceCount} 人</p>
            </div>
            <div class="mt-1">
              <p class="font-semibold text-[10px] text-slate-600">涉及成员:</p>
              <p class="text-[10px] text-slate-500 truncate" title="${people.join(", ")}">${people.slice(0, 5).join(", ")}${people.length > 5 ? " 等" : ""}</p>
            </div>
          </div>
        `;

        circleMarker.bindPopup(popupContent).addTo(layerGroup);
      }
    });

    // 4. Draw individual migration vectors (lines)
    filteredPersons.forEach((p) => {
      const hasNative = p.nativePlace && p.nativePlace.latitude && p.nativePlace.longitude;
      const hasResidence = p.residencePlace && p.residencePlace.latitude && p.residencePlace.longitude;

      if (hasNative && hasResidence) {
        const start: L.LatLngExpression = [p.nativePlace!.latitude!, p.nativePlace!.longitude!];
        const end: L.LatLngExpression = [p.residencePlace!.latitude!, p.residencePlace!.longitude!];

        // Draw dotted migration line with a custom offset to avoid overlapping vectors
        const line = L.polyline([start, end], {
          color: p.sex === "Female" ? "#ec4899" : "#3b82f6", // Pink or blue vector
          weight: 2,
          opacity: 0.6,
          dashArray: "5, 8",
        });

        const name = `${p.surname || ""}${p.givenName || ""}`;
        const genText = p.generationNumber ? `第${p.generationNumber}世` : "";

        line.bindTooltip(`${name} (${genText}): 从 ${p.nativePlace!.name} 迁往 ${p.residencePlace!.name}`, {
          sticky: true,
          className: "font-sans text-xs bg-slate-900 text-white rounded border-none shadow-md",
        });

        line.addTo(layerGroup);
      }
    });

    // Adjust map zoom to fit all markers if bounds exist
    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 10 });
    }
  }, [persons, places, selectedBranchId, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search / Filters Panel */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-xs font-sans">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">筛选世支房支</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="ALL">🌍 全族地缘迁徙 (All Branches)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  🌿 {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">检索族人</label>
            <input
              type="text"
              placeholder="输入名字，如：浩然"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 placeholder-slate-400 w-44"
            />
          </div>
        </div>

        <div className="text-right text-xs text-slate-500">
          已加载 <span className="font-mono font-bold text-slate-800">{persons.length}</span> 位族人 · 
          共包含 <span className="font-mono font-bold text-slate-800">{places.length}</span> 处地理方位
        </div>
      </div>

      {/* Map Container Viewport */}
      <div className="relative border border-amber-900/10 rounded-2xl overflow-hidden bg-[#faf8f5] shadow-inner h-[500px]">
        {/* Style tag to inject sepia parchment filters into Leaflet tiles */}
        <style dangerouslySetInnerHTML={{ __html: `
          .vintage-sepia-tiles .leaflet-tile-container {
            filter: sepia(0.85) contrast(1.15) brightness(0.92) hue-rotate(-12deg);
          }
          .vintage-sepia-tiles .leaflet-bar a {
            background-color: #faf8f5 !important;
            color: #78350f !important;
            border-bottom: 1px solid rgba(120,53,15,0.15) !important;
          }
          .vintage-sepia-tiles .leaflet-bar a:hover {
            background-color: #f3eedf !important;
          }
        `}} />

        <div
          ref={mapContainerRef}
          className="w-full h-full vintage-sepia-tiles z-10"
        />
        
        {/* Decorative Inner Dashed Border */}
        <div className="absolute inset-2 border border-dashed border-amber-900/10 pointer-events-none rounded-xl z-20"></div>
      </div>
    </div>
  );
}
