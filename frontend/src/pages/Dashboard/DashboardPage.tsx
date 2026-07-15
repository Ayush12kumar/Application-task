import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Sparkles, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAnalytics, fetchFollowups } from '@/store/slices/analyticsSlice';
import { fetchInteractions } from '@/store/slices/interactionSlice';
import { fetchHCPs } from '@/store/slices/hcpSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { summary, followups, loading } = useAppSelector((state) => state.analytics);
  const { interactions } = useAppSelector((state) => state.interaction);
  const { hcps } = useAppSelector((state) => state.hcp);

  useEffect(() => {
    dispatch(fetchAnalytics());
    dispatch(fetchFollowups());
    dispatch(fetchInteractions({ limit: 5 } as any));
    dispatch(fetchHCPs());
  }, [dispatch]);

  const stats = [
    {
      title: 'Total HCP Directory',
      value: summary?.total_hcps || hcps.length || 15,
      change: '+3 this month',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
      to: '/hcps'
    },
    {
      title: 'Logged Interactions',
      value: summary?.total_interactions || interactions.length || 12,
      change: '+8 this week',
      icon: <FileText className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
      to: '/interactions'
    },
    {
      title: 'Pending Follow-ups',
      value: summary?.pending_followups || followups.filter(f => f.status === 'pending').length || 4,
      change: '2 High Priority',
      icon: <Calendar className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      to: '/analytics'
    },
    {
      title: 'Average Sentiment Index',
      value: `${summary?.average_sentiment_score || 88.5}%`,
      change: 'Receptive & Engaged',
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      to: '/analytics'
    },
    {
      title: 'High Priority Actions',
      value: summary?.high_priority_actions || 3,
      change: 'Requires Immediate Action',
      icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
      to: '/interactions'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Quick Action Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-elevated relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Veeva CRM / Salesforce Health Cloud AI Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, Alex Mercer
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Your daily HCP interaction pipeline is active. LangGraph agent <code className="text-amber-300 font-mono text-xs">gemma2-9b-it</code> has flagged 2 high-priority cardiology follow-ups for today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
          <Button
            onClick={() => navigate('/log-interaction')}
            className="w-full sm:w-auto bg-white text-blue-800 hover:bg-blue-50 font-bold px-6 py-3.5 shadow-lg shadow-black/10 transition-transform active:scale-95"
          >
            <PlusCircle className="w-5 h-5 mr-2 text-blue-600" /> Log Interaction
          </Button>

          <Button
            onClick={() => navigate('/assistant')}
            variant="ghost"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-300" /> AI Assistant
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((item, idx) => (
          <Card
            key={idx}
            hoverEffect
            onClick={() => navigate(item.to)}
            className="cursor-pointer flex flex-col justify-between p-5 transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{item.title}</span>
              <div className={`p-2.5 rounded-2xl border ${item.bg}`}>{item.icon}</div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{item.value}</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{item.change}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid: Recent Interactions & Strategic Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Interactions Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Recent HCP Visit Logs & AI Summaries</span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/interactions')}
              className="text-blue-600 font-bold hover:text-blue-700"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <Card className="p-0 overflow-hidden border border-slate-200 shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-3.5">Doctor & Hospital</th>
                    <th className="px-6 py-3.5">Type & Date</th>
                    <th className="px-6 py-3.5">Products Discussed</th>
                    <th className="px-6 py-3.5">Sentiment</th>
                    <th className="px-6 py-3.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {interactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                        No recent interaction logs available.
                      </td>
                    </tr>
                  ) : (
                    interactions.slice(0, 5).map((i) => (
                      <tr
                        key={i.id}
                        onClick={() => navigate(`/hcps/${i.hcp_id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-blue-600">
                          <div>{i.hcp?.name || `Dr. HCP #${i.hcp_id}`}</div>
                          <div className="text-xs font-normal text-slate-500">{i.hcp?.hospital || 'Hospital Medical Center'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="neutral" className="font-semibold mb-1">
                            {i.interaction_type}
                          </Badge>
                          <div className="text-xs text-slate-500">{i.interaction_date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(i.products_discussed || []).map((p, idx) => (
                              <Badge key={idx} variant="primary" className="text-[11px]">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              i.sentiment === 'Positive' ? 'success' : i.sentiment === 'Negative' ? 'danger' : 'warning'
                            }
                          >
                            {i.sentiment}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              i.priority === 'High' ? 'danger' : i.priority === 'Medium' ? 'warning' : 'neutral'
                            }
                          >
                            {i.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Strategic Follow-up Pipeline & Product Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Immediate Follow-up Queue</span>
              </h4>
              <Badge variant="warning">{followups.filter(f => f.status === 'pending').length || 2} Active</Badge>
            </div>

            <div className="space-y-3.5">
              {(followups.length > 0 ? followups.slice(0, 3) : [
                {
                  id: 101,
                  strategy: 'Deliver arterial compliance dossier for CardioGuard 10mg.',
                  suggested_date: 'Next Tuesday',
                  priority: 'High',
                  hcp: { name: 'Dr. Rajesh Sharma', hospital: 'Apollo Hospital' }
                },
                {
                  id: 102,
                  strategy: 'Send EMPA-KIDNEY trial monograph for GlucoPrime XR.',
                  suggested_date: 'In 5 Days',
                  priority: 'High',
                  hcp: { name: 'Dr. Ananya Gupta', hospital: 'AIIMS Medical Center' }
                }
              ]).map((f: any, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(f.hcp_id ? `/hcps/${f.hcp_id}` : '/analytics')}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 group-hover:text-blue-600">{f.hcp?.name || 'Dr. HCP'}</span>
                    <Badge variant={f.priority === 'High' ? 'danger' : 'neutral'} className="text-[10px]">
                      {f.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug font-medium mb-2">{f.strategy}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {f.suggested_date}
                    </span>
                    <span className="text-blue-600 font-bold group-hover:underline">Action →</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 shadow-premium">
            <h4 className="text-base font-extrabold text-white mb-3 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-400" />
              <span>Product Portfolio Momentum</span>
            </h4>
            <p className="text-xs text-slate-300 mb-4">Top discussed products across all Medical Representative visits:</p>

            <div className="space-y-3 text-xs">
              {(summary?.top_products_discussed || [
                { product_name: 'CardioGuard 10mg', percentage: 42 },
                { product_name: 'MetfoPlus 500mg', percentage: 35 },
                { product_name: 'GlucoPrime XR', percentage: 23 }
              ]).map((prod, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-200">{prod.product_name}</span>
                    <span className="text-amber-400 font-mono">{prod.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${prod.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
