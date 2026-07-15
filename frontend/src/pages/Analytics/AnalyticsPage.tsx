import React, { useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  FileText, 
  Calendar,
  Clock
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAnalytics } from '@/store/slices/analyticsSlice';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const AnalyticsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, loading } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const sentiment = summary?.sentiment_breakdown || { Positive: 9, Neutral: 3, Negative: 1 };
  const totalSentimentCount = (sentiment.Positive + sentiment.Neutral + sentiment.Negative) || 1;
  const posPct = Math.round((sentiment.Positive / totalSentimentCount) * 100);
  const neuPct = Math.round((sentiment.Neutral / totalSentimentCount) * 100);
  const negPct = Math.round((sentiment.Negative / totalSentimentCount) * 100);

  const topProducts = summary?.top_products_discussed || [
    { product_name: 'CardioGuard 10mg', count: 8, percentage: 42.1 },
    { product_name: 'MetfoPlus 500mg', count: 7, percentage: 36.8 },
    { product_name: 'GlucoPrime XR', count: 4, percentage: 21.1 }
  ];

  const timeline = summary?.interactions_timeline || [
    { date: '2026-07-08', visits: 2, calls: 1, emails: 0 },
    { date: '2026-07-09', visits: 3, calls: 2, emails: 1 },
    { date: '2026-07-10', visits: 1, calls: 3, emails: 2 },
    { date: '2026-07-11', visits: 4, calls: 1, emails: 0 },
    { date: '2026-07-12', visits: 2, calls: 2, emails: 1 },
    { date: '2026-07-13', visits: 3, calls: 1, emails: 1 },
    { date: '2026-07-14', visits: 5, calls: 2, emails: 2 }
  ];

  const recentLogs = summary?.recent_agent_logs || [
    { id: 1, session_id: 'session-demo-8291', step_name: 'EntityExtraction', tool_name: 'tool_log_interaction', execution_time_ms: 142 },
    { id: 2, session_id: 'session-demo-8291', step_name: 'ToolSelector', tool_name: 'tool_retrieve_profile', execution_time_ms: 85 },
    { id: 3, session_id: 'session-demo-8291', step_name: 'ExecuteTool', tool_name: 'tool_generate_followup', execution_time_ms: 210 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-elevated border border-blue-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
            <span>Veeva CRM Executive Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Territory Analytics & LangGraph KPI Center
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Monitor real-time doctor engagement indices, sample distribution velocity, product momentum, and LangGraph step latencies.
          </p>
        </div>

        <Badge variant="primary" className="px-4 py-2 text-sm font-bold bg-white text-blue-900 border-0 shadow-lg">
          Opportunity Score: {summary?.opportunity_index || 88.4} / 100
        </Badge>
      </div>

      {/* Grid 1: Sentiment Distribution & Top Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <span>Doctor Sentiment Distribution</span>
            </h3>
            <Badge variant="neutral">Overall Receptive Index: {summary?.average_sentiment_score || 88}%</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex h-5 rounded-full overflow-hidden bg-slate-100 shadow-inner">
              <div style={{ width: `${posPct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Positive: ${posPct}%`}></div>
              <div style={{ width: `${neuPct}%` }} className="bg-amber-400 transition-all duration-500" title={`Neutral: ${neuPct}%`}></div>
              <div style={{ width: `${negPct}%` }} className="bg-rose-500 transition-all duration-500" title={`Negative: ${negPct}%`}></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase block">Positive</span>
                <span className="text-xl font-extrabold text-emerald-900 font-mono">{posPct}%</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">{sentiment.Positive} visits</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase block">Neutral</span>
                <span className="text-xl font-extrabold text-amber-900 font-mono">{neuPct}%</span>
                <span className="text-[11px] text-amber-600 block mt-0.5">{sentiment.Neutral} visits</span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-800 uppercase block">Negative</span>
                <span className="text-xl font-extrabold text-rose-900 font-mono">{negPct}%</span>
                <span className="text-[11px] text-rose-600 block mt-0.5">{sentiment.Negative} visits</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Top Discussed Pharmaceutical Products</span>
            </h3>
            <Badge variant="primary">{topProducts.length} Active SKUs</Badge>
          </div>

          <div className="space-y-4">
            {topProducts.map((prod, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{prod.product_name}</span>
                  <span className="text-blue-700 font-mono">{prod.percentage}% ({prod.count} logs)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${prod.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Grid 2: 7-Day Interaction Activity Chart */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>7-Day Multi-Channel Interaction Volume</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-600"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> In-Person Visits</span>
            <span className="flex items-center gap-1.5 text-indigo-500"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> Phone Calls</span>
            <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Emails / Virtual</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3 pt-4 items-end h-48 border-b border-slate-200 pb-4">
          {timeline.map((day, idx) => {
            const total = (day.visits + day.calls + day.emails) || 1;
            const maxVal = 10;
            const heightPct = Math.min((total / maxVal) * 100, 100);

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-xs font-bold text-slate-700">{total}</span>
                <div className="w-10 bg-slate-100 rounded-xl overflow-hidden flex flex-col justify-end h-32 relative">
                  <div style={{ height: `${(day.visits / total) * heightPct}%` }} className="bg-blue-600 w-full transition-all"></div>
                  <div style={{ height: `${(day.calls / total) * heightPct}%` }} className="bg-indigo-500 w-full transition-all"></div>
                  <div style={{ height: `${(day.emails / total) * heightPct}%` }} className="bg-emerald-500 w-full transition-all"></div>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-1">{day.date.split('-').slice(1).join('/')}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grid 3: LangGraph Execution Trace Audit Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span>LangGraph Agent Step Latency Benchmarks</span>
          </h3>
          <Badge variant="purple">PostgreSQL AgentLog Table</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Log ID</th>
                <th className="px-6 py-3">Session ID</th>
                <th className="px-6 py-3">LangGraph Node / Step</th>
                <th className="px-6 py-3">Tool Executed</th>
                <th className="px-6 py-3 text-right">Execution Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-mono">
              {recentLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5 text-slate-500">#{log.id}</td>
                  <td className="px-6 py-3.5 text-slate-700">{log.session_id}</td>
                  <td className="px-6 py-3.5 font-bold text-purple-800">{log.step_name}</td>
                  <td className="px-6 py-3.5 text-blue-700">{log.tool_name || 'none'}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-emerald-700">{log.execution_time_ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
