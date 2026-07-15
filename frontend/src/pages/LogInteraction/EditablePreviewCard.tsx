import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Edit3, Trash2, Calendar, Building2, User, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateEditablePreview } from '@/store/slices/chatSlice';
import { createInteraction } from '@/store/slices/interactionSlice';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const EditablePreviewCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { editablePreview, latestConfidence, isStreaming } = useAppSelector((state) => state.chat);
  const { hcps } = useAppSelector((state) => state.hcp);

  if (!editablePreview && !isStreaming) {
    return (
      <Card className="bg-slate-50/70 border-dashed border-2 border-slate-300 flex flex-col items-center justify-center p-8 text-center h-full min-h-[380px]">
        <div className="w-14 h-14 rounded-3xl bg-blue-100/80 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <Sparkles className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-800">AI Structured Preview</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
          Type or speak into the chat on the left. The LangGraph agent will automatically extract entities, calculate confidence, and generate an editable card here.
        </p>
      </Card>
    );
  }

  if (isStreaming && !editablePreview) {
    return (
      <Card className="bg-white border border-blue-200 shadow-premium p-8 flex flex-col items-center justify-center text-center h-full min-h-[380px] animate-pulse">
        <Sparkles className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h4 className="text-base font-bold text-slate-800">LangGraph Agent Processing...</h4>
        <p className="text-xs text-slate-500 mt-1">Executing NER extraction and checking duplicate logs via Groq model.</p>
      </Card>
    );
  }

  if (!editablePreview) return null;

  const handleFieldChange = (field: string, val: any) => {
    dispatch(updateEditablePreview({ [field]: val }));
  };

  const handleSaveToDatabase = async () => {
    try {
      // Find matching HCP ID
      let hcpId = editablePreview.hcp_id || 1;
      if (editablePreview.hcp_name) {
        const found = hcps.find(h => h.name.toLowerCase().includes(editablePreview.hcp_name!.toLowerCase()));
        if (found) hcpId = found.id;
      }

      const payload = {
        hcp_id: hcpId,
        user_id: 1,
        interaction_date: editablePreview.interaction_date || new Date().toISOString().split('T')[0],
        interaction_type: editablePreview.interaction_type || 'Visit',
        duration_minutes: editablePreview.duration_minutes || 30,
        discussion_topics: editablePreview.notes || '',
        products_discussed: editablePreview.products_discussed || [],
        samples_given: editablePreview.samples_given || [],
        follow_up_required: editablePreview.follow_up_required || false,
        follow_up_date: editablePreview.follow_up_date,
        notes: editablePreview.notes || '',
        ai_summary: editablePreview.ai_summary || '',
        sentiment: editablePreview.sentiment || 'Positive',
        priority: editablePreview.priority || 'Medium',
        next_action: editablePreview.next_action || '',
        confidence_score: editablePreview.confidence_score || latestConfidence,
        status: 'saved'
      };

      await dispatch(createInteraction(payload as any)).unwrap();
      showToast({
        title: 'Interaction Saved to DB',
        description: `Successfully stored visit for ${editablePreview.hcp_name || 'Doctor'} in PostgreSQL.`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'Save Failed',
        description: err.message || 'Error persisting record.',
        type: 'error'
      });
    }
  };

  return (
    <Card className="border-t-4 border-t-indigo-600 shadow-premium flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Banner with Confidence & Duplicate Warning */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="flex items-center gap-1.5 px-3 py-1 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extracted Preview (Live Editable)</span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confidence: {Math.round((editablePreview.confidence_score || latestConfidence) * 100)}%</span>
          </div>
        </div>
      </div>

      {editablePreview.duplicate_warning && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{editablePreview.duplicate_warning}</div>
        </div>
      )}

      {/* Editable Fields Grid */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Doctor / HCP Name</label>
            <input
              type="text"
              value={editablePreview.hcp_name || ''}
              onChange={(e) => handleFieldChange('hcp_name', e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Hospital / Clinic</label>
            <input
              type="text"
              value={editablePreview.hospital || ''}
              onChange={(e) => handleFieldChange('hospital', e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={editablePreview.interaction_date || ''}
              onChange={(e) => handleFieldChange('interaction_date', e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Sentiment</label>
            <select
              value={editablePreview.sentiment || 'Positive'}
              onChange={(e) => handleFieldChange('sentiment', e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Positive">😄 Positive</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Negative">😞 Negative</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
            <select
              value={editablePreview.priority || 'Medium'}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="High">🔴 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Products Discussed (Comma separated)</label>
          <input
            type="text"
            value={(editablePreview.products_discussed || []).join(', ')}
            onChange={(e) => handleFieldChange('products_discussed', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            className="w-full h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">AI Executive Summary</label>
          <textarea
            rows={2}
            value={editablePreview.ai_summary || ''}
            onChange={(e) => handleFieldChange('ai_summary', e.target.value)}
            className="w-full rounded-xl border border-blue-200 bg-blue-50/40 p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Raw Discussion Notes</label>
          <textarea
            rows={2}
            value={editablePreview.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {editablePreview.follow_up_required && (
          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-indigo-900">📅 Follow-up Requested</span>
              <p className="text-[11px] text-indigo-700">Scheduled: {editablePreview.follow_up_date || 'Next Tuesday'}</p>
            </div>
            <input
              type="text"
              value={editablePreview.follow_up_date || 'Next Tuesday'}
              onChange={(e) => handleFieldChange('follow_up_date', e.target.value)}
              className="h-8 rounded-lg border border-indigo-300 bg-white px-2.5 text-xs font-bold text-indigo-900 w-36 outline-none"
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleSaveToDatabase}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 font-bold py-2.5 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Save Interaction to Database
        </Button>
      </div>
    </Card>
  );
};
