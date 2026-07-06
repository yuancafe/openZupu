"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function PersonDetails({ params }: { params: Promise<{ id: string, personId: string }> }) {
  const unwrappedParams = use(params);
  const [person, setPerson] = useState<any>(null);
  const [relations, setRelations] = useState<any[]>([]);
  const [allPersons, setAllPersons] = useState<any[]>([]);
  const [geneticMatches, setGeneticMatches] = useState<any[]>([]);
  
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [isEditingDna, setIsEditingDna] = useState(false);

  // Relation form state
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [relationType, setRelationType] = useState("BIOLOGICAL_CHILD_OF");

  // DNA form state
  const [patrilinealDna, setPatrilinealDna] = useState("");
  const [matrilinealDna, setMatrilinealDna] = useState("");
  const [dnaSampleId, setDnaSampleId] = useState("");
  const [dnaMarkers, setDnaMarkers] = useState("");

  const fetchPersonData = () => {
    apiFetch(`/persons/${unwrappedParams.personId}`)
      .then(res => res.json())
      .then(data => {
        setPerson(data);
        setPatrilinealDna(data.patrilinealDna || "");
        setMatrilinealDna(data.matrilinealDna || "");
        setDnaSampleId(data.dnaSampleId || "");
        setDnaMarkers(data.dnaMarkers || "");
      })
      .catch(err => console.error(err));

    apiFetch(`/kinship-relation?personId=${unwrappedParams.personId}`)
      .then(res => res.json())
      .then(data => {
        setRelations(data);
      })
      .catch(err => console.error(err));

    apiFetch(`/persons/${unwrappedParams.personId}/genetic-matches`)
      .then(res => res.json())
      .then(data => {
        setGeneticMatches(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchPersonData();
    
    apiFetch(`/persons?projectId=${unwrappedParams.id}`)
      .then(res => res.json())
      .then(data => setAllPersons(data))
      .catch(err => console.error(err));
  }, [unwrappedParams.personId, unwrappedParams.id]);

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
          relationType: relationType,
          status: "CONFIRMED"
        }),
      });
      setIsAddingRelation(false);
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

  const getPersonName = (id: string) => {
    const p = allPersons.find(x => x.id === id);
    if (!p) return "Unknown";
    return `${p.surname || ''} ${p.givenName || 'Unnamed'}`.trim();
  };

  if (!person) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/projects/${unwrappedParams.id}`} className="text-slate-500 hover:text-blue-600">
          &larr; Back to Project
        </Link>
      </div>

      {/* Main Details and DNA Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {person.surname ? `${person.surname} ` : ''}{person.givenName || 'Unnamed'}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500 font-medium">Gender:</span> {person.sex || 'Unknown'}</div>
              <div><span className="text-slate-500 font-medium">ID:</span> {person.id}</div>
              <div><span className="text-slate-500 font-medium">Birth:</span> {person.birthDate || 'Unknown'}</div>
              <div><span className="text-slate-500 font-medium">Death:</span> {person.deathDate || (person.isLiving ? 'Alive' : 'Deceased')}</div>
            </div>
          </div>
        </div>

        {/* DNA Information Card */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              🧬 DNA Genetic Lineage
            </h3>
            <button
              onClick={() => setIsEditingDna(!isEditingDna)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {isEditingDna ? "Cancel" : "Edit DNA"}
            </button>
          </div>

          {isEditingDna ? (
            <form onSubmit={handleUpdateDna} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">DNA Sample ID</label>
                <input
                  type="text"
                  value={dnaSampleId}
                  onChange={(e) => setDnaSampleId(e.target.value)}
                  placeholder="e.g. SAMPLE-12345"
                  className="w-full border border-slate-300 rounded-md p-1.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Patrilineal Y-DNA (Father)</label>
                  <input
                    type="text"
                    value={patrilinealDna}
                    onChange={(e) => setPatrilinealDna(e.target.value)}
                    placeholder="e.g. O-M122"
                    className="w-full border border-slate-300 rounded-md p-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Matrilineal mtDNA (Mother)</label>
                  <input
                    type="text"
                    value={matrilinealDna}
                    onChange={(e) => setMatrilinealDna(e.target.value)}
                    placeholder="e.g. D4"
                    className="w-full border border-slate-300 rounded-md p-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">DNA STR/SNP Markers</label>
                <input
                  type="text"
                  value={dnaMarkers}
                  onChange={(e) => setDnaMarkers(e.target.value)}
                  placeholder="e.g. DYS393=13,DYS390=24,DYS19=14"
                  className="w-full border border-slate-300 rounded-md p-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm w-full"
              >
                Save DNA Markers
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500 font-medium">DNA Sample ID:</span>{" "}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{person.dnaSampleId || 'None'}</code>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Patrilineal Y-DNA:</span>{" "}
                <span className="text-blue-600 font-semibold">{person.patrilinealDna || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Matrilineal mtDNA:</span>{" "}
                <span className="text-pink-600 font-semibold">{person.matrilinealDna || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium font-mono">STR/SNP Markers:</span>{" "}
                <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200 mt-1 max-h-16 overflow-y-auto font-mono text-slate-700">
                  {person.dnaMarkers || 'No markers loaded.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Relatives and Matches Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Kinship Relations */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Kinship Relations</h3>
            <button 
              onClick={() => setIsAddingRelation(!isAddingRelation)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              {isAddingRelation ? "Cancel" : "Add Relation"}
            </button>
          </div>

          {isAddingRelation && (
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <form onSubmit={handleAddRelation} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Relation Type</label>
                  <select 
                    value={relationType}
                    onChange={(e) => setRelationType(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="BIOLOGICAL_CHILD_OF">Child of (This person is child of...)</option>
                    <option value="BIOLOGICAL_FATHER_OF">Father of (This person is father of...)</option>
                    <option value="BIOLOGICAL_MOTHER_OF">Mother of (This person is mother of...)</option>
                    <option value="SPOUSE_OF">Spouse of</option>
                    <option value="ADOPTED_OUT_TO">Adopted out to</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Person</label>
                  <select 
                    required
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>Select a person...</option>
                    {allPersons.filter(p => p.id !== person.id).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.surname ? `${p.surname} ` : ''}{p.givenName || 'Unnamed'}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm">
                  Save Relation
                </button>
              </form>
            </div>
          )}

          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">Subject</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Relation</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Target</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {relations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No relations found.
                    </td>
                  </tr>
                ) : (
                  relations.map((relation) => {
                    const isFrom = relation.fromPersonId === person.id;
                    const targetId = isFrom ? relation.toPersonId : relation.fromPersonId;
                    
                    return (
                      <tr key={relation.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {isFrom ? 'This Person' : getPersonName(relation.fromPersonId)}
                        </td>
                        <td className="px-6 py-4 text-blue-600 font-medium">
                          {relation.relationType}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {isFrom ? getPersonName(relation.toPersonId) : 'This Person'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{relation.status}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Genetic Matches / Biological Overlaps */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold flex items-center gap-1.5">
              🔬 Genetic DNA Matches
            </h3>
          </div>
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {geneticMatches.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">
                No overlapping DNA matches found. Add Y-DNA, mtDNA, or STR markers to discover matches.
              </div>
            ) : (
              geneticMatches.map((match) => (
                <div key={match.person.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-semibold text-slate-900">
                      {match.person.surname ? `${match.person.surname} ` : ''}{match.person.givenName || 'Unnamed'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                      {match.score}% match
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 space-y-1">
                    <div>Y-DNA: {match.person.patrilinealDna || 'N/A'} | mtDNA: {match.person.matrilinealDna || 'N/A'}</div>
                    <div className="border-t border-slate-200 pt-1 mt-1 text-[11px] font-medium text-slate-600">
                      Reasons:
                      <ul className="list-disc pl-3 text-slate-500 mt-0.5 space-y-0.5">
                        {match.reasons.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
