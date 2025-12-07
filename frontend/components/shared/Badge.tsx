import { ApplicationStatus } from '@/types';

interface BadgeProps {
  status: ApplicationStatus;
}

const statusConfig = {
  pending: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-800',
  },
  reviewing: {
    label: 'En cours',
    className: 'bg-blue-100 text-blue-800',
  },
  rejected: {
    label: 'Refusé',
    className: 'bg-red-100 text-red-800',
  },
  accepted: {
    label: 'Accepté',
    className: 'bg-green-100 text-green-800',
  },
};

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
