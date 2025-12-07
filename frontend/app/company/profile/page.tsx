'use client';

import { useState } from 'react';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { companies } from '@/data/index';
import { Building2, Mail, Phone, User, Briefcase, Users, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CompanyProfilePage() {
  // Simuler l'entreprise connectée
  const initialCompany = companies[0];
  
  const [formData, setFormData] = useState({
    name: initialCompany.name,
    sector: initialCompany.sector,
    size: initialCompany.size,
    contactName: initialCompany.contactName,
    contactEmail: initialCompany.contactEmail,
    contactPhone: initialCompany.contactPhone,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    alert('Profil mis à jour avec succès !');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Profil Entreprise</h1>
            <p className="text-gray-600">
              Gérez les informations de votre entreprise
            </p>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-slate-900">Informations de l'entreprise</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: initialCompany.name,
                        sector: initialCompany.sector,
                        size: initialCompany.size,
                        contactName: initialCompany.contactName,
                        contactEmail: initialCompany.contactEmail,
                        contactPhone: initialCompany.contactPhone,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Enregistrer
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations entreprise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Nom de l'entreprise
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Secteur d'activité
                  </label>
                  <input
                    name="sector"
                    type="text"
                    value={formData.sector}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Taille de l'entreprise
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  >
                    <option value="1-50">1-50 employés</option>
                    <option value="50-250">50-250 employés</option>
                    <option value="250-1000">250-1000 employés</option>
                    <option value="1000-5000">1000-5000 employés</option>
                    <option value="5000-10000">5000-10000 employés</option>
                    <option value="10000+">10000+ employés</option>
                  </select>
                </div>
              </div>

              {/* Séparateur */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Interlocuteur principal
                </h3>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Nom et prénom
                </label>
                <input
                  name="contactName"
                  type="text"
                  value={formData.contactName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Téléphone
                  </label>
                  <input
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Premium Section */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mt-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">🎯 Passez en Premium</h2>
                <p className="text-blue-100 mb-6">
                  Débloquez des fonctionnalités exclusives pour optimiser vos recrutements
                </p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>Accès complet à la CVthèque avec filtres avancés</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>Recommandations intelligentes de candidats similaires</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>Visibilité prioritaire de vos offres</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-white rounded-full mt-2 mr-3"></span>
                    <span>Support dédié et statistiques avancées</span>
                  </li>
                </ul>

                <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold">
                  Découvrir Premium
                </button>
              </div>
            </div>
          </div>

          {/* Section RGPD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Protection des données (RGPD)</h3>
                  <p className="text-sm text-gray-600">Gérez vos données personnelles, exportez-les ou supprimez votre compte</p>
                </div>
              </div>
              <Link
                href="/company/gdpr"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                Paramètres RGPD
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
