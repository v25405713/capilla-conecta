import React, { useState, useEffect } from 'react';
import { User, Report, BARRIOS_CAPILLA } from '../types';
import { api } from '../services/api';
import {
  Shield,
  Flag,
  Users,
  Database,
  Trash2,
  Check,
  AlertTriangle,
  UserX,
  Code,
  Copy,
  RefreshCw
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onRefreshUser?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'users' | 'database'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [schemaSql, setSchemaSql] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getReports().catch(() => ({ reports: [] })),
      api.getDemoUsers().catch(() => ({ users: [] })),
      api.getDatabaseSchema().catch(() => ({ schemaSql: '', stats: null })),
    ]).then(([repRes, usrRes, schRes]) => {
      setReports(repRes.reports || []);
      setUsers(usrRes.users || []);
      setSchemaSql(schRes.schemaSql || '');
      setStats(schRes.stats || null);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (reportId: string, action: 'dismiss' | 'delete_item' | 'ban_author') => {
    try {
      await api.resolveReport(reportId, action, currentUser.id);
      setReports(prev => prev.filter(r => r.id !== reportId));
      setActionToast('Acción de moderación aplicada con éxito.');
      setTimeout(() => setActionToast(null), 3000);
      loadData();
    } catch (err: any) {
      setActionToast(err.message || 'Error al aplicar moderación.');
      setTimeout(() => setActionToast(null), 3500);
    }
  };

  const handleCopySql = () => {
    if (!schemaSql) return;
    navigator.clipboard.writeText(schemaSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel de Coordinación & Moderación</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Moderación Comunitaria de Capilla del Monte
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de reportes vecinales, normas de convivencia y auditoría de base de datos
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title="Recargar datos"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Navegación Interna */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'reports'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Reportes Pendientes ({reports.filter(r => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'users'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Vecinos Registrados</span>
        </button>

        <button
          onClick={() => setActiveSubTab('database')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'database'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Esquema SQL & Base de Datos</span>
        </button>
      </div>

      {/* Contenido según Pestaña */}
      {activeSubTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-slate-400">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No hay reportes de moderación pendientes
              </p>
              <p className="text-xs text-slate-400 mt-1">
                La comunidad de Capilla del Monte convive con tranquilidad serrana.
              </p>
            </div>
          ) : (
            reports.map(rep => (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      Motivo: {rep.reason}
                    </span>
                    <span className="text-xs text-slate-500">
                      Reportado por <b>{rep.reporterName}</b>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(rep.createdAt).toLocaleString()}
                  </span>
                </div>

                {rep.itemContentPreview && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                    "{rep.itemContentPreview}"
                  </div>
                )}

                {/* Acciones de Moderador */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleResolve(rep.id, 'dismiss')}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Descartar Reporte
                  </button>
                  <button
                    onClick={() => handleResolve(rep.id, 'delete_item')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar Elemento</span>
                  </button>
                  <button
                    onClick={() => handleResolve(rep.id, 'ban_author')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5 text-red-400" />
                    <span>Suspender Vecino</span>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Vecino</th>
                  <th className="p-3">Barrio</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="text-lg">{u.avatarEmoji}</span>
                      <span>{u.formattedName}</span>
                    </td>
                    <td className="p-3 capitalize">{u.neighborhoodId}</td>
                    <td className="p-3 text-slate-500">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      {u.phoneVisible ? '✅ Visible' : '🔒 Privado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'database' && (
        <div className="space-y-4">
          {/* Métricas del Sistema */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Total Vecinos</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.usersCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Anuncios Activos</span>
                <span className="text-2xl font-bold text-teal-600">{stats.activePostsCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Mensajes en Chat</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.messagesCount}</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 block">Barrios Activos</span>
                <span className="text-2xl font-bold text-amber-600">20</span>
              </div>
            </div>
          )}

          {/* Visor del Esquema SQL */}
          <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 border border-slate-800 font-mono text-xs shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-teal-400 font-bold flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                schema.sql (PostgreSQL / SQLite Compatible)
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer transition"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? '¡Copiado!' : 'Copiar DDL SQL'}</span>
              </button>
            </div>
            <pre className="max-h-96 overflow-y-auto leading-relaxed text-slate-300">
              {schemaSql || 'Cargando esquema...'}
            </pre>
          </div>
        </div>
      )}

      {/* Toast no intrusivo */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {actionToast}
        </div>
      )}

    </div>
  );
};
