import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  PlusCircle, 
  Sparkles, 
  Calendar, 
  Clock, 
  Tag, 
  TrendingUp, 
  Heart, 
  ShieldAlert, 
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchHCPById } from '@/store/slices/hcpSlice';
import { fetchInteractions } from '@/store/slices/interactionSlice';
import { fetchFollowups, generateFollowupPlan } from '@/store/slices/analyticsSlice';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';

export const HCPProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { activeHCP, hcps } = useAppSelector((state) => state.hcp);
  const { interactions } = useAppSelector((state) => state.interaction);
  const { followups } = useAppSelector((state) => state.analytics);
  const [activeTab, setActiveTab] = useState('timeline');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const hcpId = Number(id);
  const doctor = activeHCP?.id === hcpId ? activeHCP : hcps.find(h => h.id === hcpId);

  useEffect(() => {
    if (hcpId) {
      dispatch(fetchHCPById(hcpId));
      dispatch(fetchInteractions({ hcp_id: hcpId } as any));
      dispatch(fetchFollowups(hcpId));
    }
  }, [dispatch, hcpId]);

  const hcpInteractions = interactions.filter(i => i.hcp_id === hcpId);
  const hcpFollowups = followups.filter(f => f.hcp_id === hcpId);

  const handleCreateAIPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      await dispatch(generateFollowupPlan({ hcpId, interactionId: hcpInteractions[0]?.id })).unwrap();
      showToast({
        title: 'Strategic Follow-up Generated',
        description: `Groq AI created tailored clinical strategy for ${doctor?.name || 'HCP'}.`,
        type: 'success'
      });
      setActiveTab('followups');
    } catch (err: any) {
      showToast({ title: 'AI Error', description: err.message || 'Could not generate plan', type: 'error' });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  if (!doctor) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-500 text-sm">Loading 360° doctor profile...</p>
        <Button variant="outline" onClick={() => navigate('/hcps')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Button>
      </div>
    );
  }

  const profileTabs = [
    { id: 'timeline', label: 'Visit & Call Timeline', badge: hcpInteractions.length },
    { id: 'samples', label: 'Sample Allocations Audit', badge: hcpInteractions.reduce((acc, i) => acc + (i.samples_given?.length || 0), 0) },
    { id: 'followups', label: 'Strategic Follow-up Plans', badge: hcpFollowups.length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => navigate('/hcps')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to HCP Directory
      </button>

      {/* 360 Profile Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-elevated border border-slate-800 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20 flex-shrink-0">
            {doctor.name.replace('Dr. ', '')[0]}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{doctor.name}</h1>
              <Badge variant={doctor.tier === 'Priority A' ? 'danger' : 'warning'} className="text-xs px-3 py-1">
                {doctor.tier}
              </Badge>
            </div>
            <p className="text-sm font-semibold text-blue-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {doctor.hospital} — {doctor.specialization}
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-300 pt-1">
              {doctor.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> {doctor.phone}
                </span>
              )}
              {doctor.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> {doctor.email}
                </span>
              )}
              {doctor.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> {doctor.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            onClick={() => navigate('/log-interaction')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 shadow-lg shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Log Visit for Doctor
          </Button>

          <Button
            onClick={handleCreateAIPlan}
            variant="ghost"
            isLoading={isGeneratingPlan}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-400/30 font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-300" /> Auto-Generate AI Follow-up
          </Button>
        </div>
      </div>

      {/* Metric Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Relationship Index</span>
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{doctor.relationship_score}%</h3>
          <p className="text-xs text-slate-500 mt-1">High access & strong affinity</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Opportunity Index</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{doctor.opportunity_score} / 100</h3>
          <p className="text-xs text-slate-500 mt-1">High prescription volume potential</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Assessment Score</span>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{doctor.risk_score}%</h3>
          <p className="text-xs text-slate-500 mt-1">Low attrition risk</p>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Card className="p-6">
        <Tabs tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} className="max-w-2xl mb-6" />

        {/* Tab 1: Visit Timeline */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {hcpInteractions.length === 0 ? (
              <p className="py-12 text-center text-slate-400 italic">No past interaction visits recorded for this doctor.</p>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6">
                {hcpInteractions.map((item) => (
                  <div key={item.id} className="relative group">
                    <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm ring-2 ring-blue-100"></span>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-premium transition-all space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary" className="font-bold">{item.interaction_type}</Badge>
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.interaction_date}
                          </span>
                          <span className="text-xs text-slate-400">({item.duration_minutes} mins)</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={item.sentiment === 'Positive' ? 'success' : item.sentiment === 'Negative' ? 'danger' : 'warning'}>
                            {item.sentiment}
                          </Badge>
                          <Badge variant={item.priority === 'High' ? 'danger' : 'neutral'}>
                            {item.priority} Priority
                          </Badge>
                        </div>
                      </div>

                      {item.ai_summary && (
                        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-slate-800 leading-relaxed font-medium">
                          <strong className="text-blue-800 flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Clinical Executive Summary:
                          </strong>
                          {item.ai_summary}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-200/60">
                          <strong className="text-slate-700">Detailed Notes:</strong> {item.notes}
                        </p>
                      )}

                      {/* Products & Samples pill */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Products:</span>
                        {(item.products_discussed || []).map((p, idx) => (
                          <Badge key={idx} variant="primary" className="text-xs">{p}</Badge>
                        ))}
                        {(item.samples_given || []).length > 0 && (
                          <span className="text-xs font-semibold text-emerald-700 ml-2">
                            🎁 Samples: {item.samples_given.map((s) => `${s.quantity}x ${s.product}`).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Sample Allocations Audit */}
        {activeTab === 'samples' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Pharmaceutical Sample Distributions to {doctor.name}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Units Distributed</th>
                    <th className="px-6 py-3">Date Delivered</th>
                    <th className="px-6 py-3">Interaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {hcpInteractions.flatMap(i => (i.samples_given || []).map(s => ({ ...s, date: i.interaction_date, intId: i.id }))).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No samples distributed yet.</td>
                    </tr>
                  ) : (
                    hcpInteractions.flatMap(i => (i.samples_given || []).map(s => ({ ...s, date: i.interaction_date, intId: i.id }))).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{row.product}</td>
                        <td className="px-6 py-3.5 font-mono font-bold text-emerald-700">{row.quantity} units</td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs">{row.date}</td>
                        <td className="px-6 py-3.5 text-slate-400 text-xs">#{row.intId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Strategic Follow-ups */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Active & Suggested Clinical Strategies</h4>
              <Button size="sm" onClick={handleCreateAIPlan} isLoading={isGeneratingPlan}>
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-300" /> Generate AI Strategy
              </Button>
            </div>

            <div className="space-y-4">
              {hcpFollowups.length === 0 ? (
                <p className="py-12 text-center text-slate-400 italic">No follow-up strategies currently active.</p>
              ) : (
                hcpFollowups.map((f, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" className="font-bold">Follow-up Strategy #{f.id}</Badge>
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Suggested Date: {f.suggested_date}
                        </span>
                      </div>
                      <Badge variant={f.priority === 'High' ? 'danger' : 'neutral'}>{f.priority} Priority</Badge>
                    </div>

                    <p className="text-sm text-slate-800 font-semibold">{f.strategy}</p>

                    {f.talking_points && f.talking_points.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-indigo-100">
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">Recommended Talking Points:</span>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                          {f.talking_points.map((tp, i) => (
                            <li key={i}>{tp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
