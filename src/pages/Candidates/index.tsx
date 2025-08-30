import React, { useState } from 'react';
import { Candidate } from '../../types';
import { 
  CandidateList, 
  CandidateProfile, 
  CandidateComparison, 
  BulkActionsMenu 
} from '../../components/candidates';
import { Button } from '../../components/ui';
import { ExportButton, ExportDialog } from '../../components/export';
import { useExport } from '../../hooks/useExport';
import { 
  UserGroupIcon,
  ScaleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Candidates: React.FC = () => {
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [profileCandidateId, setProfileCandidateId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { 
    isExportDialogOpen, 
    exportType, 
    exportFilters, 
    openExportDialog, 
    closeExportDialog, 
    handleExportComplete,
    getExportFields 
  } = useExport({
    onExportComplete: (downloadUrl) => {
      // Auto-download the file
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'candidates_export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  });

  const handleCandidateSelect = (candidate: Candidate) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidate.id)) {
      newSelected.delete(candidate.id);
    } else {
      newSelected.add(candidate.id);
    }
    setSelectedCandidates(newSelected);
  };

  const handleViewProfile = (candidate: Candidate) => {
    setProfileCandidateId(candidate.id);
  };

  const handleGenerateMessage = (candidate: Candidate) => {
    // TODO: Implement in task 9.1
    console.log('Generate message for:', candidate.name);
  };

  const handleBulkActions = () => {
    setShowBulkActions(true);
  };

  const handleBulkActionsSuccess = () => {
    // Refresh the candidate list or show success message
    setSelectedCandidates(new Set());
    setSelectionMode(false);
  };

  const handleCompare = () => {
    setShowComparison(true);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (!selectionMode) {
      setSelectedCandidates(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <UserGroupIcon className="w-8 h-8 mr-3 text-blue-600" />
                Candidates
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and review sourced candidates with advanced filtering and bulk operations.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {selectionMode && selectedCandidates.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedCandidates.size} selected
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Cog6ToothIcon className="w-4 h-4" />}
                    onClick={handleBulkActions}
                  >
                    Bulk Actions
                  </Button>
                  {selectedCandidates.size >= 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<ScaleIcon className="w-4 h-4" />}
                      onClick={handleCompare}
                    >
                      Compare
                    </Button>
                  )}
                </>
              )}
              
              <ExportButton
                type="candidates"
                variant="dropdown"
                size="sm"
                filters={selectedCandidates.size > 0 ? { ids: Array.from(selectedCandidates) } : {}}
                onExportComplete={handleExportComplete}
              />
              
              <Button
                variant={selectionMode ? 'primary' : 'outline'}
                size="sm"
                onClick={toggleSelectionMode}
              >
                {selectionMode ? 'Exit Selection' : 'Select Multiple'}
              </Button>
            </div>
          </div>
        </div>

        {/* Candidate List */}
        <CandidateList
          onCandidateSelect={handleCandidateSelect}
          onViewProfile={handleViewProfile}
          onGenerateMessage={handleGenerateMessage}
          selectedCandidates={selectedCandidates}
          selectable={selectionMode}
        />

        {/* Candidate Profile Modal */}
        {profileCandidateId && (
          <CandidateProfile
            candidateId={profileCandidateId}
            isOpen={!!profileCandidateId}
            onClose={() => setProfileCandidateId(null)}
            onGenerateMessage={handleGenerateMessage}
            onCompare={(candidate) => {
              setSelectedCandidates(new Set([candidate.id]));
              setSelectionMode(true);
            }}
          />
        )}

        {/* Candidate Comparison Modal */}
        <CandidateComparison
          candidateIds={Array.from(selectedCandidates)}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          onViewProfile={handleViewProfile}
          onGenerateMessage={handleGenerateMessage}
        />

        {/* Bulk Actions Menu */}
        {showBulkActions && (
          <BulkActionsMenu
            selectedCandidateIds={Array.from(selectedCandidates)}
            onClose={() => setShowBulkActions(false)}
            onSuccess={handleBulkActionsSuccess}
          />
        )}

        {/* Export Dialog */}
        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={closeExportDialog}
          type={exportType}
          title="Candidates"
          availableFields={getExportFields(exportType)}
          filters={exportFilters}
          onExportComplete={handleExportComplete}
        />
      </div>
    </div>
  );
};

export default Candidates;