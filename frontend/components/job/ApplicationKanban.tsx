'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Application, ApplicationStatus } from '@/types';
import { Mail, Phone, GraduationCap, Calendar, ExternalLink } from 'lucide-react';
// Badge simple pour affichage du niveau d'études

interface KanbanColumn {
  id: ApplicationStatus;
  title: string;
  applications: Application[];
}

interface ApplicationKanbanProps {
  applications: Application[];
  onStatusChange?: (applicationId: string, newStatus: ApplicationStatus) => void;
}

export default function ApplicationKanban({ applications, onStatusChange }: ApplicationKanbanProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'pending',
      title: 'Nouvelles',
      applications: applications.filter(app => app.status === 'pending'),
    },
    {
      id: 'reviewing',
      title: 'En cours d\'examen',
      applications: applications.filter(app => app.status === 'reviewing'),
    },
    {
      id: 'accepted',
      title: 'Acceptées',
      applications: applications.filter(app => app.status === 'accepted'),
    },
    {
      id: 'rejected',
      title: 'Refusées',
      applications: applications.filter(app => app.status === 'rejected'),
    },
  ]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Pas de changement si déposé hors d'une zone ou au même endroit
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    const sourceColumnIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColumnIndex = columns.findIndex(col => col.id === destination.droppableId);

    const sourceColumn = columns[sourceColumnIndex];
    const destColumn = columns[destColumnIndex];

    const sourceApps = Array.from(sourceColumn.applications);
    const [movedApp] = sourceApps.splice(source.index, 1);

    // Mise à jour du statut de l'application
    const updatedApp = { ...movedApp, status: destColumn.id };

    if (source.droppableId === destination.droppableId) {
      // Déplacement dans la même colonne
      sourceApps.splice(destination.index, 0, updatedApp);
      const newColumns = [...columns];
      newColumns[sourceColumnIndex] = {
        ...sourceColumn,
        applications: sourceApps,
      };
      setColumns(newColumns);
    } else {
      // Déplacement vers une autre colonne
      const destApps = Array.from(destColumn.applications);
      destApps.splice(destination.index, 0, updatedApp);

      const newColumns = [...columns];
      newColumns[sourceColumnIndex] = {
        ...sourceColumn,
        applications: sourceApps,
      };
      newColumns[destColumnIndex] = {
        ...destColumn,
        applications: destApps,
      };
      setColumns(newColumns);

      // Callback pour synchroniser avec le backend
      if (onStatusChange) {
        onStatusChange(draggableId, destColumn.id);
      }
    }
  };

  const getColumnColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-100 border-slate-300';
      case 'reviewing':
        return 'bg-blue-50 border-blue-300';
      case 'accepted':
        return 'bg-green-50 border-green-300';
      case 'rejected':
        return 'bg-red-50 border-red-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* En-tête de colonne */}
            <div className={`px-4 py-3 rounded-t-lg border-2 ${getColumnColor(column.id)}`}>
              <h3 className="font-semibold text-slate-900">
                {column.title}
                <span className="ml-2 text-sm font-normal text-slate-600">
                  ({column.applications.length})
                </span>
              </h3>
            </div>

            {/* Zone de drop */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    flex-1 p-4 space-y-3 rounded-b-lg border-2 border-t-0 min-h-[600px]
                    ${getColumnColor(column.id)}
                    ${snapshot.isDraggingOver ? 'bg-opacity-70' : ''}
                  `}
                >
                  {column.applications.map((application, index) => (
                    <Draggable
                      key={application.id}
                      draggableId={application.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            bg-white rounded-lg p-4 shadow-sm border border-slate-200
                            hover:shadow-md transition-shadow cursor-move
                            ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}
                          `}
                        >
                          {/* Offre */}
                          <div className="mb-3 pb-3 border-b border-slate-200">
                            <h4 className="font-medium text-slate-900 text-sm line-clamp-1">
                              {application.offer.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {application.offer.company.name}
                            </p>
                          </div>

                          {/* Candidat */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-slate-400" />
                              <p className="text-sm font-medium text-slate-900">
                                {application.candidate.firstName} {application.candidate.lastName}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <p className="text-xs text-slate-600 truncate">
                                {application.candidate.email}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <p className="text-xs text-slate-600">
                                {application.candidate.phone}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <p className="text-xs text-slate-600">
                                {new Date(application.applicationDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {/* Badge niveau */}
                          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                              {application.candidate.studyLevel}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Ouvrir le détail du candidat
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {column.applications.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                      Aucune candidature
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
