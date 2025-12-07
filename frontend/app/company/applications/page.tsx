'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import ApplicationKanban from '@/components/job/ApplicationKanban';
import { applications } from '@/data';
import { ApplicationStatus } from '@/types';
import { Kanban, List } from 'lucide-react';

export default function CompanyApplicationsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    console.log(`Application ${applicationId} changed to ${newStatus}`);
    // Dans la vraie app, mettre à jour via API
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavBar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-slate-900">Suivi des candidatures</h1>
                <p className="text-slate-600 mt-2">
                  Gérez vos candidatures avec le tableau Kanban
                </p>
              </div>

              {/* Toggle view mode */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                    ${viewMode === 'kanban'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <Kanban className="w-4 h-4" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md transition-colors
                    ${viewMode === 'list'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <List className="w-4 h-4" />
                  Liste
                </button>
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Total candidatures</p>
              <p className="text-3xl font-light text-slate-900 mt-2">
                {applications.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Nouvelles</p>
              <p className="text-3xl font-light text-yellow-600 mt-2">
                {applications.filter(a => a.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">En cours</p>
              <p className="text-3xl font-light text-blue-600 mt-2">
                {applications.filter(a => a.status === 'reviewing').length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Acceptées</p>
              <p className="text-3xl font-light text-green-600 mt-2">
                {applications.filter(a => a.status === 'accepted').length}
              </p>
            </div>
          </div>

          {/* Kanban ou Liste */}
          {viewMode === 'kanban' ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <ApplicationKanban
                applications={applications}
                onStatusChange={handleStatusChange}
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-slate-600 text-center py-12">
                Vue liste en construction...
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
