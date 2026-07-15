import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  Heart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchHCPs, setSearchQuery, setSelectedSpecialization, setSelectedTier } from '@/store/slices/hcpSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';

export const HCPListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { hcps, loading, searchQuery, selectedSpecialization, selectedTier } = useAppSelector((state) => state.hcp);
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    dispatch(fetchHCPs({ search: localSearch || undefined, specialization: selectedSpecialization || undefined, tier: selectedTier || undefined }));
  }, [dispatch, localSearch, selectedSpecialization, selectedTier]);

  const specializations = ['All', 'Cardiology', 'Endocrinology', 'Oncology', 'Neurology', 'Pulmonology', 'Orthopedics'];
  const tiers = [
    { id: 'all', label: 'All Tiers', badge: hcps.length },
    { id: 'Priority A', label: 'Priority A (High Volume)', badge: hcps.filter(h => h.tier === 'Priority A').length },
    { id: 'Priority B', label: 'Priority B (Growth)', badge: hcps.filter(h => h.tier === 'Priority B').length },
    { id: 'Priority C', label: 'Priority C (Maintenance)', badge: hcps.filter(h => h.tier === 'Priority C').length },
  ];

  const filteredHCPs = hcps.filter(h => {
    const matchesSearch = !localSearch || h.name.toLowerCase().includes(localSearch.toLowerCase()) || h.hospital.toLowerCase().includes(localSearch.toLowerCase()) || h.specialization.toLowerCase().includes(localSearch.toLowerCase());
    const matchesSpec = !selectedSpecialization || selectedSpecialization === 'All' || h.specialization === selectedSpecialization;
    const matchesTier = !selectedTier || selectedTier === 'all' || h.tier === selectedTier;
    return matchesSearch && matchesSpec && matchesTier;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Healthcare Professional Directory</h1>
            <Badge variant="primary" className="text-xs">{hcps.length} Doctors</Badge>
          </div>
          <p className="text-xs text-slate-500">Comprehensive 360° profiles with relationship scoring, risk tiering, and interaction audit trails.</p>
        </div>

        <Button
          onClick={() => navigate('/log-interaction')}
          variant="primary"
          size="md"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 font-bold self-start md:self-center"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Log New Visit
        </Button>
      </div>

      {/* Filters Hub */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, hospital, or specialty..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => dispatch(setSelectedSpecialization(spec === 'All' ? null : spec))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  (spec === 'All' && !selectedSpecialization) || selectedSpecialization === spec
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        <Tabs
          tabs={tiers}
          activeTab={selectedTier || 'all'}
          onChange={(id) => dispatch(setSelectedTier(id === 'all' ? null : id))}
        />
      </Card>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-medium">Loading medical profiles...</div>
        ) : filteredHCPs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 italic bg-white rounded-3xl border border-dashed border-slate-300">
            No doctors found matching the selected filters.
          </div>
        ) : (
          filteredHCPs.map((hcp) => (
            <Card
              key={hcp.id}
              hoverEffect
              onClick={() => navigate(`/hcps/${hcp.id}`)}
              className="cursor-pointer flex flex-col justify-between p-6 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform">
                      {hcp.name.replace('Dr. ', '')[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                        {hcp.name}
                      </h3>
                      <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {hcp.specialization}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={
                      hcp.tier === 'Priority A' ? 'danger' : hcp.tier === 'Priority B' ? 'warning' : 'neutral'
                    }
                    className="font-bold flex-shrink-0"
                  >
                    {hcp.tier}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium truncate">{hcp.hospital}</span>
                  </div>
                  {hcp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{hcp.phone}</span>
                    </div>
                  )}
                  {hcp.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{hcp.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship & Opportunity Metrics Bar */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Relationship Score
                    </span>
                    <span className="text-slate-800 font-mono">{hcp.relationship_score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full"
                      style={{ width: `${hcp.relationship_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Opp Index: <strong className="text-slate-800 font-mono">{hcp.opportunity_score}</strong>
                  </span>
                  <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    360° Profile <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
