import { Candidate } from '@/types';
import { GraduationCap, MapPin, Phone, Mail, FileText } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onViewProfile?: () => void;
}

export default function CandidateCard({ candidate, onViewProfile }: CandidateCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900">
            {candidate.firstName} {candidate.lastName}
          </h3>
          <p className="text-blue-600 font-medium">{candidate.school}</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {candidate.studyLevel}
        </span>
      </div>

      {/* Spécialisation */}
      <div className="flex items-center text-gray-700 mb-4">
        <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
        <span className="font-medium">{candidate.specialization}</span>
      </div>

      {/* Informations */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          {candidate.locations?.join(', ') || 'Non spécifié'}
        </div>
        {candidate.alternanceRhythm && (
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            {candidate.alternanceRhythm}
          </div>
        )}
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2" />
          {candidate.email}
        </div>
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2" />
          {candidate.phone}
        </div>
      </div>

      {/* Actions */}
      {onViewProfile && (
        <button
          onClick={onViewProfile}
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Voir le profil complet
        </button>
      )}
    </div>
  );
}
