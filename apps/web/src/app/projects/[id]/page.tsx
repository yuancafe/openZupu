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
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{title}</span>
        {person ? (
          <Link href={`/projects/${project.id}/persons/${person.id}`} className="mt-1 font-medium text-slate-800 hover:text-blue-600 block">
            {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
          </Link>
        ) : (
          <span className="text-slate-400 mt-1 text-sm italic">Unknown</span>
        )}
        {person && (
          <span className="text-[11px] text-slate-500 mt-0.5">
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
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-500">{t("rootPersonLabel")}</span>
            <Link href={`/projects/${project.id}/persons/${self.id}`} className="mt-1 font-bold text-blue-900 hover:text-blue-700 block text-lg">
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
        <div className="flex items-center space-x-2 bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-sm hover:border-slate-300 w-fit">
          {children.length > 0 && (
            <button
              onClick={() => toggleNode(person.id)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none text-xs font-bold w-4 h-4 flex items-center justify-center border border-slate-200 rounded"
            >
              {isExpanded ? "−" : "+"}
            </button>
          )}
          <span className={`w-2.5 h-2.5 rounded-full ${
            person.sex === "MALE" || person.sex === "Male"
              ? "bg-blue-400"
              : person.sex === "FEMALE" || person.sex === "Female"
              ? "bg-rose-400"
              : "bg-slate-400"
          }`} />
          <Link href={`/projects/${project.id}/persons/${person.id}`} className="font-semibold text-slate-800 hover:text-blue-600">
            {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
          </Link>
          {person.birthDate && (
            <span className="text-xs text-slate-400">
              * {person.birthDate.split("-")[0]}
            </span>
          )}
          {spouses.length > 0 && (
            <span className="text-xs text-slate-400 italic">
              ({t("spouseLabel")}: {spouses.map((s: any) => `${s.surname || ""}${s.givenName || "Unnamed"}`).join(", ")})
            </span>
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

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{project.name}</h2>
        <p className="text-slate-500 mt-2 text-lg">{project.description || t("noProjects")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("list")}
          className={`py-2 px-4 font-medium text-sm transition-all ${
            activeTab === "list" ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          📁 {t("personListTab")}
        </button>
        <button
          onClick={() => setActiveTab("tree")}
          className={`py-2 px-4 font-medium text-sm transition-all ${
            activeTab === "tree" ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🌿 {t("familyTreeTab")}
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`py-2 px-4 font-medium text-sm transition-all ${
            activeTab === "members" ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          👥 {t("membersTab")}
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`py-2 px-4 font-medium text-sm transition-all ${
            activeTab === "tools" ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-700"
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

          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("name")}</th>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("gender")}</th>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("lifetime")}</th>
                  <th className="px-6 py-3 font-medium text-slate-500">{t("status")}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {persons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      {t("noPersons")}
                    </td>
                  </tr>
                ) : (
                  persons.map((person) => (
                    <tr key={person.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {person.surname ? `${person.surname} ` : ""}{person.givenName || "Unnamed"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {person.sex === "MALE" || person.sex === "Male" ? t("male") : person.sex === "FEMALE" || person.sex === "Female" ? t("female") : t("unknown")}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {person.birthDate || "?"} to {person.deathDate || (person.isLiving ? t("living") : t("deceased"))}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          person.isLiving ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          {person.isLiving ? t("living") : t("deceased")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/projects/${project.id}/persons/${person.id}`} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                          {t("detailsLink")} &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FAMILY TREE VIEW TAB */}
      {activeTab === "tree" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            <div className="flex rounded-md shadow-sm border border-slate-200 p-1 bg-slate-50">
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
            </div>
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
    </div>
  );
}
