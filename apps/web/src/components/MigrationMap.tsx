"use client";

import dynamic from "next/dynamic";
import React from "react";

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

interface MigrationMapProps {
  persons: Person[];
  places: Place[];
  branches: Branch[];
}

const DynamicMigrationMapContent = dynamic(
  () => import("./MigrationMapContent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-[#faf8f5] border border-amber-900/10 rounded-2xl flex flex-col items-center justify-center text-slate-400 font-sans relative">
        <div className="absolute inset-2 border border-dashed border-amber-900/10 pointer-events-none rounded-xl"></div>
        <div className="animate-spin text-3xl mb-3">🧭</div>
        <p className="text-sm font-bold text-amber-900/60">正在绘制宗族历史迁徙地图...</p>
        <p className="text-[10px] mt-1 text-slate-400">Loading geospatial mapping modules...</p>
      </div>
    ),
  }
);

export default function MigrationMap({
  persons,
  places,
  branches,
}: MigrationMapProps) {
  return (
    <DynamicMigrationMapContent
      persons={persons}
      places={places}
      branches={branches}
    />
  );
}
