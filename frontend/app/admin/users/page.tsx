'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { candidates, companies } from '@/data';
import { Users, Building2, Search, Filter, MoreVertical } from 'lucide-react';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'companies'>('candidates');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = candidates.filter(
    (c) =>
      searchTerm === '' ||
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter(
    (c) =>
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="admin" />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion des utilisateurs</h1>
            <p className="text-gray-600">
              Consultez et gérez les comptes candidats et entreprises
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('candidates')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                    activeTab === 'candidates'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="inline h-5 w-5 mr-2" />
                  Candidats ({candidates.length})
                </button>
                <button
                  onClick={() => setActiveTab('companies')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                    activeTab === 'companies'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 className="inline h-5 w-5 mr-2" />
                  Entreprises ({companies.length})
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    activeTab === 'candidates'
                      ? 'Rechercher un candidat...'
                      : 'Rechercher une entreprise...'
                  }
                />
              </div>
            </div>

            {/* Candidates Table */}
            {activeTab === 'candidates' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        École
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Niveau
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Localisation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {candidate.firstName} {candidate.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {candidate.specialization}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {candidate.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {candidate.school}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {candidate.studyLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {candidate.locations?.join(', ') || 'Non spécifié'}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Companies Table */}
            {activeTab === 'companies' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Entreprise
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Secteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Taille
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {company.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {company.sector}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {company.size}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {company.contactName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {company.contactEmail}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
