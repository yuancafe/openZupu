"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";

export default function PersonDetails({ params }: { params: Promise<{ id: string, personId: string }> }) {
  const unwrappedParams = use(params);
  const { t, language } = useLanguage();
  const [person, setPerson] = useState<any>(null);
  const [relations, setRelations] = useState<any[]>([]);
  const [allPersons, setAllPersons] = useState<any[]>([]);
  const [geneticMatches, setGeneticMatches] = useState<any[]>([]);
  const [allPlaces, setAllPlaces] = useState<any[]>([]);

  // Sub-tabs state: 'basic', 'names', 'generation', 'places', 'career', 'custom'
  const [activeSubTab, setActiveSubTab] = useState("basic");

  // UI state toggles
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [isEditingDna, setIsEditingDna] = useState(false);
  const [isEditingPlaces, setIsEditingPlaces] = useState(false);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);

  // Form states - Person Basic & Names & Generation
  const [surname, setSurname] = useState("");
  const [givenName, setGivenName] = useState("");
  const [sex, setSex] = useState("UNKNOWN");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [isLiving, setIsLiving] = useState(true);
  const [biography, setBiography] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [courtesyName, setCourtesyName] = useState("");
  const [artName, setArtName] = useState("");
  const [tabooName, setTabooName] = useState("");
  const [posthumousName, setPosthumousName] = useState("");
  const [childhoodName, setChildhoodName] = useState("");
  const [genealogicalName, setGenealogicalName] = useState("");
  const [originalSurname, setOriginalSurname] = useState("");
  const [adoptedSurname, setAdoptedSurname] = useState("");

  const [generationCharacter, setGenerationCharacter] = useState("");
  const [generationNumber, setGenerationNumber] = useState<number | "">("");
  const [rankInSiblings, setRankInSiblings] = useState("");

  // Place bindings form state
  const [nativePlaceId, setNativePlaceId] = useState("");
  const [ancestralPlaceId, setAncestralPlaceId] = useState("");
  const [residencePlaceId, setResidencePlaceId] = useState("");

  // Create Place form state
  const [placeName, setPlaceName] = useState("");
  const [placeType, setPlaceType] = useState("CITY");
  const [placeHistName, setPlaceHistName] = useState("");
  const [placeCurrName, setPlaceCurrName] = useState("");
  const [placeLat, setPlaceLat] = useState("");
  const [placeLng, setPlaceLng] = useState("");

  // Relation form state
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [relationType, setRelationType] = useState("BIOLOGICAL_CHILD_OF");

  // DNA form state
  const [patrilinealDna, setPatrilinealDna] = useState("");
  const [matrilinealDna, setMatrilinealDna] = useState("");
  const [dnaSampleId, setDnaSampleId] = useState("");
  const [dnaMarkers, setDnaMarkers] = useState("");

  // Career, Status & Social adding forms state
  const [careerTitle, setCareerTitle] = useState("");
  const [careerType, setCareerType] = useState("CIVIL");
  const [careerStart, setCareerStart] = useState("");
  const [careerEnd, setCareerEnd] = useState("");

  const [statusRecordType, setStatusRecordType] = useState("DEGREE");
  const [statusRecordValue, setStatusRecordValue] = useState("");
  const [statusRecordDate, setStatusRecordDate] = useState("");

  const [socialType, setSocialType] = useState("FRIEND");
  const [socialTargetId, setSocialTargetId] = useState("");
  const [socialNotes, setSocialNotes] = useState("");

  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");

  // V1.7 Citations/Claims State
  const [claims, setClaims] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [isAddingClaim, setIsAddingClaim] = useState(false);
  const [newClaimPredicate, setNewClaimPredicate] = useState("birthDate");
  const [newClaimQuote, setNewClaimQuote] = useState("");
  const [newClaimInterpretation, setNewClaimInterpretation] = useState("");
  const [newClaimSourceId, setNewClaimSourceId] = useState("");
  const [newClaimConfidence, setNewClaimConfidence] = useState("HIGH");

  const fetchPersonData = () => {
    apiFetch(`/persons/${unwrappedParams.personId}`)
      .then((res) => res.json())
      .then((data) => {
        setPerson(data);
        // Map baseline states
        setSurname(data.surname || "");
        setGivenName(data.givenName || "");
        setSex(data.sex || "UNKNOWN");
        setBirthDate(data.birthDate || "");
        setDeathDate(data.deathDate || "");
        setIsLiving(data.isLiving);
        setBiography(data.biography || "");
        setNotes(data.notes || "");
        setAvatarUrl(data.avatarUrl || "");

        setCourtesyName(data.courtesyName || "");
        setArtName(data.artName || "");
        setTabooName(data.tabooName || "");
        setPosthumousName(data.posthumousName || "");
        setChildhoodName(data.childhoodName || "");
        setGenealogicalName(data.genealogicalName || "");
        setOriginalSurname(data.originalSurname || "");
        setAdoptedSurname(data.adoptedSurname || "");

        setGenerationCharacter(data.generationCharacter || "");
        setGenerationNumber(data.generationNumber ?? "");
        setRankInSiblings(data.rankInSiblings || "");

        setNativePlaceId(data.nativePlaceId || "");
        setAncestralPlaceId(data.ancestralPlaceId || "");
        setResidencePlaceId(data.residencePlaceId || "");

        setPatrilinealDna(data.patrilinealDna || "");
        setMatrilinealDna(data.matrilinealDna || "");
        setDnaSampleId(data.dnaSampleId || "");
        setDnaMarkers(data.dnaMarkers || "");
      })
      .catch((err) => console.error(err));

    apiFetch(`/kinship-relation?personId=${unwrappedParams.personId}`)
      .then((res) => res.json())
      .then((data) => setRelations(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    apiFetch(`/persons/${unwrappedParams.personId}/genetic-matches`)
      .then((res) => res.json())
      .then((data) => setGeneticMatches(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    apiFetch("/places")
      .then((res) => res.json())
      .then((data) => setAllPlaces(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));

    apiFetch(`/claims?subjectType=PERSON&subjectId=${unwrappedParams.personId}`)
      .then((res) => res.json())
      .then((data) => setClaims(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching claims:", err));

    apiFetch(`/sources?projectId=${unwrappedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setSources(arr);
        if (arr.length > 0) {
          setNewClaimSourceId(arr[0].id);
        }
      })
      .catch((err) => console.error("Error fetching sources:", err));
  };

  useEffect(() => {
    fetchPersonData();

    apiFetch(`/persons?projectId=${unwrappedParams.id}`)
      .then((res) => res.json())
      .then((data) => setAllPersons(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  }, [unwrappedParams.personId, unwrappedParams.id]);

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/persons/${unwrappedParams.personId}`, {
        method: "PATCH",
        body: JSON.stringify({
          surname: surname || null,
          givenName: givenName,
          sex,
          birthDate: birthDate || null,
          deathDate: deathDate || null,
          isLiving,
          biography: biography || null,
          notes: notes || null,
          courtesyName: courtesyName || null,
          artName: artName || null,
          tabooName: tabooName || null,
          posthumousName: posthumousName || null,
          childhoodName: childhoodName || null,
          genealogicalName: genealogicalName || null,
          originalSurname: originalSurname || null,
          adoptedSurname: adoptedSurname || null,
          generationCharacter: generationCharacter || null,
          generationNumber: generationNumber !== "" ? Number(generationNumber) : null,
          rankInSiblings: rankInSiblings || null,
          nativePlaceId: nativePlaceId || null,
          ancestralPlaceId: ancestralPlaceId || null,
          residencePlaceId: residencePlaceId || null,
          avatarUrl: avatarUrl || null,
        }),
      });
      fetchPersonData();
      alert(t("success"));
    } catch (err) {
      console.error(err);
      alert(t("error"));
    }
  };

  const handleAddRelation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    try {
      await apiFetch("/kinship-relation", {
        method: "POST",
        body: JSON.stringify({
          projectId: unwrappedParams.id,
          fromPersonId: unwrappedParams.personId,
          toPersonId: selectedPersonId,
          relationType,
          status: "CONFIRMED",
        }),
      });
      setIsAddingRelation(false);
      setSelectedPersonId("");
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDna = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/persons/${unwrappedParams.personId}`, {
        method: "PATCH",
        body: JSON.stringify({
          patrilinealDna: patrilinealDna || null,
          matrilinealDna: matrilinealDna || null,
          dnaSampleId: dnaSampleId || null,
          dnaMarkers: dnaMarkers || null,
        }),
      });
      setIsEditingDna(false);
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/places", {
        method: "POST",
        body: JSON.stringify({
          name: placeName,
          placeType,
          historicalName: placeHistName || null,
          currentName: placeCurrName || null,
          latitude: placeLat ? parseFloat(placeLat) : null,
          longitude: placeLng ? parseFloat(placeLng) : null,
        }),
      });
      if (res.ok) {
        const place = await res.json();
        setAllPlaces((prev) => [...prev, place]);
        setIsCreatingPlace(false);
        setPlaceName("");
        setPlaceHistName("");
        setPlaceCurrName("");
        setPlaceLat("");
        setPlaceLng("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Careers CRUD
  const handleAddCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/office-occupation", {
        method: "POST",
        body: JSON.stringify({
          projectId: unwrappedParams.id,
          personId: unwrappedParams.personId,
          title: careerTitle,
          type: careerType,
          startDate: careerStart || null,
          endDate: careerEnd || null,
        }),
      });
      setCareerTitle("");
      setCareerStart("");
      setCareerEnd("");
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCareer = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/office-occupation/${id}`, { method: "DELETE" });
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  // Status Records CRUD
  const handleAddStatusRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/status-record", {
        method: "POST",
        body: JSON.stringify({
          projectId: unwrappedParams.id,
          personId: unwrappedParams.personId,
          statusType: statusRecordType,
          statusValue: statusRecordValue,
          date: statusRecordDate || null,
        }),
      });
      setStatusRecordValue("");
      setStatusRecordDate("");
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStatusRecord = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/status-record/${id}`, { method: "DELETE" });
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  // Social Associations CRUD
  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialTargetId) return;
    try {
      await apiFetch("/social-association", {
        method: "POST",
        body: JSON.stringify({
          projectId: unwrappedParams.id,
          fromId: unwrappedParams.personId,
          toId: socialTargetId,
          relationType: socialType,
          notes: socialNotes || null,
        }),
      });
      setSocialTargetId("");
      setSocialNotes("");
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/social-association/${id}`, { method: "DELETE" });
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  // Custom Fields CRUD
  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/custom-field", {
        method: "POST",
        body: JSON.stringify({
          entityType: "PERSON",
          entityId: unwrappedParams.personId,
          fieldName: customFieldName,
          fieldValue: customFieldValue,
          fieldType: "STRING",
        }),
      });
      setCustomFieldName("");
      setCustomFieldValue("");
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomField = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/custom-field/${id}`, { method: "DELETE" });
      fetchPersonData();
    } catch (err) {
      console.error(err);
    }
  };

  // Claims/Citations CRUD
  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimSourceId) {
      alert("Please register or select a source first!");
      return;
    }
    try {
      const res = await apiFetch("/claims", {
        method: "POST",
        body: JSON.stringify({
          projectId: unwrappedParams.id,
          subjectType: "PERSON",
          subjectId: unwrappedParams.personId,
          predicate: newClaimPredicate,
          quote: newClaimQuote || null,
          interpretation: newClaimInterpretation || null,
          sourceId: newClaimSourceId,
          confidence: newClaimConfidence,
        }),
      });
      if (res.ok) {
        setIsAddingClaim(false);
        setNewClaimQuote("");
        setNewClaimInterpretation("");
        fetchPersonData();
      }
    } catch (err) {
      console.error("Error adding claim:", err);
    }
  };

  const handleDeleteClaim = async (id: string) => {
    if (!confirm("Are you sure you want to delete this citation?")) return;
    try {
      const res = await apiFetch(`/claims/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPersonData();
      }
    } catch (err) {
      console.error("Error deleting claim:", err);
    }
  };

  const renderCitationBadges = (predicate: string) => {
    const matchedClaims = claims.filter((c) => c.predicate === predicate);
    if (matchedClaims.length === 0) return null;

    return (
      <sup className="inline-flex gap-0.5 ml-1 select-none">
        {matchedClaims.map((c) => {
          const index = claims.findIndex((x) => x.id === c.id) + 1;
          return (
            <a
              key={c.id}
              href={`#citation-${c.id}`}
              title={c.quote || "Citation"}
              className="text-[9px] font-extrabold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-0.5 rounded cursor-pointer inline-block leading-none transform translate-y-[-2px]"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`citation-${c.id}`)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {index}
            </a>
          );
        })}
      </sup>
    );
  };

  const getPersonName = (id: string) => {
    const p = allPersons.find((x) => x.id === id);
    if (!p) return "Unknown";
    return `${p.surname || ""} ${p.givenName || "Unnamed"}`.trim();
  };

  if (!person) return <div className="p-8 text-center text-slate-500">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href={`/projects/${unwrappedParams.id}`} className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
          &larr; {t("backToProject")}
        </Link>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Basic Identity Summary & DNA / Relations */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Visual Box */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#faf9f6] to-[#f4f2eb] p-6 rounded-2xl border border-amber-900/10 shadow-sm text-center space-y-4">
            {/* Fine border design mimicking old paper/scroll */}
            <div className="absolute inset-2 border border-dashed border-amber-900/15 pointer-events-none rounded-xl"></div>
            
            <div className="relative z-10 w-28 h-28 rounded-full overflow-hidden mx-auto shadow-md border-4 border-white ring-4 ring-amber-500/10 flex items-center justify-center bg-slate-50 group">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt={person.givenName || "Avatar"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-amber-800 font-serif font-bold">
                  {person.surname ? person.surname[0] : (person.givenName ? person.givenName[0] : "👤")}
                </span>
              )}
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <label className="cursor-pointer bg-white hover:bg-slate-50 active:scale-95 text-amber-900 border border-amber-800/15 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                📷 {t("uploadAvatarBtn")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      setAvatarUrl(base64);
                      try {
                        await apiFetch(`/persons/${unwrappedParams.personId}`, {
                          method: "PATCH",
                          body: JSON.stringify({ avatarUrl: base64 }),
                        });
                        fetchPersonData();
                      } catch (err) {
                        console.error(err);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {avatarUrl && (
                <button
                  onClick={async () => {
                    setAvatarUrl("");
                    try {
                      await apiFetch(`/persons/${unwrappedParams.personId}`, {
                        method: "PATCH",
                        body: JSON.stringify({ avatarUrl: null }),
                      });
                      fetchPersonData();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold mt-2"
                >
                  {t("delete")}
                </button>
              )}
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wide">
                {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">ID: {person.id.slice(0, 8)}...</p>
            </div>
            <div className="relative z-10 flex justify-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                person.sex === "MALE" || person.sex === "Male" ? "bg-blue-50 text-blue-700 border-blue-100" : person.sex === "FEMALE" || person.sex === "Female" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-slate-50 text-slate-700 border-slate-100"
              }`}>
                {person.sex === "MALE" || person.sex === "Male" ? t("male") : person.sex === "FEMALE" || person.sex === "Female" ? t("female") : t("unknown")}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                person.isLiving ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-700 border-slate-100"
              }`}>
                {person.isLiving ? t("living") : t("deceased")}
              </span>
            </div>
          </div>

          {/* DNA Section */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                {t("dnaLineageTitle")}
              </h3>
              <button
                onClick={() => setIsEditingDna(!isEditingDna)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {isEditingDna ? t("cancel") : t("edit")}
              </button>
            </div>

            {isEditingDna ? (
              <form onSubmit={handleUpdateDna} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t("dnaSampleId")}</label>
                  <input
                    type="text"
                    value={dnaSampleId}
                    onChange={(e) => setDnaSampleId(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-1.5 text-sm bg-white text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("patrilinealDna")}</label>
                    <input
                      type="text"
                      value={patrilinealDna}
                      onChange={(e) => setPatrilinealDna(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-sm bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("matrilinealDna")}</label>
                    <input
                      type="text"
                      value={matrilinealDna}
                      onChange={(e) => setMatrilinealDna(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-1.5 text-sm bg-white text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">{t("strMarkers")}</label>
                  <input
                    type="text"
                    value={dnaMarkers}
                    onChange={(e) => setDnaMarkers(e.target.value)}
                    placeholder={t("strMarkersPlaceholder")}
                    className="w-full border border-slate-300 rounded-md p-1.5 text-sm bg-white text-slate-800"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md font-semibold text-xs transition-colors shadow">
                  {t("saveDna")}
                </button>
              </form>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{t("dnaSampleId")}:</span> <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{person.dnaSampleId || "None"}</code></div>
                <div className="flex justify-between"><span className="text-slate-500">{t("patrilinealDna")}:</span> <span className="font-semibold text-blue-600">{person.patrilinealDna || "None"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t("matrilinealDna")}:</span> <span className="font-semibold text-pink-600">{person.matrilinealDna || "None"}</span></div>
                <div className="border-t border-slate-100 pt-2 mt-2">
                  <span className="text-slate-500 text-xs font-bold">{t("strMarkers")}:</span>
                  <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200 mt-1 max-h-20 overflow-y-auto font-mono text-slate-700">
                    {person.dnaMarkers || "No markers loaded."}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Genetic Matches list */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              🧬 {t("dnaMatchesTitle")}
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {geneticMatches.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6">
                  {t("noDnaMatches")}
                </div>
              ) : (
                geneticMatches.map((m) => (
                  <div key={m.person.id} className="p-3 border border-slate-100 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-slate-950">
                        {m.person.surname ? `${m.person.surname} ` : ""}{m.person.givenName || "Unnamed"}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        {m.score}% {t("matchScore")}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Y-DNA: {m.person.patrilinealDna || "N/A"} | mtDNA: {m.person.matrilinealDna || "N/A"}
                    </div>
                    <div className="border-t border-slate-200 pt-1 mt-1 text-[10px] text-slate-600">
                      <strong>{t("reasonsLabel")}</strong>
                      <ul className="list-disc pl-3 text-slate-500 mt-0.5 space-y-0.5">
                        {m.reasons.map((r: string, idx: number) => <li key={idx}>{r}</li>)}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabbed high-detail edit forms & Careers/Honors lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            
            {/* Sub-tabs header */}
            <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50 rounded-t-lg">
              {[
                { id: "basic", label: t("basicProfileTitle") },
                { id: "names", label: t("lineageNamesTitle") },
                { id: "generation", label: t("generationRankTitle") },
                { id: "places", label: t("historicalPlacesTitle") },
                { id: "career", label: t("tabCareerSocial") },
                { id: "custom", label: t("tabCustom") }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`py-2.5 px-4 font-semibold text-xs border-r border-slate-200 transition-colors whitespace-nowrap ${
                    activeSubTab === subTab.id ? "bg-white text-blue-600 border-b-2 border-b-blue-600" : "text-slate-600 hover:bg-slate-100/60"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              
              {/* TAB 1: BASIC PROFILE */}
              {activeSubTab === "basic" && (
                <form onSubmit={handleUpdatePerson} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("surname")} (Surname) {renderCitationBadges("surname")}
                      </label>
                      <input
                        type="text"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("givenName")} (Given Name) {renderCitationBadges("givenName")}
                      </label>
                      <input
                        type="text"
                        required
                        value={givenName}
                        onChange={(e) => setGivenName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t("gender")}</label>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      >
                        <option value="UNKNOWN">{t("unknown")}</option>
                        <option value="MALE">{t("male")}</option>
                        <option value="FEMALE">{t("female")}</option>
                        <option value="OTHER">{t("other")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("birthDate")} (Birth Date) {renderCitationBadges("birthDate")}
                      </label>
                      <input
                        type="text"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("deathDate")} (Death Date) {renderCitationBadges("deathDate")}
                      </label>
                      <input
                        type="text"
                        value={deathDate}
                        disabled={isLiving}
                        onChange={(e) => setDeathDate(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800 disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isLivingBox"
                      checked={isLiving}
                      onChange={(e) => {
                        setIsLiving(e.target.checked);
                        if (e.target.checked) setDeathDate("");
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label htmlFor="isLivingBox" className="text-sm font-medium text-slate-700">{t("living")}</label>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("biographyLabel")} {renderCitationBadges("biography")}
                      </label>
                      <textarea
                        rows={4}
                        value={biography}
                        onChange={(e) => setBiography(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("notesLabel")} {renderCitationBadges("notes")}
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-xs shadow">
                    {t("save")}
                  </button>
                </form>
              )}

              {/* TAB 2: PEDIGREE NAMES & TITLES */}
              {activeSubTab === "names" && (
                <form onSubmit={handleUpdatePerson} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("genealogicalName")} (谱名) {renderCitationBadges("genealogicalName")}
                      </label>
                      <input
                        type="text"
                        value={genealogicalName}
                        onChange={(e) => setGenealogicalName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("courtesyName")} (字) {renderCitationBadges("courtesyName")}
                      </label>
                      <input
                        type="text"
                        value={courtesyName}
                        onChange={(e) => setCourtesyName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("artName")} (号) {renderCitationBadges("artName")}
                      </label>
                      <input
                        type="text"
                        value={artName}
                        onChange={(e) => setArtName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("tabooName")} (讳) {renderCitationBadges("tabooName")}
                      </label>
                      <input
                        type="text"
                        value={tabooName}
                        onChange={(e) => setTabooName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("posthumousName")} (谥号) {renderCitationBadges("posthumousName")}
                      </label>
                      <input
                        type="text"
                        value={posthumousName}
                        onChange={(e) => setPosthumousName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("childhoodName")} (小名) {renderCitationBadges("childhoodName")}
                      </label>
                      <input
                        type="text"
                        value={childhoodName}
                        onChange={(e) => setChildhoodName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("originalSurname")} (本姓) {renderCitationBadges("originalSurname")}
                      </label>
                      <input
                        type="text"
                        value={originalSurname}
                        onChange={(e) => setOriginalSurname(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        {t("adoptedSurname")} (嗣姓) {renderCitationBadges("adoptedSurname")}
                      </label>
                      <input
                        type="text"
                        value={adoptedSurname}
                        onChange={(e) => setAdoptedSurname(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-xs shadow">
                    {t("save")}
                  </button>
                </form>
              )}

              {/* TAB 3: GENERATION & RANKING */}
              {activeSubTab === "generation" && (
                <form onSubmit={handleUpdatePerson} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t("generationCharacter")} (派字)</label>
                      <input
                        type="text"
                        value={generationCharacter}
                        onChange={(e) => setGenerationCharacter(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t("generationNumberField")}</label>
                      <input
                        type="number"
                        value={generationNumber}
                        onChange={(e) => setGenerationNumber(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{t("rankInSiblings")}</label>
                      <input
                        type="text"
                        value={rankInSiblings}
                        placeholder={t("rankInSiblingsPlaceholder")}
                        onChange={(e) => setRankInSiblings(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold text-xs shadow">
                    {t("save")}
                  </button>
                </form>
              )}

              {/* TAB 4: MIGRATION & PLACES */}
              {activeSubTab === "places" && (
                <div className="space-y-6">
                  {/* Select Places Form */}
                  <form onSubmit={handleUpdatePerson} className="space-y-4 border-b border-slate-100 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">📍 {t("nativePlace")} (籍贯)</label>
                        <select
                          value={nativePlaceId}
                          onChange={(e) => setNativePlaceId(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                        >
                          <option value="">{t("selectPlacePlaceholder")}</option>
                          {allPlaces.map((pl) => <option key={pl.id} value={pl.id}>{pl.name} {pl.historicalName ? `(${pl.historicalName})` : ""}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">⛺ {t("ancestralPlace")} (祖籍)</label>
                        <select
                          value={ancestralPlaceId}
                          onChange={(e) => setAncestralPlaceId(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                        >
                          <option value="">{t("selectPlacePlaceholder")}</option>
                          {allPlaces.map((pl) => <option key={pl.id} value={pl.id}>{pl.name} {pl.historicalName ? `(${pl.historicalName})` : ""}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">🏠 {t("residencePlace")} (居住地)</label>
                        <select
                          value={residencePlaceId}
                          onChange={(e) => setResidencePlaceId(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 text-sm bg-white text-slate-800"
                        >
                          <option value="">{t("selectPlacePlaceholder")}</option>
                          {allPlaces.map((pl) => <option key={pl.id} value={pl.id}>{pl.name} {pl.historicalName ? `(${pl.historicalName})` : ""}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-semibold text-xs shadow">
                      {t("savePlaces")}
                    </button>
                  </form>

                  {/* Create New Place Inline */}
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">➕ {t("createPlaceTitle")}</h4>
                    </div>
                    <form onSubmit={handleCreatePlace} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t("placeNameLabel")}</label>
                        <input
                          type="text"
                          required
                          value={placeName}
                          onChange={(e) => setPlaceName(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t("placeTypeLabel")}</label>
                        <select
                          value={placeType}
                          onChange={(e) => setPlaceType(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                        >
                          <option value="PROVINCE">Province / 省</option>
                          <option value="CITY">City / 府市</option>
                          <option value="COUNTY">County / 州县</option>
                          <option value="TOWN">Town / 乡镇</option>
                          <option value="VILLAGE">Village / 村庄</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t("historicalNameLabel")}</label>
                        <input
                          type="text"
                          value={placeHistName}
                          onChange={(e) => setPlaceHistName(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t("currentNameLabel")}</label>
                        <input
                          type="text"
                          value={placeCurrName}
                          onChange={(e) => setPlaceCurrName(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t("latLabel")}</label>
                        <input
                          type="text"
                          value={placeLat}
                          placeholder="e.g. 29.56"
                          onChange={(e) => setPlaceLat(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t("lngLabel")}</label>
                        <input
                          type="text"
                          value={placeLng}
                          placeholder="e.g. 115.89"
                          onChange={(e) => setPlaceLng(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                        />
                      </div>
                      <button type="submit" className="col-span-full bg-slate-900 hover:bg-slate-800 text-white py-1 rounded font-semibold text-xs">
                        {t("add")}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: CAREER & ACCLAIM & SOCIAL */}
              {activeSubTab === "career" && (
                <div className="space-y-8">
                  {/* Careers Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">💼 {t("tabCareer")}</h3>
                    <div className="space-y-2">
                      {(!person.occupations || person.occupations.length === 0) ? (
                        <p className="text-slate-400 text-xs italic">{t("noCareers")}</p>
                      ) : (
                        person.occupations.map((oc: any) => (
                          <div key={oc.id} className="flex justify-between items-center p-2 border border-slate-100 rounded bg-slate-50/50">
                            <div>
                              <span className="font-semibold text-slate-900 text-sm">{oc.title}</span>{" "}
                              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">{oc.type}</span>
                              <span className="text-slate-400 text-xs ml-2">({oc.startDate || "?"} ~ {oc.endDate || "?"})</span>
                            </div>
                            <button onClick={() => handleDeleteCareer(oc.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">
                              {t("delete")}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Add Career Form */}
                    <form onSubmit={handleAddCareer} className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder={t("careerTitle")}
                        required
                        value={careerTitle}
                        onChange={(e) => setCareerTitle(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      />
                      <select
                        value={careerType}
                        onChange={(e) => setCareerType(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      >
                        <option value="CIVIL">{t("careerTypeCivil")}</option>
                        <option value="MILITARY">{t("careerTypeMilitary")}</option>
                        <option value="TRADE">{t("careerTypeTrade")}</option>
                        <option value="ACADEMIC">{t("careerTypeAcademic")}</option>
                      </select>
                      <input
                        type="text"
                        placeholder={t("startDate")}
                        value={careerStart}
                        onChange={(e) => setCareerStart(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder={t("endDate")}
                        value={careerEnd}
                        onChange={(e) => setCareerEnd(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      />
                      <button type="submit" className="col-span-full bg-slate-900 hover:bg-slate-800 text-white py-1 rounded font-semibold text-xs">
                        {t("addCareer")}
                      </button>
                    </form>
                  </div>

                  {/* Accolades Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">🏆 {t("tabEducation")}</h3>
                    <div className="space-y-2">
                      {(!person.statusRecords || person.statusRecords.length === 0) ? (
                        <p className="text-slate-400 text-xs italic">{t("noStatusRecords")}</p>
                      ) : (
                        person.statusRecords.map((sr: any) => (
                          <div key={sr.id} className="flex justify-between items-center p-2 border border-slate-100 rounded bg-slate-50/50">
                            <div>
                              <span className="font-semibold text-slate-900 text-sm">{sr.statusValue}</span>{" "}
                              <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold uppercase">{sr.statusType}</span>
                              <span className="text-slate-400 text-xs ml-2">({sr.date || "?"})</span>
                            </div>
                            <button onClick={() => handleDeleteStatusRecord(sr.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">
                              {t("delete")}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Add Accolade Form */}
                    <form onSubmit={handleAddStatusRecord} className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-3 gap-2">
                      <select
                        value={statusRecordType}
                        onChange={(e) => setStatusRecordType(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      >
                        <option value="DEGREE">Degree / 学位</option>
                        <option value="TITLE">Title / 头衔</option>
                        <option value="EXILE">Exile / 变动流放</option>
                        <option value="HONORS">Honors / 勋爵荣誉</option>
                      </select>
                      <input
                        type="text"
                        placeholder={t("statusValuePlaceholder")}
                        required
                        value={statusRecordValue}
                        onChange={(e) => setStatusRecordValue(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder={t("statusDate")}
                        value={statusRecordDate}
                        onChange={(e) => setStatusRecordDate(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      />
                      <button type="submit" className="col-span-full bg-slate-900 hover:bg-slate-800 text-white py-1 rounded font-semibold text-xs">
                        {t("addStatusRecord")}
                      </button>
                    </form>
                  </div>

                  {/* Social Associations Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">🌐 {t("tabSocial")}</h3>
                    <div className="space-y-2">
                      {(!person.socialAssociations || person.socialAssociations.length === 0) ? (
                        <p className="text-slate-400 text-xs italic">{t("noSocials")}</p>
                      ) : (
                        person.socialAssociations.map((sa: any) => {
                          const targetName = sa.fromId === person.id ? getPersonName(sa.toId) : getPersonName(sa.fromId);
                          return (
                            <div key={sa.id} className="flex justify-between items-center p-2 border border-slate-100 rounded bg-slate-50/50">
                              <div>
                                <span className="font-semibold text-blue-600 text-sm">@{targetName}</span>{" "}
                                <span className="text-xs bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">{sa.relationType}</span>
                                {sa.notes && <span className="text-slate-500 text-xs ml-2">({sa.notes})</span>}
                              </div>
                              <button onClick={() => handleDeleteSocial(sa.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">
                                {t("delete")}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {/* Add Social Form */}
                    <form onSubmit={handleAddSocial} className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-3 gap-2">
                      <select
                        value={socialType}
                        onChange={(e) => setSocialType(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      >
                        <option value="TEACHER">{t("socialTypeTeacher")}</option>
                        <option value="STUDENT">{t("socialTypeStudent")}</option>
                        <option value="FRIEND">{t("socialTypeFriend")}</option>
                        <option value="COLLEAGUE">{t("socialTypeColleague")}</option>
                      </select>
                      <select
                        required
                        value={socialTargetId}
                        onChange={(e) => setSocialTargetId(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      >
                        <option value="" disabled>Select person...</option>
                        {allPersons.filter((p) => p.id !== person.id).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.surname ? `${p.surname} ` : ""}{p.givenName || "Unnamed"}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Notes (关系备考)"
                        value={socialNotes}
                        onChange={(e) => setSocialNotes(e.target.value)}
                        className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                      />
                      <button type="submit" className="col-span-full bg-slate-900 hover:bg-slate-800 text-white py-1 rounded font-semibold text-xs">
                        {t("addSocial")}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: CUSTOM EXTENSION FIELDS */}
              {activeSubTab === "custom" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    {(!person.customFields || person.customFields.length === 0) ? (
                      <p className="text-slate-400 text-xs italic">{t("noCustomFields")}</p>
                    ) : (
                      person.customFields.map((cf: any) => (
                        <div key={cf.id} className="flex justify-between items-center p-2 border border-slate-100 rounded bg-slate-50/50">
                          <div>
                            <span className="font-bold text-slate-700 text-xs">{cf.fieldName}:</span>{" "}
                            <span className="text-slate-900 text-sm font-medium">{cf.fieldValue}</span>
                          </div>
                          <button onClick={() => handleDeleteCustomField(cf.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">
                            {t("delete")}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Add Custom Field Form */}
                  <form onSubmit={handleAddCustomField} className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={t("fieldName")}
                      required
                      value={customFieldName}
                      onChange={(e) => setCustomFieldName(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder={t("fieldValue")}
                      required
                      value={customFieldValue}
                      onChange={(e) => setCustomFieldValue(e.target.value)}
                      className="border border-slate-300 rounded p-1 text-xs bg-white text-slate-800"
                    />
                    <button type="submit" className="col-span-full bg-slate-900 hover:bg-slate-800 text-white py-1 rounded font-semibold text-xs">
                      {t("addCustomField")}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

          {/* Kinship Relations Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
              <h3 className="text-base font-bold text-slate-900">{t("kinshipTitle")}</h3>
              <button 
                onClick={() => setIsAddingRelation(!isAddingRelation)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-semibold text-xs transition-colors shadow"
              >
                {isAddingRelation ? t("cancel") : t("addRelation")}
              </button>
            </div>

            {isAddingRelation && (
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <form onSubmit={handleAddRelation} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t("relationTypeLabel")}</label>
                    <select 
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm"
                    >
                      <option value="BIOLOGICAL_CHILD_OF">{t("relationChildOf")}</option>
                      <option value="BIOLOGICAL_FATHER_OF">{t("relationFatherOf")}</option>
                      <option value="BIOLOGICAL_MOTHER_OF">{t("relationMotherOf")}</option>
                      <option value="SPOUSE_OF">{t("relationSpouseOf")}</option>
                      <option value="ADOPTED_OUT_TO">{t("relationAdoptedTo")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{t("targetPersonLabel")}</label>
                    <select 
                      required
                      value={selectedPersonId}
                      onChange={(e) => setSelectedPersonId(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm"
                    >
                      <option value="" disabled>Select a person...</option>
                      {allPersons.filter(p => p.id !== person.id).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.surname ? `${p.surname} ` : ''}{p.givenName || 'Unnamed'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold text-sm">
                    {t("saveRelation")}
                  </button>
                </form>
              </div>
            )}

            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-500">{t("basicProfileTitle")}</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">{t("relationTypeLabel")}</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">{t("targetPersonLabel")}</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {relations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                        {t("noRelations")}
                      </td>
                    </tr>
                  ) : (
                    relations.map((relation) => {
                      const isFrom = relation.fromPersonId === person.id;
                      const rType = relation.relationType === "BIOLOGICAL_CHILD_OF" ? t("relationChildOf") : relation.relationType === "BIOLOGICAL_FATHER_OF" ? t("relationFatherOf") : relation.relationType === "BIOLOGICAL_MOTHER_OF" ? t("relationMotherOf") : relation.relationType === "SPOUSE_OF" ? t("relationSpouseOf") : relation.relationType;

                      return (
                        <tr key={relation.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {isFrom ? 'This Person' : getPersonName(relation.fromPersonId)}
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-semibold text-xs">
                            {rType}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {isFrom ? getPersonName(relation.toPersonId) : 'This Person'}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{relation.status}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTNOTES & CITATIONS CARD (V1.7) */}
      <div className="bg-[#faf8f5]/85 border border-amber-900/10 rounded-2xl shadow-sm p-6 space-y-6 mt-8 relative overflow-hidden font-serif">
        <div className="absolute inset-2 border border-dashed border-amber-900/10 pointer-events-none rounded-xl"></div>
        
        <div className="relative z-10 flex justify-between items-center border-b border-amber-900/15 pb-4">
          <div>
            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              📜 文献考证与佐证 (Footnotes & Citations)
            </h3>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              记录宗谱字段的考证来源及文字证据，支持可信度评级与佐证溯源
            </p>
          </div>
          <button
            onClick={() => setIsAddingClaim(true)}
            className="bg-amber-800 hover:bg-amber-900 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>添加考证</span>
          </button>
        </div>

        {/* Claim Modal Form */}
        {isAddingClaim && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <h4 className="font-bold text-sm">📜 新增佐证考证 (Add Citation)</h4>
                <button onClick={() => setIsAddingClaim(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
              </div>
              <form onSubmit={handleAddClaim} className="p-6 space-y-4 text-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">考证字段 (Predicate) *</label>
                    <select
                      value={newClaimPredicate}
                      onChange={(e) => setNewClaimPredicate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-850"
                    >
                      <option value="surname">{t("surname")} (姓)</option>
                      <option value="givenName">{t("givenName")} (名)</option>
                      <option value="sex">{t("gender")} (性别)</option>
                      <option value="birthDate">{t("birthDate")} (出生日期)</option>
                      <option value="deathDate">{t("deathDate")} (逝世日期)</option>
                      <option value="courtesyName">{t("courtesyName")} (字)</option>
                      <option value="artName">{t("artName")} (号)</option>
                      <option value="tabooName">{t("tabooName")} (讳)</option>
                      <option value="posthumousName">{t("posthumousName")} (谥号)</option>
                      <option value="childhoodName">{t("childhoodName")} (小名)</option>
                      <option value="genealogicalName">{t("genealogicalName")} (谱名)</option>
                      <option value="originalSurname">{t("originalSurname")} (本姓)</option>
                      <option value="adoptedSurname">{t("adoptedSurname")} (嗣姓)</option>
                      <option value="biography">{t("biographyLabel")} (生平/传记)</option>
                      <option value="notes">{t("notesLabel")} (备注/行状)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">可靠性 rating *</label>
                    <select
                      value={newClaimConfidence}
                      onChange={(e) => setNewClaimConfidence(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-850"
                    >
                      <option value="HIGH">🟢 HIGH (极高/如墓志铭或一手宗谱)</option>
                      <option value="MEDIUM">🟡 MEDIUM (中等/如口述历史或侧面史料)</option>
                      <option value="LOW">🔴 LOW (偏低/如推测或疑点佐证)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">关联文献来源 *</label>
                  <select
                    value={newClaimSourceId}
                    onChange={(e) => setNewClaimSourceId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-850"
                  >
                    {sources.length === 0 ? (
                      <option value="">-- 请先在项目详情页注册参考文献 --</option>
                    ) : (
                      sources.map((s) => (
                        <option key={s.id} value={s.id}>
                          📜 [{s.sourceType}] {s.title} ({s.dynasty || "近代"})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">原始文献引用 (Verbatim Excerpt / Quote)</label>
                  <textarea
                    value={newClaimQuote}
                    onChange={(e) => setNewClaimQuote(e.target.value)}
                    rows={3}
                    placeholder="例：行状载：公生于清康熙壬子年，性温敏…"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">现代考证阐释 (Modern Commentary / Interpretation)</label>
                  <textarea
                    value={newClaimInterpretation}
                    onChange={(e) => setNewClaimInterpretation(e.target.value)}
                    rows={2}
                    placeholder="例：康熙壬子年即康熙十一年（1672年），与口传谱载相符…"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingClaim(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-colors"
                  >
                    保存佐证
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Citations List */}
        {claims.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <span className="text-3xl block mb-2">📜</span>
            <p className="font-bold text-sm">暂无学术文献考证</p>
            <p className="text-xs mt-1">点击右上角，将宗谱记载、墓志铭、碑刻原文录入作为考证根据。</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-xs font-serif border-collapse">
              <thead>
                <tr className="border-b border-amber-900/15 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3 px-2 w-12 text-center">序号</th>
                  <th className="py-3 px-2 w-28">考证字段</th>
                  <th className="py-3 px-2 w-44">关联文献</th>
                  <th className="py-3 px-2">文献引文 (Verbatim Quote)</th>
                  <th className="py-3 px-2">考证阐释 (Interpretation)</th>
                  <th className="py-3 px-2 w-20 text-center">可信度</th>
                  <th className="py-3 px-2 w-16 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/10">
                {claims.map((c, i) => {
                  const src = sources.find((s) => s.id === c.sourceId);
                  return (
                    <tr key={c.id} id={`citation-${c.id}`} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-4 px-2 text-center font-bold text-amber-800 font-mono">
                        [{i + 1}]
                      </td>
                      <td className="py-4 px-2 font-bold text-slate-900">
                        {t(c.predicate) || c.predicate}
                      </td>
                      <td className="py-4 px-2">
                        {src ? (
                          <div>
                            <span className="font-semibold text-slate-800">{src.title}</span>
                            <div className="text-[10px] text-slate-450 font-sans mt-0.5">
                              {src.dynasty} · {src.author || "佚名"} ({src.volume || "全"})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">未知文献</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-slate-700 italic font-medium leading-relaxed">
                        {c.quote ? `“${c.quote}”` : <span className="text-slate-400 italic font-normal">无引用原文</span>}
                      </td>
                      <td className="py-4 px-2 text-slate-650 leading-relaxed">
                        {c.interpretation || <span className="text-slate-400 italic">无额外考释</span>}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {c.confidence === "HIGH" ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-2 py-0.5 rounded font-sans font-bold text-[9px]">高</span>
                        ) : c.confidence === "MEDIUM" ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-250 px-2 py-0.5 rounded font-sans font-bold text-[9px]">中</span>
                        ) : (
                          <span className="bg-rose-50 text-rose-800 border border-rose-250 px-2 py-0.5 rounded font-sans font-bold text-[9px]">低</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button
                          onClick={() => handleDeleteClaim(c.id)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-850 hover:underline"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
