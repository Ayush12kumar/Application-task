import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchInteractions, setSelectedInteractionForHistory } from '@/store/slices/interactionSlice';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Interaction } from '@/types';

export const InteractionsListPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { interactions, selectedInteractionForHistory, loading } = useAppSelector((state) => state.interaction);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchInteractions({ limit: 100 } as any));
  }, [dispatch]);

  const filteredInteractions = interactions.filter((i) => {
    const matchSearch = !searchTerm || (i.hcp?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.discussion_topics || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'All' || i.interaction_type === typeFilter;
    const matchSentiment = sentimentFilter === 'All' || i.sentiment === sentimentFilter;
    return matchSearch && matchType && matchSentiment;
  });

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Veeva / Health Cloud: Interactions Audit Report', 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()} by Medical Representative Alex Mercer`, 14, 30);
      
      let y = 42;
      filteredInteractions.forEach((i, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${i.hcp?.name || 'Doctor'} (${i.hcp?.hospital || 'Hospital'}) - ${i.interaction_type}`, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${i.interaction_date} | Duration: ${i.duration_minutes} mins | Sentiment: ${i.sentiment} | Priority: ${i.priority}`, 14, y);
        y += 6;
        const productsStr = (i.products_discussed || []).join(', ');
        doc.text(`Products Discussed: ${productsStr || 'None recorded'}`, 14, y);
        y += 6;
        if (i.ai_summary) {
          const splitSummary = doc.splitTextToSize(`AI Summary: ${i.ai_summary}`, 180);
          doc.text(splitSummary, 14, y);
          y += splitSummary.length * 5 + 4;
        } else {
          y += 4;
        }
      });

      doc.save('CRM_Interactions_Audit_Report.pdf');
      showToast({ title: 'PDF Export Complete', description: 'Generated printable audit report document.', type: 'success' });
    } catch (err) {
      showToast({ title: 'Export Error', description: 'Could not generate PDF report at this time.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interactions Audit & History Log</h1>
            <Badge variant="primary" className="text-xs font-bold">{interactions.length} Records</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Immutable database audit trail showing every recorded visit, phone call, sample allocation, and version modification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExportPDF} variant="outline" className="border-slate-300 font-bold text-slate-700">
            <Download className="w-4 h-4 mr-2 text-blue-600" /> Export PDF Audit
          </Button>
          <Button onClick={() => navigate('/log-interaction')} variant="primary" className="bg-gradient-to-r from-blue-600 to-indigo-600 font-bold">
            <FileText className="w-4 h-4 mr-2" /> Log New Visit
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name, topics, or notes..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              <option value="All">All Interaction Types</option>
              <option value="Visit">Visit (In-Person)</option>
              <option value="Phone">Phone Call</option>
              <option value="Email">Email / Virtual</option>
              <option value="Conference">Medical Conference</option>
            </select>
          </div>

          <div>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              <option value="All">All Sentiments</option>
              <option value="Positive">😄 Positive</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Negative">😞 Negative</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden border border-slate-200 shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Doctor & Hospital</th>
                <th className="px-6 py-3.5">Type & Date</th>
                <th className="px-6 py-3.5">Discussion Summary</th>
                <th className="px-6 py-3.5">Sentiment & Priority</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading interaction logs...</td>
                </tr>
              ) : filteredInteractions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No interactions found matching filters.</td>
                </tr>
              ) : (
                filteredInteractions.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div
                        onClick={() => navigate(`/hcps/${i.hcp_id}`)}
                        className="font-extrabold text-slate-900 group-hover:text-blue-600 cursor-pointer"
                      >
                        {i.hcp?.name || `Doctor #${i.hcp_id}`}
                      </div>
                      <div className="text-xs text-slate-500">{i.hcp?.hospital || 'Hospital Medical Center'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant="primary" className="font-bold mb-1">{i.interaction_type}</Badge>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {i.interaction_date}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <div className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                        {i.ai_summary || i.notes || i.discussion_topics || 'No summary notes recorded.'}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(i.products_discussed || []).map((p, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge variant={i.sentiment === 'Positive' ? 'success' : i.sentiment === 'Negative' ? 'danger' : 'warning'}>
                          {i.sentiment}
                        </Badge>
                        <div>
                          <Badge variant={i.priority === 'High' ? 'danger' : 'neutral'} className="text-[10px]">
                            {i.priority} Priority
                          </Badge>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> v{i.version || 1}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dispatch(setSelectedInteractionForHistory(i))}
                        className="text-xs font-semibold border-slate-300"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" /> View History & Diff
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Version History & Diff Modal */}
      <Modal
        isOpen={!!selectedInteractionForHistory}
        onClose={() => dispatch(setSelectedInteractionForHistory(null))}
        title={`Audit Trail & Version History: ${selectedInteractionForHistory?.hcp?.name || 'Interaction'}`}
        size="lg"
      >
        {selectedInteractionForHistory && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Current Version: v{selectedInteractionForHistory.version || 1} ({selectedInteractionForHistory.status})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Logged on {selectedInteractionForHistory.interaction_date} for {selectedInteractionForHistory.hcp?.hospital}</p>
              </div>
              <Badge variant="success" className="font-bold">Immutable PostgreSQL Log</Badge>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Snapshot Data</h5>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                <div><strong className="text-slate-700">AI Summary:</strong> {selectedInteractionForHistory.ai_summary}</div>
                <div><strong className="text-slate-700">Discussion Notes:</strong> {selectedInteractionForHistory.notes}</div>
                <div><strong className="text-slate-700">Products Discussed:</strong> {(selectedInteractionForHistory.products_discussed || []).join(', ')}</div>
                <div><strong className="text-slate-700">Samples Given:</strong> {(selectedInteractionForHistory.samples_given || []).map((s: any) => `${s.quantity}x ${s.product}`).join(', ') || 'None'}</div>
                <div><strong className="text-slate-700">Next Action:</strong> {selectedInteractionForHistory.next_action || 'Standard schedule'}</div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Historical Revision Log</h5>
              {(!selectedInteractionForHistory.history || selectedInteractionForHistory.history.length === 0) ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 italic">
                  No previous revision diffs exist. This is the original version v1 as logged by the Medical Representative.
                </div>
              ) : (
                selectedInteractionForHistory.history.map((record) => (
                  <div key={record.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Revision v{record.version}</span>
                      <span>Modified at: {record.changed_at}</span>
                    </div>
                    <pre className="mt-2 p-2 rounded-lg bg-white/80 overflow-x-auto text-[11px] font-mono text-slate-700 border border-amber-100">
                      {JSON.stringify(record.previous_data, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => dispatch(setSelectedInteractionForHistory(null))} variant="primary">
                Close Audit Modal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
