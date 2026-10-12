import React, { useState, useEffect } from 'react';
import { INITIAL_REUSABLE_ASSETS } from '../data/mockExperiences';
import { RobloxExperience, ReusableAsset } from '../types';

interface ExperiencesAndAssetsProps {
  userEmail?: string;
  onNavigateToTab: (tab: any) => void;
  onOpenExperienceInCopilot?: (exp: RobloxExperience) => void;
  onProjectsUpdated?: (projects: RobloxExperience[]) => void;
}

export const ExperiencesAndAssets: React.FC<ExperiencesAndAssetsProps> = ({
  userEmail = 'nxd053750@gmail.com',
  onNavigateToTab,
  onOpenExperienceInCopilot,
  onProjectsUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'assets'>('projects');
  const [projects, setProjects] = useState<RobloxExperience[]>(() => {
    try {
      const saved = localStorage.getItem(`pablito_projects_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assets] = useState<ReusableAsset[]>(INITIAL_REUSABLE_ASSETS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAssetCode, setActiveAssetCode] = useState<ReusableAsset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPlaceId, setNewPlaceId] = useState('');
  const [newCategory, setNewCategory] = useState<'beta' | 'production' | 'published'>('beta');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch user projects from backend
  const fetchUserProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects?userEmail=${encodeURIComponent(userEmail)}`, {
        headers: { 'x-user-email': userEmail },
      });
      if (res.ok) {
        const data = await res.json();
        const userProjects: RobloxExperience[] = data.projects || [];
        setProjects(userProjects);
        localStorage.setItem(`pablito_projects_${userEmail}`, JSON.stringify(userProjects));
        if (onProjectsUpdated) onProjectsUpdated(userProjects);
      }
    } catch (err) {
      console.warn('Error fetching projects from backend, using local cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProjects();
  }, [userEmail]);

  // Create Project Handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          placeId: newPlaceId ? parseInt(newPlaceId, 10) : undefined,
          category: newCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created: RobloxExperience = data.project;
        const updated = [created, ...projects];
        setProjects(updated);
        localStorage.setItem(`pablito_projects_${userEmail}`, JSON.stringify(updated));
        if (onProjectsUpdated) onProjectsUpdated(updated);

        showToast('✓ Proyecto creado con éxito');
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewPlaceId('');
      } else {
        showToast('Error al crear el proyecto en el servidor');
      }
    } catch {
      // Fallback local create
      const fallbackProject: RobloxExperience = {
        id: `proj_${Date.now()}`,
        ownerEmail: userEmail,
        title: newTitle.trim(),
        description: newDescription.trim(),
        placeId: newPlaceId ? parseInt(newPlaceId, 10) : undefined,
        category: newCategory,
        createdAt: new Date().toISOString(),
        status: 'En desarrollo',
        version: '0.1.0',
      };
      const updated = [fallbackProject, ...projects];
      setProjects(updated);
      localStorage.setItem(`pablito_projects_${userEmail}`, JSON.stringify(updated));
      if (onProjectsUpdated) onProjectsUpdated(updated);
      showToast('✓ Proyecto guardado localmente');
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${title}"?`)) return;

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail },
      });
    } catch {}

    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem(`pablito_projects_${userEmail}`, JSON.stringify(updated));
    if (onProjectsUpdated) onProjectsUpdated(updated);
    showToast('✓ Proyecto eliminado');
  };

  const handleCopyCode = (code: string, title: string) => {
    navigator.clipboard.writeText(code);
    showToast(`✓ Código de ${title} copiado al portapapeles`);
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = assets.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full min-h-full bg-[#0c0d10] text-[#dfe2f0] p-4 md:p-8 space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#14151a] border border-[#d6403a] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono-code animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#d6403a]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Code Modal for Luau Asset Templates */}
      {activeAssetCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#14151a] border border-[#262832] rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262832] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-xl">code</span>
                <h3 className="text-sm font-bold text-white font-mono-code">{activeAssetCode.title}</h3>
              </div>
              <button
                onClick={() => setActiveAssetCode(null)}
                className="text-[#8a8f9d] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 rounded-xl bg-[#090a0d] border border-[#262832] font-mono-code text-xs text-[#dfe2f0] max-h-96 overflow-y-auto leading-relaxed">
              <pre>{activeAssetCode.code}</pre>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#8a8f9d] font-mono-code">{activeAssetCode.sizeOrLines}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveAssetCode(null)}
                  className="px-4 py-2 rounded-lg bg-[#1f2128] text-xs text-[#8a8f9d] hover:text-white cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    handleCopyCode(activeAssetCode.code, activeAssetCode.title);
                    setActiveAssetCode(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#d6403a] hover:bg-[#e04e48] text-white font-bold text-xs cursor-pointer"
                >
                  Copiar Código
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#14151a] border border-[#262832] rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262832] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d6403a] text-xl">add_circle</span>
                <h3 className="text-base font-bold text-white">Nuevo Proyecto de Roblox Studio</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8a8f9d] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-[#8a8f9d] font-semibold mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Battle Arena, Tycoon Espacial, Obby..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0d10] border border-[#262832] text-white focus:outline-none focus:border-[#d6403a]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[#8a8f9d] font-semibold mb-1">Descripción corta</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe las mecánicas principales o el objetivo del juego..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0c0d10] border border-[#262832] text-white focus:outline-none focus:border-[#d6403a] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8a8f9d] font-semibold mb-1">Place ID (Opcional)</label>
                  <input
                    type="number"
                    value={newPlaceId}
                    onChange={(e) => setNewPlaceId(e.target.value)}
                    placeholder="Ej: 123456789"
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0d10] border border-[#262832] text-white focus:outline-none focus:border-[#d6403a]"
                  />
                </div>

                <div>
                  <label className="block text-[#8a8f9d] font-semibold mb-1">Estado</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0c0d10] border border-[#262832] text-white focus:outline-none focus:border-[#d6403a]"
                  >
                    <option value="beta">En Desarrollo</option>
                    <option value="production">Pruebas / Staging</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262832]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1f2128] text-xs font-semibold text-[#8a8f9d] hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-[#d6403a]/25 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#14151a] border border-[#262832] shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Mis Proyectos & Recursos</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#d6403a]/15 text-[#ffb4ab] border border-[#d6403a]/30 font-mono-code">
              Pablito Studio
            </span>
          </div>
          <p className="text-xs text-[#8a8f9d] mt-1">
            Solo tus proyectos reales creados o vinculados a tu cuenta ({userEmail}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tab navigation */}
          <div className="flex items-center bg-[#0c0d10] p-1 rounded-xl border border-[#262832] text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('projects')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'projects'
                  ? 'bg-[#1a1c23] text-white font-bold border border-[#262832]'
                  : 'text-[#8a8f9d] hover:text-white'
              }`}
            >
              Proyectos Personales ({projects.length})
            </button>
            <button
              onClick={() => setActiveSubTab('assets')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'assets'
                  ? 'bg-[#1a1c23] text-white font-bold border border-[#262832]'
                  : 'text-[#8a8f9d] hover:text-white'
              }`}
            >
              Plantillas Luau ({assets.length})
            </button>
          </div>

          {activeSubTab === 'projects' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#d6403a]/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Nuevo Proyecto</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="material-symbols-outlined text-base text-[#8a8f9d] absolute left-3.5 top-2.5">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeSubTab === 'projects' ? 'Buscar entre mis proyectos...' : 'Buscar plantilla Luau (DataStore, Hitbox, etc.)...'}
          className="w-full pl-10 pr-4 py-2 bg-[#14151a] border border-[#262832] rounded-xl text-xs text-white placeholder-[#8a8f9d] focus:outline-none focus:border-[#d6403a]"
        />
      </div>

      {/* PROJECTS SUB-TAB */}
      {activeSubTab === 'projects' && (
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#8a8f9d] font-mono-code">
              Cargando tus proyectos desde el servidor...
            </div>
          ) : filteredProjects.length === 0 ? (
            /* CLEAN EMPTY STATE */
            <div className="p-12 rounded-2xl bg-[#14151a] border border-[#262832] flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-[#1f2128] border border-[#262832] flex items-center justify-center text-[#d6403a]">
                <span className="material-symbols-outlined text-3xl">folder_open</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Aún no tienes proyectos guardados</h3>
                <p className="text-xs text-[#8a8f9d] max-w-sm leading-relaxed">
                  Crea tu primer proyecto o vincula un Place de Roblox Studio para comenzar a programar con Pablito Studio.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#d6403a] hover:bg-[#e04e48] text-white text-xs font-bold shadow-md shadow-[#d6403a]/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Crear mi primer proyecto</span>
              </button>
            </div>
          ) : (
            /* REAL USER PROJECTS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-[#14151a] border border-[#262832] hover:border-[#d6403a]/50 flex flex-col justify-between gap-4 transition-all shadow-md group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-[#1f2128] text-[10px] font-mono-code text-[#ffb4ab] border border-[#262832]">
                        {proj.category === 'published' ? 'Publicado' : proj.category === 'production' ? 'Pruebas' : 'Desarrollo'}
                      </span>
                      {proj.placeId && (
                        <span className="text-[10px] font-mono-code text-[#8a8f9d]">
                          PlaceID: {proj.placeId}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#ffb4ab] transition-colors">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-[#8a8f9d] line-clamp-2 leading-relaxed">
                      {proj.description || 'Sin descripción añadida.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#262832] flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="text-xs text-[#8a8f9d] hover:text-[#ffb4ab] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Eliminar proyecto"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      <span>Eliminar</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenExperienceInCopilot) onOpenExperienceInCopilot(proj);
                        onNavigateToTab('workspace-copilot');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1f2128] hover:bg-[#d6403a] text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">smart_toy</span>
                      <span>Abrir en Copilot</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REUSABLE ASSETS SUB-TAB */}
      {activeSubTab === 'assets' && (
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-[#14151a] border border-[#262832] text-xs text-[#8a8f9d] flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-[#4cd7f6]">info</span>
            <span>
              Estas son plantillas modulares oficiales creadas por Pablito Studio listas para insertar en tus proyectos de Roblox Studio.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-5 rounded-2xl bg-[#14151a] border border-[#262832] hover:border-[#4cd7f6]/40 flex flex-col justify-between gap-4 transition-all shadow-md"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-[#1f2128] text-[10px] font-mono-code text-[#4cd7f6]">
                      {asset.type}
                    </span>
                    <span className="text-[10px] font-mono-code text-[#8a8f9d]">
                      {asset.sizeOrLines}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-mono-code">
                    {asset.title}
                  </h3>
                  <p className="text-xs text-[#8a8f9d] line-clamp-2 leading-relaxed">
                    {asset.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#262832] flex items-center justify-between">
                  <button
                    onClick={() => setActiveAssetCode(asset)}
                    className="text-xs text-[#4cd7f6] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    <span>Ver código</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode(asset.code, asset.title)}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2128] hover:bg-[#262832] text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">content_copy</span>
                    <span>Copiar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
