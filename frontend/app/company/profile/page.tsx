'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { getCurrentCompany, updateCompanyProfile, Company } from '@/services/companyService';
import { Building2, Mail, Phone, User, Briefcase, Users, Shield, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CompanyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    size: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    website: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await getCurrentCompany();
        if (!companyData) {
          router.push('/login-company');
          return;
        }
        setCompany(companyData);
        setFormData({
          name: companyData.name || '',
          sector: companyData.sector || '',
          size: companyData.size || '',
          contact_name: companyData.contact_name || '',
          contact_email: companyData.contact_email || '',
          contact_phone: companyData.contact_phone || '',
          description: companyData.description || '',
          website: companyData.website || '',
        });
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    const result = await updateCompanyProfile(company.id, formData);
    setSaving(false);

    if (result.success) {
      setIsEditing(false);
      // Reload company data
      const updated = await getCurrentCompany();
      if (updated) setCompany(updated);
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

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
                      if (company) {
                        setFormData({
                          name: company.name || '',
                          sector: company.sector || '',
                          size: company.size || '',
                          contact_name: company.contact_name || '',
                          contact_email: company.contact_email || '',
                          contact_phone: company.contact_phone || '',
                          description: company.description || '',
                          website: company.website || '',
                        });
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
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
                  name="contact_name"
                  type="text"
                  value={formData.contact_name}
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
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
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
                    name="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
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
