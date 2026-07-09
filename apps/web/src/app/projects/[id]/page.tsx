"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/components/LanguageContext";

export default function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { t, language } = useLanguage();
  const [project, setProject] = useState<any>(null);
  const [persons, setPersons] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Active Tab state: 'list', 'tree', 'members', 'tools'
  const [activeTab, setActiveTab] = useState("list");

  // Tree Tab Substate: 'descendant', 'ancestry', 'table'
  const [treeSubTab, setTreeSubTab] = useState("descendant");
  const [rootPersonId, setRootPersonId] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Add Member form state
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("EDITOR");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Person form state
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  const [newGivenName, setNewGivenName] = useState("");
  const [newSurname, setNewSurname] = useState("");
  const [newGender, setNewGender] = useState("UNKNOWN");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newDeathDate, setNewDeathDate] = useState("");
  const [newIsLiving, setNewIsLiving] = useState(true);

  // GEDCOM Import State
  const [gedcomFile, setGedcomFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState({ text: "", isError: false, loading: false });

  // V1.5 Traditional Chinese Pedigree settings
  const [minGen, setMinGen] = useState<number>(1);
  const [maxGen, setMaxGen] = useState<number>(10);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [excludeLiving, setExcludeLiving] = useState<boolean>(false);

  const fetchProjectData = () => {
    apiFetch(`/projects/${unwrappedParams.id}`)
      .then((res) => res.json())
      .then((data) => setProject(data))
      .catch((err) => console.error("Error fetching project:", err));

    apiFetch(`/persons?projectId=${unwrappedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setPersons(arr);
        if (arr.length > 0 && !rootPersonId) {
          setRootPersonId(arr[0].id);
        }
      })
      .catch((err) => console.error("Error fetching persons:", err));

    apiFetch(`/kinship-relation?projectId=${unwrappedParams.id}`)
      .then((res) => res.json())
      .then((data) => setRelations(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching relations:", err));

    apiFetch(`/projects/${unwrappedParams.id}/members`)
      .then((res) => res.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching members:", err));
  };

  useEffect(() => {
    fetchProjectData();
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, [unwrappedParams.id]);

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/persons", {
        method: "POST",
        body: JSON.stringify({
          projectId: unwrappedParams.id,
          givenName: newGivenName,
          surname: newSurname,
          sex: newGender,
          birthDate: newBirthDate || null,
          deathDate: newDeathDate || null,
          isLiving: newIsLiving,
          privacyLevel: "Private",
        }),
      });
      setIsCreatingPerson(false);
      setNewGivenName("");
      setNewSurname("");
      setNewGender("UNKNOWN");
      setNewBirthDate("");
      setNewDeathDate("");
      setNewIsLiving(true);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/projects/${unwrappedParams.id}/members`, {
        method: "POST",
        body: JSON.stringify({
          username: newMemberUsername,
          role: newMemberRole,
        }),
      });
      if (res.ok) {
        setIsAddingMember(false);
        setNewMemberUsername("");
        setNewMemberRole("EDITOR");
        fetchProjectData();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to add member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t("removeMemberConfirm"))) return;
    try {
      const res = await apiFetch(`/projects/${unwrappedParams.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProjectData();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      const res = await apiFetch(`/projects/${unwrappedParams.id}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        fetchProjectData();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- GEDCOM / GraphML / JSON & CSV Tools ---
  const handleGedcomImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gedcomFile) return;
    setImportStatus({ text: t("importing"), isError: false, loading: true });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const fileContent = evt.target?.result as string;
        const res = await apiFetch(`/projects/${unwrappedParams.id}/gedcom/import`, {
          method: "POST",
          body: JSON.stringify({ data: fileContent }),
        });
        if (res.ok) {
          setImportStatus({ text: t("success"), isError: false, loading: false });
          setGedcomFile(null);
          fetchProjectData();
        } else {
          const errData = await res.json();
          setImportStatus({ text: errData.message || t("error"), isError: true, loading: false });
        }
      } catch (err) {
        setImportStatus({ text: t("error"), isError: true, loading: false });
      }
    };
    reader.readAsText(gedcomFile);
  };

  const handleExportGedcom = async () => {
    try {
      const res = await apiFetch(`/projects/${unwrappedParams.id}/gedcom/export`);
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.name || "export"}.ged`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportGraphml = async () => {
    try {
      const res = await apiFetch(`/projects/${unwrappedParams.id}/export/graphml`);
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.name || "export"}.graphml`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(persons, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "backup"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "ID,Surname,Given Name,Gender,Birth,Death,Status\n";
    persons.forEach((p) => {
      csvContent += `"${p.id}","${p.surname || ""}","${p.givenName || ""}","${p.sex || ""}","${p.birthDate || ""}","${p.deathDate || ""}","${p.isLiving ? "Living" : "Deceased"}"\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name || "persons"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!project) return <div className="p-8 text-center text-slate-500">{t("loading")}</div>;

  const currentUserRoleInProject = members.find(m => m.userId === currentUser?.id)?.role;
  const isOwner = project.ownerId === currentUser?.id || currentUser?.role === "ADMIN" || currentUserRoleInProject === "OWNER" || currentUserRoleInProject === "ADMIN";

  // --- Kinship Computations ---
  const getParents = (personId: string) => {
    const parentRels = relations.filter(
      (r) =>
        r.toPersonId === personId &&
        ["BIOLOGICAL_FATHER_OF", "BIOLOGICAL_MOTHER_OF", "ADOPTIVE_FATHER_OF", "ADOPTIVE_MOTHER_OF"].includes(
          r.relationType
        )
    );
    const fatherRel = parentRels.find((r) => r.relationType.includes("FATHER"));
    const motherRel = parentRels.find((r) => r.relationType.includes("MOTHER"));

    return {
      father: fatherRel ? persons.find((p) => p.id === fatherRel.fromPersonId) : null,
      mother: motherRel ? persons.find((p) => p.id === motherRel.fromPersonId) : null,
    };
  };

  const getSpouses = (personId: string) => {
    const spouseRels = relations.filter(
      (r) => r.relationType === "SPOUSE_OF" && (r.fromPersonId === personId || r.toPersonId === personId)
    );
    return spouseRels.map((r) => {
      const spouseId = r.fromPersonId === personId ? r.toPersonId : r.fromPersonId;
      return persons.find((p) => p.id === spouseId);
    }).filter(Boolean);
  };

  const getChildren = (personId: string) => {
    const childrenRels = relations.filter(
      (r) =>
        r.fromPersonId === personId &&
        ["BIOLOGICAL_FATHER_OF", "BIOLOGICAL_MOTHER_OF", "ADOPTIVE_FATHER_OF", "ADOPTIVE_MOTHER_OF"].includes(
          r.relationType
        )
    );
    return childrenRels.map((r) => persons.find((p) => p.id === r.toPersonId)).filter(Boolean);
  };

  // --- Ancestry Visual Card Tree ---
  const renderAncestry = (rootId: string) => {
    const self = persons.find((p) => p.id === rootId);
    if (!self) return <div className="text-slate-500">Select a valid root person.</div>;

    const { father, mother } = getParents(rootId);
    const fParents = father ? getParents(father.id) : { father: null, mother: null };
    const mParents = mother ? getParents(mother.id) : { father: null, mother: null };

    const NodeBox = ({ person, title }: { person: any; title: string }) => (
      <div className={`p-4 rounded-lg border transition-all flex flex-col items-center justify-center text-center ${
        person
          ? "bg-white border-slate-200 shadow-sm hover:border-blue-400"
          : "bg-slate-50 border-slate-200 border-dashed"
      }`}>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">{title}</span>
        {person && (
          <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 border-2 mb-1.5 ${
            person.sex === "MALE" || person.sex === "Male"
              ? "border-blue-200 text-blue-700"
              : person.sex === "FEMALE" || person.sex === "Female"
              ? "border-rose-200 text-rose-700"
              : "border-slate-200 text-slate-600"
          }`}>
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold">
                {person.surname ? person.surname[0] : (person.givenName ? person.givenName[0] : "👤")}
              </span>
            )}
          </div>
        )}
        {person ? (
          <Link href={`/projects/${project.id}/persons/${person.id}`} className="font-semibold text-slate-800 hover:text-blue-600 block text-sm">
            {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
          </Link>
        ) : (
          <span className="text-slate-400 text-xs italic">Unknown</span>
        )}
        {person && (
          <span className="text-[10px] text-slate-500 mt-0.5">
            {person.birthDate ? person.birthDate.split("-")[0] : "?"} - {person.deathDate ? person.deathDate.split("-")[0] : person.isLiving ? t("living") : "?"}
          </span>
        )}
      </div>
    );

    return (
      <div className="flex flex-col items-center space-y-8 w-full overflow-x-auto p-4">
        {/* Grandparents (Gen 2) */}
        <div className="grid grid-cols-4 gap-4 w-full max-w-4xl">
          <NodeBox person={fParents.father} title={`${t("paternalGrandfather")} (Father's Father)`} />
          <NodeBox person={fParents.mother} title={`${t("paternalGrandmother")} (Father's Mother)`} />
          <NodeBox person={mParents.father} title={`${t("maternalGrandfather")} (Mother's Father)`} />
          <NodeBox person={mParents.mother} title={`${t("maternalGrandmother")} (Mother's Mother)`} />
        </div>

        {/* Connecting Lines Gen 2 -> Gen 1 */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl h-4">
          <div className="border-x border-t border-slate-300 rounded-t h-full w-1/2 mx-auto"></div>
          <div className="border-x border-t border-slate-300 rounded-t h-full w-1/2 mx-auto"></div>
        </div>

        {/* Parents (Gen 1) */}
        <div className="grid grid-cols-2 gap-16 w-full max-w-2xl">
          <NodeBox person={father} title={t("father")} />
          <NodeBox person={mother} title={t("mother")} />
        </div>

        {/* Connecting Lines Gen 1 -> Self */}
        <div className="w-full max-w-2xl h-4">
          <div className="border-x border-t border-slate-300 rounded-t h-full w-1/2 mx-auto"></div>
        </div>

        {/* Root (Gen 0) */}
        <div className="w-full max-w-xs">
          <div className="p-5 rounded-lg border-2 border-blue-500 bg-blue-50/50 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-500 mb-2">{t("rootPersonLabel")}</span>
            <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 border-2 mb-2 border-blue-300`}>
              {self.avatarUrl ? (
                <img src={self.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold text-blue-700">
                  {self.surname ? self.surname[0] : (self.givenName ? self.givenName[0] : "👤")}
                </span>
              )}
            </div>
            <Link href={`/projects/${project.id}/persons/${self.id}`} className="font-bold text-blue-900 hover:text-blue-700 block text-lg">
              {self.surname ? `${self.surname} ` : ""}{self.givenName || "Unnamed"}
            </Link>
            <span className="text-xs text-blue-700 mt-1">
              {self.birthDate ? self.birthDate : "?"} - {self.deathDate ? self.deathDate : self.isLiving ? t("living") : "?"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderDescendantNode = (person: any, currentDepth = 0): React.ReactNode => {
    const spouses = getSpouses(person.id);
    const children = getChildren(person.id);
    const isExpanded = expandedNodes[person.id] !== false;

    return (
      <div key={person.id} className="pl-6 border-l-2 border-slate-200/60 my-2 relative">
        <div className="flex items-center space-x-3 bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-sm hover:border-slate-300 w-fit">
          {children.length > 0 && (
            <button
              onClick={() => toggleNode(person.id)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none text-xs font-bold w-4 h-4 flex items-center justify-center border border-slate-200 rounded mr-0.5"
            >
              {isExpanded ? "−" : "+"}
            </button>
          )}
          
          <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 border-2 ${
            person.sex === "MALE" || person.sex === "Male"
              ? "border-blue-200 text-blue-700"
              : person.sex === "FEMALE" || person.sex === "Female"
              ? "border-rose-200 text-rose-700"
              : "border-slate-200 text-slate-600"
          }`}>
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold">
                {person.surname ? person.surname[0] : (person.givenName ? person.givenName[0] : "👤")}
              </span>
            )}
          </div>

          <div>
            <Link href={`/projects/${project.id}/persons/${person.id}`} className="font-semibold text-slate-800 hover:text-blue-600 block text-sm">
              {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
            </Link>
            {person.birthDate && (
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                生卒: {person.birthDate.split("-")[0]} - {person.deathDate ? person.deathDate.split("-")[0] : (person.isLiving ? t("living") : "?")}
              </span>
            )}
          </div>

          {spouses.length > 0 && (
            <div className="flex items-center space-x-1 border-l border-slate-100 pl-2 ml-1 text-slate-400 text-xs">
              <span>⚭</span>
              {spouses.map((s: any) => (
                <Link key={s.id} href={`/projects/${project.id}/persons/${s.id}`} className="hover:text-blue-600 font-medium">
                  {s.surname || ""}{s.givenName || "Unnamed"}
                </Link>
              ))}
            </div>
          )}
        </div>

        {children.length > 0 && isExpanded && (
          <div className="mt-2 space-y-1">
            {children.map((child: any) => renderDescendantNode(child, currentDepth + 1))}
          </div>
        )}
      </div>
    );
  };

  const generateLineageRows = () => {
    const root = persons.find((p) => p.id === rootPersonId);
    if (!root) return [];

    const computedRows: any[] = [];
    const queue = [{ id: root.id, gen: 1, relation: "Root" }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const person = persons.find((p) => p.id === current.id);
      if (!person) continue;

      computedRows.push({
        person,
        generation: current.gen,
        relationPath: current.relation,
      });

      const spouses = getSpouses(current.id);
      for (const spouse of spouses) {
        if (!visited.has(spouse.id)) {
          computedRows.push({
            person: spouse,
            generation: current.gen,
            relationPath: `Spouse of ${person.surname || ""}${person.givenName || "Unnamed"}`,
          });
          visited.add(spouse.id);
        }
      }

      const children = getChildren(current.id);
      for (const child of children) {
        queue.push({
          id: child.id,
          gen: current.gen + 1,
          relation: `Child of ${person.surname || ""}${person.givenName || "Unnamed"}`,
        });
      }
    }

    return computedRows;
  };

  // V1.5 Traditional Chinese Pedigree Rendering Helpers
  const renderVerticalTreeNode = (person: any, currentGenNum = 1): React.ReactNode => {
    if (currentGenNum < minGen || currentGenNum > maxGen) return null;
    if (excludeLiving && person.isLiving) return null;

    const children = getChildren(person.id);
    const spouses = getSpouses(person.id);

    return (
      <div key={person.id} className="flex flex-row-reverse items-center relative my-4">
        {/* Vertical Person card on the right */}
        <div className="relative z-10 bg-[#fdfbf7] border-double border-4 border-red-700/80 p-3 flex flex-col items-center justify-center min-h-[140px] w-14 rounded shadow-sm select-none hover:border-red-950 transition-colors" style={{ writingMode: "vertical-rl" }}>
          {person.avatarUrl && (
            <img src={person.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover mb-2 border border-red-200" style={{ writingMode: "horizontal-tb" }} />
          )}
          <span className="text-[9px] font-bold text-red-600 uppercase mb-1">{person.rankInSiblings || "子"}</span>
          <span className="text-sm font-bold text-slate-900 tracking-wider">
            <Link href={`/projects/${project.id}/persons/${person.id}`} className="hover:underline">
              {person.surname}{person.givenName}
            </Link>
          </span>
          <span className="text-[8px] text-slate-400 font-mono mt-1">
            {person.birthDate ? person.birthDate.split("-")[0] : ""}生
          </span>
        </div>

        {/* Spouse details stacked next to husband in traditional format */}
        {spouses.length > 0 && (
          <div className="flex flex-col gap-1 mr-1 justify-center">
            {spouses.map((s: any) => (
              <div key={s.id} className="bg-[#fefefc] border border-dashed border-red-400 p-2 flex flex-col items-center justify-center text-[11px] w-9 rounded" style={{ writingMode: "vertical-rl" }}>
                <span className="text-red-500 font-medium">配</span>
                <Link href={`/projects/${project.id}/persons/${s.id}`} className="font-semibold text-slate-800 hover:underline">
                  {s.surname || ""}{s.givenName || "氏"}
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Connecting horizontal line to the children group to the left */}
        {children.length > 0 && currentGenNum < maxGen && (
          <div className="w-8 h-0.5 bg-red-600/80"></div>
        )}

        {/* Children column stacked vertically on the left */}
        {children.length > 0 && currentGenNum < maxGen && (
          <div className="flex flex-col border-r-2 border-red-500/80 pr-6 relative space-y-2">
            {children.map((child: any) => {
              const childNode = renderVerticalTreeNode(child, currentGenNum + 1);
              if (!childNode) return null;
              return (
                <div key={child.id} className="relative">
                  {/* Horizontal sibling branch line linking child to vertical sibling column line */}
                  <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-red-500/80 -translate-y-1/2"></div>
                  {childNode}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getFilteredBranchPersons = (): any[] => {
    const branchRootId = selectedBranchId || rootPersonId;
    if (!branchRootId) return [];

    const branchRoot = persons.find(p => p.id === branchRootId);
    if (!branchRoot) return [];

    const result: any[] = [];
    const visited = new Set<string>();

    const traverse = (pId: string, currentGen = 1) => {
      if (visited.has(pId)) return;
      visited.add(pId);

      const p = persons.find(x => x.id === pId);
      if (!p) return;

      if (currentGen >= minGen && currentGen <= maxGen) {
        if (!(excludeLiving && p.isLiving)) {
          result.push({ person: p, generation: currentGen });
        }
      }

      const children = getChildren(pId);
      for (const child of children) {
        traverse(child.id, currentGen + 1);
      }
    };

    traverse(branchRootId, 1);
    return result;
  };

  const renderVerticalRegistry = () => {
    const branchPersons = getFilteredBranchPersons();
    if (branchPersons.length === 0) {
      return <div className="text-slate-400 p-12 text-center">暂无符合筛选条件的宗亲记录。</div>;
    }

    return (
      <div className="flex flex-row-reverse overflow-x-auto gap-4 p-8 bg-[#fdfaf2] border border-amber-200/40 rounded-lg min-h-[500px] font-serif shadow-inner select-none print:bg-white print:border-none print:shadow-none">
        {branchPersons.map(({ person, generation }) => {
          const { father, mother } = getParents(person.id);
          const spouses = getSpouses(person.id);
          const children = getChildren(person.id);

          return (
            <div key={person.id} className="flex-none w-32 border-x border-red-700/30 px-3 flex flex-col justify-between min-h-[400px] relative bg-[#fdfbf6] py-4 print:border-red-600/50" style={{ writingMode: "vertical-rl" }}>
              {/* Top: Gen and Name */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-red-100 pb-2 mb-2 w-full">
                  <span className="text-[10px] bg-red-100 text-red-800 px-1 py-0.5 rounded font-sans font-bold" style={{ writingMode: "horizontal-tb" }}>
                    第 {generation} 世
                  </span>
                  {person.avatarUrl && (
                    <img src={person.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-red-300 object-cover mt-2" style={{ writingMode: "horizontal-tb" }} />
                  )}
                </div>
                
                <div className="text-lg font-bold text-red-900 tracking-wider">
                  {person.surname}{person.givenName}
                </div>

                {/* Courtesy / posthumous name details */}
                <div className="text-[11px] text-slate-600 space-y-1 mt-2">
                  {person.courtesyName && <div>字{person.courtesyName}</div>}
                  {person.artName && <div>号{person.artName}</div>}
                  {person.posthumousName && <div>谥{person.posthumousName}</div>}
                  {person.rankInSiblings && <div>排行：{person.rankInSiblings}</div>}
                </div>

                {/* Relational parents */}
                <div className="text-xs text-slate-700 font-medium space-y-1 mt-4">
                  {father && <div>父系：{father.surname}{father.givenName}</div>}
                  {mother && <div>母系：{mother.surname}{mother.givenName}</div>}
                  {spouses.length > 0 && (
                    <div>
                      娶妻：
                      {spouses.map((s: any) => `${s.surname || ""}${s.givenName || "氏"}`).join("、")}
                    </div>
                  )}
                </div>

                {/* Life history details */}
                <div className="text-[11px] text-slate-800 leading-loose mt-4 border-t border-red-50/50 pt-2 h-44 overflow-y-auto pr-1">
                  {person.biography || "生卒考证不详。"}
                  {children.length > 0 && (
                    <div className="mt-3 text-red-800/80">
                      生子：
                      {children.map((c: any) => `${c.surname}${c.givenName}`).join("、")}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom footer index */}
              <div className="text-[9px] text-slate-400 font-mono self-start border-t border-slate-100 w-full pt-1">
                ID: {person.id.substring(0, 8)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFanChart = (): React.ReactNode => {
    const rootPerson = persons.find(p => p.id === rootPersonId);
    if (!rootPerson) return null;

    const children = getChildren(rootPerson.id);
    
    const wedgesLevel1: any[] = [];
    let totalGrandchildren = 0;
    
    children.forEach(c => {
      const gChildren = getChildren(c.id);
      totalGrandchildren += gChildren.length > 0 ? gChildren.length : 1;
      wedgesLevel1.push({
        person: c,
        grandchildren: gChildren
      });
    });

    const totalWedges = totalGrandchildren > 0 ? totalGrandchildren : 1;
    const startAngle = -Math.PI / 2;
    const totalAngle = Math.PI * 2;

    const cx = 300;
    const cy = 300;

    let currentWedgeIndex = 0;
    const paths: React.ReactNode[] = [];

    const getWedgePath = (
      x: number, y: number,
      innerR: number, outerR: number,
      startA: number, endA: number,
      fillColor: string,
      strokeColor: string,
      label: string,
      personId: string
    ) => {
      const x1_in = x + innerR * Math.cos(startA);
      const y1_in = y + innerR * Math.sin(startA);
      const x2_in = x + innerR * Math.cos(endA);
      const y2_in = y + innerR * Math.sin(endA);
      
      const x1_out = x + outerR * Math.cos(startA);
      const y1_out = y + outerR * Math.sin(startA);
      const x2_out = x + outerR * Math.cos(endA);
      const y2_out = y + outerR * Math.sin(endA);

      const largeArc = endA - startA > Math.PI ? 1 : 0;

      const d = `
        M ${x1_in} ${y1_in}
        L ${x1_out} ${y1_out}
        A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2_out} ${y2_out}
        L ${x2_in} ${y2_in}
        A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1_in} ${y1_in}
        Z
      `;

      const midA = (startA + endA) / 2;
      const midR = (innerR + outerR) / 2;
      const tx = x + midR * Math.cos(midA);
      const ty = y + midR * Math.sin(midA);

      let rotation = (midA * 180) / Math.PI;
      if (rotation > 90 && rotation < 270) {
        rotation += 180;
      }

      return (
        <g key={personId} className="group cursor-pointer select-none">
          <path
            d={d}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={1.5}
            className="transition-all duration-300 hover:opacity-90 hover:stroke-amber-600"
          />
          <Link href={`/projects/${project.id}/persons/${personId}`}>
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${rotation}, ${tx}, ${ty})`}
              className="text-[9px] font-bold font-serif fill-slate-900 pointer-events-none group-hover:fill-amber-900"
            >
              {label}
            </text>
          </Link>
        </g>
      );
    };

    paths.push(
      <g key={rootPerson.id} className="cursor-pointer select-none">
        <circle
          cx={cx}
          cy={cy}
          r={55}
          fill="#fdfbf7"
          stroke="#b45309"
          strokeWidth={3}
          className="transition-all duration-300 hover:stroke-amber-900"
        />
        <Link href={`/projects/${project.id}/persons/${rootPerson.id}`}>
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-serif font-extrabold fill-amber-900"
          >
            {rootPerson.surname}{rootPerson.givenName}
          </text>
        </Link>
      </g>
    );

    wedgesLevel1.forEach((w) => {
      const childGrandkidsCount = w.grandchildren.length > 0 ? w.grandchildren.length : 1;
      const childWedgeAngle = (childGrandkidsCount / totalWedges) * totalAngle;
      
      const childStartAngle = startAngle + (currentWedgeIndex / totalWedges) * totalAngle;
      const childEndAngle = childStartAngle + childWedgeAngle;

      paths.push(
        getWedgePath(
          cx, cy, 55, 130,
          childStartAngle, childEndAngle,
          "#faf6ec", "#d97706",
          `${w.person.surname}${w.person.givenName}`,
          w.person.id
        )
      );

      if (w.grandchildren.length > 0) {
        w.grandchildren.forEach((g: any, gIndex: number) => {
          const gStartA = childStartAngle + (gIndex / childGrandkidsCount) * childWedgeAngle;
          const gEndA = gStartA + (1 / childGrandkidsCount) * childWedgeAngle;

          paths.push(
            getWedgePath(
              cx, cy, 130, 205,
              gStartA, gEndA,
              "#fffbf2", "#f59e0b",
              `${g.surname || ""}${g.givenName || ""}`,
              g.id
            )
          );

          const gChildren = getChildren(g.id);
          if (gChildren.length > 0) {
            gChildren.forEach((gc: any, gcIndex: number) => {
              const gcCount = gChildren.length;
              const gcStartA = gStartA + (gcIndex / gcCount) * (gEndA - gStartA);
              const gcEndA = gcStartA + (1 / gcCount) * (gEndA - gStartA);
              
              paths.push(
                getWedgePath(
                  cx, cy, 205, 270,
                  gcStartA, gcEndA,
                  "#fdfcf7", "#fbbf24",
                  `${gc.surname || ""}${gc.givenName || ""}`,
                  gc.id
                )
              );
            });
          }
        });
      }

      currentWedgeIndex += childGrandkidsCount;
    });

    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#fdfaf2]/60 rounded-2xl border border-amber-900/10 shadow-inner">
        <div className="border border-double border-4 border-amber-800/60 p-4 bg-white rounded-2xl shadow">
          <svg width={600} height={600} className="max-w-full">
            {paths}
          </svg>
        </div>
        <p className="text-xs font-serif text-amber-900 mt-4 text-center max-w-md">
          🪭 <b>世系扇形图 (Concentric Fan Chart)</b>：以 <b>{rootPerson.surname}{rootPerson.givenName}</b> 为中心，由内向外依次展现后代世系（中心为根节点，二圈为子女，三圈为孙辈，外圈为曾孙辈）。
        </p>
      </div>
    );
  };

  const getStatistics = () => {
    const total = persons.length;
    let male = 0;
    let female = 0;
    let unknown = 0;
    let deceasedCount = 0;
    let totalAge = 0;
    const generations: { [key: number]: number } = {};
    const yHaplogroups: { [key: string]: number } = {};
    const mtHaplogroups: { [key: string]: number } = {};
    let dnaCount = 0;

    persons.forEach((p) => {
      if (p.sex === "MALE" || p.sex === "Male") male++;
      else if (p.sex === "FEMALE" || p.sex === "Female") female++;
      else unknown++;

      if (!p.isLiving && p.birthDate && p.deathDate) {
        const birthYear = parseInt(p.birthDate.split("-")[0]);
        const deathYear = parseInt(p.deathDate.split("-")[0]);
        if (!isNaN(birthYear) && !isNaN(deathYear) && deathYear >= birthYear) {
          totalAge += (deathYear - birthYear);
          deceasedCount++;
        }
      }

      const gen = p.generationNumber || 1;
      generations[gen] = (generations[gen] || 0) + 1;

      if (p.dnaSampleId) {
        dnaCount++;
        if (p.yHaplogroup) {
          yHaplogroups[p.yHaplogroup] = (yHaplogroups[p.yHaplogroup] || 0) + 1;
        }
        if (p.mtHaplogroup) {
          mtHaplogroups[p.mtHaplogroup] = (mtHaplogroups[p.mtHaplogroup] || 0) + 1;
        }
      }
    });

    const averageAge = deceasedCount > 0 ? Math.round(totalAge / deceasedCount) : null;

    return {
      total,
      male,
      female,
      unknown,
      deceasedCount,
      averageAge,
      generations,
      yHaplogroups,
      mtHaplogroups,
      dnaCount
    };
  };

  const renderStatsTab = () => {
    const stats = getStatistics();
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div>
              <span className="text-2xl">👥</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Total Clan Members</h4>
              <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Database records registered under this repository</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <div>
              <span className="text-2xl">🧬</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">DNA Matching Coverage</h4>
              <p className="text-3xl font-extrabold text-slate-800 mt-1">{stats.dnaCount}</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Members carrying Y-STR / mtDNA mutational samples</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div>
              <span className="text-2xl">⏳</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Average Lifespan</h4>
              <p className="text-3xl font-extrabold text-slate-800 mt-1">
                {stats.averageAge ? `${stats.averageAge} yrs` : "N/A"}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Calculated from deceased ancestors with dates</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500"></div>
            <div>
              <span className="text-2xl">🌱</span>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Total Generations</h4>
              <p className="text-3xl font-extrabold text-slate-800 mt-1">
                {Object.keys(stats.generations).length}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 mt-4">Generational range recorded in this book</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">👨‍👩‍👧‍👦 Gender Balance Ratio</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-700">Male (男)</span>
                  <span>{stats.male} ({stats.total > 0 ? Math.round((stats.male / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.male / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700">Female (女)</span>
                  <span>{stats.female} ({stats.total > 0 ? Math.round((stats.female / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.female / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Unknown/Unspecified</span>
                  <span>{stats.unknown} ({stats.total > 0 ? Math.round((stats.unknown / stats.total) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.unknown / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">📈 Generational Distribution</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {Object.entries(stats.generations)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([genNum, count]) => {
                  const maxCount = Math.max(...Object.values(stats.generations));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={genNum} className="flex items-center gap-3">
                      <span className="w-14 text-xs font-bold text-slate-500 shrink-0 text-right">Gen {genNum}</span>
                      <div className="flex-1 bg-slate-50 h-5 rounded-md overflow-hidden relative border border-slate-100">
                        <div className="bg-amber-500/20 border-r border-amber-500 h-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-700">{count} members</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 mb-4">🧬 Y-DNA / mtDNA Haplogroup Coverage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h5 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">Y-DNA Haplogroups (Patrilineal)</h5>
              {Object.keys(stats.yHaplogroups).length === 0 ? (
                <p className="text-xs text-slate-400">No patrilineal genetic samples registered.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {Object.entries(stats.yHaplogroups).map(([haplo, count]) => (
                    <div key={haplo} className="flex justify-between py-2 text-xs font-medium text-slate-700">
                      <span className="font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">{haplo}</span>
                      <span>{count} occurrences</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h5 className="text-xs font-bold text-rose-700 mb-2 uppercase tracking-wide">mtDNA Haplogroups (Matrilineal)</h5>
              {Object.keys(stats.mtHaplogroups).length === 0 ? (
                <p className="text-xs text-slate-400">No matrilineal genetic samples registered.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {Object.entries(stats.mtHaplogroups).map(([haplo, count]) => (
                    <div key={haplo} className="flex justify-between py-2 text-xs font-medium text-slate-700">
                      <span className="font-mono bg-rose-50 text-rose-800 px-2 py-0.5 rounded font-bold">{haplo}</span>
                      <span>{count} occurrences</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getMigrationTimeline = () => {
    const events: any[] = [];
    persons.forEach((p) => {
      const name = `${p.surname || ""}${p.givenName || ""}`;
      const genNum = p.generationNumber || 1;
      
      if (p.birthPlace) {
        const birthYear = p.birthDate ? parseInt(p.birthDate.split("-")[0]) : null;
        events.push({
          person: p,
          name,
          genNum,
          type: "birth",
          label: "Birth & Nesting (出生落户)",
          place: p.birthPlace,
          year: birthYear,
          dateDesc: p.birthDate || "Date Unknown"
        });
      }
      if (p.deathPlace) {
        const deathYear = p.deathDate ? parseInt(p.deathDate.split("-")[0]) : null;
        events.push({
          person: p,
          name,
          genNum,
          type: "death",
          label: "Decease (寿终过世)",
          place: p.deathPlace,
          year: deathYear,
          dateDesc: p.deathDate || "Date Unknown"
        });
      }
    });

    return events.sort((a, b) => {
      if (a.year === null && b.year === null) return 0;
      if (a.year === null) return 1;
      if (b.year === null) return -1;
      return a.year - b.year;
    });
  };

  const renderMigrationTab = () => {
    const timeline = getMigrationTimeline();
    if (timeline.length === 0) {
      return (
        <div className="text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <span className="text-4xl block mb-2">🗺️</span>
          <p className="font-bold text-slate-600">No Place Events Registered</p>
          <p className="text-xs mt-1">Add birth places or death places to family members to trace migrations.</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-fadeIn">
        <div className="border-b border-slate-100 pb-3 mb-6">
          <h4 className="text-lg font-bold text-slate-800">🗺️ Clan Migration & Geolocation Timeline</h4>
          <p className="text-xs text-slate-400 mt-1">Chronological record of family migration points parsed across generations.</p>
        </div>
        <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8 py-2">
          {timeline.map((evt, idx) => {
            return (
              <div key={idx} className="relative group">
                <span className="absolute -left-[31px] top-1 bg-white border-2 border-amber-600 rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm group-hover:bg-amber-600 transition-colors">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full group-hover:bg-white transition-colors"></span>
                </span>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      Gen {evt.genNum} &bull; {evt.year ? `${evt.year} AD` : "Year Unknown"}
                    </span>
                    <h5 className="font-serif font-extrabold text-slate-900 text-base mt-2 flex items-center gap-2">
                      <Link href={`/projects/${project.id}/persons/${evt.person.id}`} className="hover:underline text-slate-900 hover:text-amber-800 transition-colors">
                        {evt.name}
                      </Link>
                      <span className="text-xs font-semibold text-slate-400 font-sans">({evt.label})</span>
                    </h5>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#faf8f5] text-slate-700 border border-slate-100">
                      📍 {evt.place}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">Date detail: {evt.dateDesc}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project Header */}
      <div className="relative bg-[#faf8f5] border border-amber-900/10 p-6 rounded-2xl shadow-sm overflow-hidden">
        {/* Archival seal overlay style */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl select-none opacity-[0.03] font-serif" style={{ writingMode: "vertical-rl" }}>
          開元族譜
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/40">
              📂 {project.projectType || "FAMILY"} REPOSITORY
            </span>
            <h2 className="text-3xl font-serif font-extrabold text-slate-900 mt-2 tracking-tight">
              {project.name}
            </h2>
            <p className="text-slate-500 mt-2 text-base leading-relaxed max-w-3xl">
              {project.description || t("noProjects")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/50 max-w-4xl">
        <button
          onClick={() => setActiveTab("list")}
          className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "list" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
          }`}
        >
          📂 {t("personListTab")}
        </button>
        <button
          onClick={() => setActiveTab("tree")}
          className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "tree" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
          }`}
        >
          🌿 {t("familyTreeTab")}
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "stats" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
          }`}
        >
          📊 {language === "zh" ? "数据统计" : "Statistics"}
        </button>
        <button
          onClick={() => setActiveTab("migration")}
          className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "migration" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
          }`}
        >
          🗺️ {language === "zh" ? "迁徙历史" : "Migration"}
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "members" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
          }`}
        >
          👥 {t("membersTab")}
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`py-2 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
            activeTab === "tools" ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/50"
          }`}
        >
          🛠️ {t("dataToolsTab")}
        </button>
      </div>

      {/* 1. PERSON LIST TAB */}
      {activeTab === "list" && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t("personListTab")}</h3>
            <button
              onClick={() => setIsCreatingPerson(!isCreatingPerson)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow"
            >
              {isCreatingPerson ? t("cancel") : t("addPerson")}
            </button>
          </div>

          {isCreatingPerson && (
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <form onSubmit={handleCreatePerson} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("surname")} (Surname)</label>
                    <input
                      type="text"
                      value={newSurname}
                      onChange={(e) => setNewSurname(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("givenName")} (Given Name)</label>
                    <input
                      type="text"
                      required
                      value={newGivenName}
                      onChange={(e) => setNewGivenName(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("gender")}</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                    >
                      <option value="UNKNOWN">{t("unknown")}</option>
                      <option value="MALE">{t("male")}</option>
                      <option value="FEMALE">{t("female")}</option>
                      <option value="OTHER">{t("other")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t("status")}</label>
                    <div className="flex items-center mt-2 space-x-4">
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          checked={newIsLiving === true}
                          onChange={() => setNewIsLiving(true)}
                          className="mr-2 focus:ring-blue-500 text-blue-600"
                        />
                        {t("living")}
                      </label>
                      <label className="flex items-center text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          checked={newIsLiving === false}
                          onChange={() => setNewIsLiving(false)}
                          className="mr-2 focus:ring-blue-500 text-blue-600"
                        />
                        {t("deceased")}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Birth Date (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1920-05-12"
                      value={newBirthDate}
                      onChange={(e) => setNewBirthDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                    />
                  </div>
                  {!newIsLiving && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Death Date (YYYY-MM-DD)</label>
                      <input
                        type="text"
                        placeholder="e.g. 2005-11-20"
                        value={newDeathDate}
                        onChange={(e) => setNewDeathDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                      />
                    </div>
                  )}
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm">
                  {t("savePerson")}
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-[#fafafa] border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">{t("name")}</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">{t("gender")}</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">{t("lifetime")}</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">{t("status")}</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {persons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 bg-white">
                      <span className="text-xl">👤</span>
                      <p className="mt-1">{t("noPersons")}</p>
                    </td>
                  </tr>
                ) : (
                  persons.map((person) => {
                    const isMale = person.sex === "MALE" || person.sex === "Male";
                    const isFemale = person.sex === "FEMALE" || person.sex === "Female";
                    return (
                      <tr key={person.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Visual avatar with color-coded ring */}
                            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 border border-white shadow-sm shrink-0 ring-2 ${
                              isMale ? "ring-blue-100" : isFemale ? "ring-rose-100" : "ring-slate-100"
                            }`}>
                              {person.avatarUrl ? (
                                <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className={`text-base font-bold ${
                                  isMale ? "text-blue-600" : isFemale ? "text-rose-600" : "text-slate-500"
                                }`}>
                                  {person.surname ? person.surname[0] : (person.givenName ? person.givenName[0] : "👤")}
                                </span>
                              )}
                            </div>
                            <div>
                              <Link href={`/projects/${project.id}/persons/${person.id}`} className="font-serif font-bold text-slate-900 group-hover:text-amber-800 transition-colors hover:underline text-[15px]">
                                {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
                              </Link>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{person.generationName || ""} Generation</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isMale ? "bg-blue-50 text-blue-700" : isFemale ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
                          }`}>
                            <span>{isMale ? "👨" : isFemale ? "👩" : "👤"}</span>
                            <span>{isMale ? t("male") : isFemale ? t("female") : t("unknown")}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          📅 {person.birthDate ? person.birthDate : "?"} &mdash; {person.deathDate ? person.deathDate : (person.isLiving ? t("living") : t("deceased"))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            person.isLiving ? "bg-green-50 text-green-700 border border-green-200/40" : "bg-slate-100 text-slate-700"
                          }`}>
                            {person.isLiving ? t("living") : t("deceased")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/projects/${project.id}/persons/${person.id}`} className="inline-flex items-center text-amber-700 hover:text-amber-900 font-bold text-xs group-hover:translate-x-1 transition-transform">
                            {t("detailsLink")} &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FAMILY TREE VIEW TAB */}
      {activeTab === "tree" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t("rootPerson")}</label>
                <select
                  value={rootPersonId}
                  onChange={(e) => setRootPersonId(e.target.value)}
                  className="border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 text-sm font-medium"
                >
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.surname ? `${p.surname} ` : ""}{p.givenName || "Unnamed"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap rounded-md shadow-sm border border-slate-200 p-1 bg-slate-50 gap-1 md:gap-0">
                <button
                  onClick={() => setTreeSubTab("descendant")}
                  className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${
                    treeSubTab === "descendant" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t("descendantTree")}
                </button>
                <button
                  onClick={() => setTreeSubTab("ancestry")}
                  className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${
                    treeSubTab === "ancestry" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t("ancestryTree")}
                </button>
                <button
                  onClick={() => setTreeSubTab("table")}
                  className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${
                    treeSubTab === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t("lineageTable")}
                </button>
                <button
                  onClick={() => setTreeSubTab("verticalTree")}
                  className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${
                    treeSubTab === "verticalTree" ? "bg-white text-red-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🏮 {t("verticalTree")}
                </button>
                <button
                  onClick={() => setTreeSubTab("verticalRegistry")}
                  className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${
                    treeSubTab === "verticalRegistry" ? "bg-white text-red-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  📜 {t("verticalRegistry")}
                </button>
                <button
                  onClick={() => setTreeSubTab("fanChart")}
                  className={`py-1.5 px-3 rounded text-xs font-medium transition-all ${
                    treeSubTab === "fanChart" ? "bg-white text-amber-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  🪭 {language === "zh" ? "世系扇形图" : "Fan Chart"}
                </button>
              </div>
            </div>

            {/* Customization Settings panel for V1.5 Vertical Layouts */}
            {(treeSubTab === "verticalTree" || treeSubTab === "verticalRegistry") && (
              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200/60 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t("filterBranchFounder")} (Branch Root)</label>
                  <select
                    value={selectedBranchId || rootPersonId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-slate-800 font-medium"
                  >
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.surname ? `${p.surname} ` : ""}{p.givenName || "Unnamed"} (Gen {p.generationNumber || "1"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t("generationStart")} (Min Gen)</label>
                  <input
                    type="number"
                    min={1}
                    max={maxGen}
                    value={minGen}
                    onChange={(e) => setMinGen(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t("generationEnd")} (Max Gen)</label>
                  <input
                    type="number"
                    min={minGen}
                    max={50}
                    value={maxGen}
                    onChange={(e) => setMaxGen(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white text-slate-800"
                  />
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeLiving}
                      onChange={(e) => setExcludeLiving(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>🛡️ {t("excludeLiving")}</span>
                  </label>
                  
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold text-xs py-1.5 px-3 rounded shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    🖨️ {t("printLayout")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 min-h-[400px]">
            {persons.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Add individuals in Person List tab to see trees.</div>
            ) : (
              <>
                {treeSubTab === "descendant" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Descendants Output</h4>
                    <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                      {persons.find((p) => p.id === rootPersonId) ? (
                        renderDescendantNode(persons.find((p) => p.id === rootPersonId))
                      ) : (
                        <div className="text-slate-400 italic">Select a Root Person above.</div>
                      )}
                    </div>
                  </div>
                )}

                {treeSubTab === "ancestry" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Paternal/Maternal Ancestors</h4>
                    <div className="border border-slate-100 rounded-lg p-6 bg-slate-50/50 flex justify-center">
                      {renderAncestry(rootPersonId)}
                    </div>
                  </div>
                )}

                {treeSubTab === "table" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Structured Lineage</h4>
                    <div className="p-0 border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 font-medium text-slate-500">{t("generationNumber")}</th>
                            <th className="px-6 py-3 font-medium text-slate-500">{t("name")}</th>
                            <th className="px-6 py-3 font-medium text-slate-500">{t("gender")}</th>
                            <th className="px-6 py-3 font-medium text-slate-500">{t("lifetime")}</th>
                            <th className="px-6 py-3 font-medium text-slate-500">{t("relationPath")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {generateLineageRows().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                {t("noLineageComputed")}
                              </td>
                            </tr>
                          ) : (
                            generateLineageRows().map(({ person, generation, relationPath }) => (
                              <tr key={person.id} className="hover:bg-slate-50/80">
                                <td className="px-6 py-4 font-bold text-blue-600">Gen {generation}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900">
                                  <Link href={`/projects/${project.id}/persons/${person.id}`} className="hover:text-blue-600">
                                    {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
                                  </Link>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                  {person.sex === "MALE" || person.sex === "Male" ? t("male") : person.sex === "FEMALE" || person.sex === "Female" ? t("female") : t("unknown")}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                  {person.birthDate || "?"} to {person.deathDate || (person.isLiving ? t("living") : t("deceased"))}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500 font-mono">{relationPath}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {treeSubTab === "verticalTree" && (
                  <div className="space-y-4 animate-fadeIn">
                    <style dangerouslySetInnerHTML={{__html: `
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #print-pedigree-container, #print-pedigree-container * {
                          visibility: visible;
                        }
                        #print-pedigree-container {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100% !important;
                          background: white !important;
                          color: black !important;
                          border: none !important;
                          padding: 0 !important;
                          margin: 0 !important;
                        }
                        @page {
                          size: landscape;
                          margin: 1cm;
                        }
                      }
                    `}} />
                    <h4 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-2 print:hidden">🏮 苏式行序世系图 (Su-Style Vertical Pedigree Chart)</h4>
                    <div id="print-pedigree-container" className="p-6 border border-red-200/50 rounded-lg bg-[#faf6ee] overflow-x-auto flex flex-row-reverse justify-center min-h-[450px]">
                      {persons.find((p) => p.id === (selectedBranchId || rootPersonId)) ? (
                        renderVerticalTreeNode(persons.find((p) => p.id === (selectedBranchId || rootPersonId)))
                      ) : (
                        <div className="text-slate-400 italic">Select a Branch Founder or Root Person.</div>
                      )}
                    </div>
                  </div>
                )}

                {treeSubTab === "verticalRegistry" && (
                  <div className="space-y-4 animate-fadeIn">
                    <style dangerouslySetInnerHTML={{__html: `
                      @media print {
                        body * {
                          visibility: hidden;
                        }
                        #print-pedigree-container, #print-pedigree-container * {
                          visibility: visible;
                        }
                        #print-pedigree-container {
                          position: absolute;
                          left: 0;
                          top: 0;
                          width: 100% !important;
                          background: white !important;
                          color: black !important;
                          border: none !important;
                          padding: 0 !important;
                          margin: 0 !important;
                        }
                        @page {
                          size: landscape;
                          margin: 1cm;
                        }
                      }
                    `}} />
                    <h4 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-2 print:hidden">📜 欧式房志世系记 (Ou-Style Vertical Pedigree Text Registry)</h4>
                    <div className="p-0 border border-red-200/50 rounded-lg overflow-hidden">
                      {renderVerticalRegistry()}
                    </div>
                  </div>
                )}

                {treeSubTab === "fanChart" && (
                  <div className="space-y-4 animate-fadeIn">
                    <h4 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-2">🪭 世系扇形图 (Radial Fan Chart)</h4>
                    {renderFanChart()}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. PROJECT MEMBERS TAB */}
      {activeTab === "members" && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">{t("membersTab")}</h3>
            {isOwner && (
              <button
                onClick={() => setIsAddingMember(!isAddingMember)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow"
              >
                {isAddingMember ? t("cancel") : t("addMember")}
              </button>
            )}
          </div>

          {isAddingMember && (
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <form onSubmit={handleAddMember} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("memberUsername")}</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter user's exact username"
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t("projectRole")}</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                  >
                    <option value="VIEWER">{t("roleViewer")}</option>
                    <option value="EDITOR">{t("roleEditor")}</option>
                    <option value="ADMIN">{t("roleAdmin")}</option>
                  </select>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm">
                  {t("addMember")}
                </button>
              </form>
            </div>
          )}

          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("memberUsername")}</th>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("emailLabel")}</th>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("projectRole")}</th>
                  {isOwner && <th className="px-6 py-3 font-medium text-slate-500 text-right">{t("actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 4 : 3} className="px-6 py-12 text-center text-slate-500">
                      {t("noMembers")}
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{member.user?.username || "Unknown User"}</td>
                      <td className="px-6 py-4 text-slate-600">{member.user?.email || "N/A"}</td>
                      <td className="px-6 py-4">
                        {isOwner && member.userId !== project.ownerId ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="border border-slate-300 rounded p-1 bg-white text-slate-800 text-xs font-semibold"
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="EDITOR">Editor</option>
                            <option value="VIEWER">Viewer</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            member.role === "OWNER"
                              ? "bg-purple-100 text-purple-800"
                              : member.role === "ADMIN"
                              ? "bg-red-100 text-red-800"
                              : member.role === "EDITOR"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 text-right">
                          {member.role !== "OWNER" && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-500 hover:text-red-700 font-semibold text-xs border border-red-200 hover:border-red-300 rounded px-2 py-1 bg-red-50"
                            >
                              {t("delete")}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DATA TOOLS TAB */}
      {activeTab === "tools" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              ⚙️ {t("dataToolsTitle")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* GEDCOM Import */}
              <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-950 text-base">📤 {t("gedcomImportTitle")}</h4>
                  <p className="text-slate-500 text-xs mt-1.5">{t("gedcomImportDesc")}</p>
                  
                  {importStatus.text && (
                    <p className={`p-2.5 rounded text-xs font-semibold border mt-3 ${
                      importStatus.isError ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
                    }`}>
                      {importStatus.text}
                    </p>
                  )}

                  <form onSubmit={handleGedcomImport} className="mt-4 space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-5 cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                      <span className="text-2xl mb-1">📄</span>
                      <span className="text-xs font-medium text-slate-600 text-center">{gedcomFile ? gedcomFile.name : t("clickToUpload")}</span>
                      <input
                        type="file"
                        accept=".ged"
                        required
                        className="hidden"
                        onChange={(e) => setGedcomFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {gedcomFile && (
                      <button
                        type="submit"
                        disabled={importStatus.loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow"
                      >
                        {importStatus.loading ? t("importing") : t("add")}
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* GEDCOM & GraphML Export */}
              <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-950 text-base">📥 {t("gedcomExportTitle")} / GraphML</h4>
                  <p className="text-slate-500 text-xs mt-1.5">{t("gedcomExportDesc")}</p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleExportGedcom}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow"
                  >
                    <span>📥</span>
                    <span>{t("downloadGedcom")}</span>
                  </button>
                  <button
                    onClick={handleExportGraphml}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-md font-semibold text-xs transition-colors shadow"
                  >
                    <span>📊</span>
                    <span>{t("downloadGraphml")}</span>
                  </button>
                </div>
              </div>

              {/* JSON/CSV backups */}
              <div className="p-6 border border-slate-200 rounded-lg bg-slate-50 flex flex-col justify-between space-y-4 md:col-span-2">
                <div>
                  <h4 className="font-semibold text-slate-950 text-base">💾 {t("backupTitle")}</h4>
                  <p className="text-slate-500 text-xs mt-1.5">{t("backupDesc")}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleExportJson}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-semibold text-xs transition-colors shadow"
                  >
                    <span>💾</span>
                    <span>{t("downloadJson")}</span>
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-md font-semibold text-xs transition-colors shadow"
                  >
                    <span>📊</span>
                    <span>{t("downloadCsv")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. STATISTICS TAB */}
      {activeTab === "stats" && renderStatsTab()}

      {/* 6. MIGRATION TIMELINE TAB */}
      {activeTab === "migration" && renderMigrationTab()}
    </div>
  );
}
