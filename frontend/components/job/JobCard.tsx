import Link from 'next/link';
import { MapPin, Calendar, Briefcase, Euro } from 'lucide-react';

// Flexible interface that works with both types/JobOffer and services/FrontendJobOffer
interface JobCardOffer {
  id: string;
  title: string;
  description?: string;
  company?: {
    name: string;
  };
  contractType?: string;
  skills?: string[];
  required_skills?: string[];
  location?: string;
  duration?: string;
  salary?: string;
}

interface JobCardProps {
  offer: JobCardOffer;
  viewPath?: string;
}

export default function JobCard({ offer, viewPath }: JobCardProps) {
  const href = viewPath || `/candidate/offers/${offer.id}`;

  const skills = (offer.skills && offer.skills.length > 0
    ? offer.skills
    : offer.required_skills) || [];

  return (
    <Link href={href}>
      <div className="bg-white p-8 border border-slate-200 hover:border-slate-900 transition-all cursor-pointer group">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-light text-slate-900 mb-2 group-hover:text-slate-700 transition">
              {offer.title}
            </h3>
            <p className="text-slate-600 font-light">{offer.company?.name || 'Entreprise'}</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-light uppercase tracking-wider">
            {offer.contractType === 'stage' ? 'Stage' : 'Alternance'}
          </span>
        </div>

        {/* Description courte */}
        <p className="text-slate-600 text-sm font-light mb-6 line-clamp-2 leading-relaxed">
          {offer.description}
        </p>

        {/* Compétences */}
        <div className="flex flex-wrap gap-2 mb-6">
          {skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-light"
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-xs font-light">
              +{skills.length - 3}
            </span>
          )}
        </div>

        {/* Informations */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-light border-t border-slate-100 pt-4">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
            {offer.location || 'Non spécifié'}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
            {offer.duration}
          </div>
          {offer.salary && (
            <div className="flex items-center">
              <Euro className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              {offer.salary}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
