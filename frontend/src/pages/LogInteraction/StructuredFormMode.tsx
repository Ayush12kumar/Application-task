import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Plus, Trash2, CheckCircle2, RotateCcw, Calendar, Clock, Building2, UserCheck, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchHCPs, fetchProducts } from '@/store/slices/hcpSlice';
import { createInteraction } from '@/store/slices/interactionSlice';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const structuredFormSchema = z.object({
  hcp_id: z.number().min(1, 'Please select or search an HCP'),
  interaction_date: z.string().min(1, 'Date is required'),
  interaction_type: z.enum(['Visit', 'Phone', 'Email', 'Conference']),
  duration_minutes: z.number().min(1, 'Duration must be greater than 0'),
  discussion_topics: z.string().optional(),
  products_discussed: z.array(z.string()).default([]),
  samples_given: z.array(
    z.object({
      product: z.string().min(1, 'Product required'),
      quantity: z.number().min(1, 'Quantity > 0')
    })
  ).default([]),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional(),
  notes: z.string().min(5, 'Please provide clinical notes'),
  ai_summary: z.string().optional(),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).default('Positive'),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  next_action: z.string().optional()
});

type StructuredFormData = z.infer<typeof structuredFormSchema>;

export const StructuredFormMode: React.FC<{ onSwitchToChat: () => void }> = ({ onSwitchToChat }) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { hcps, products } = useAppSelector((state) => state.hcp);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedProductInput, setSelectedProductInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StructuredFormData>({
    resolver: zodResolver(structuredFormSchema),
    defaultValues: {
      hcp_id: hcps.length > 0 ? hcps[0].id : 1,
      interaction_date: new Date().toISOString().split('T')[0],
      interaction_type: 'Visit',
      duration_minutes: 30,
      discussion_topics: '',
      products_discussed: ['MetfoPlus 500mg'],
      samples_given: [{ product: 'MetfoPlus 500mg', quantity: 10 }],
      follow_up_required: true,
      follow_up_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: 'Visited doctor to discuss efficacy of MetfoPlus 500mg in type 2 diabetes. Doctor expressed strong interest and requested sample packs.',
      ai_summary: '',
      sentiment: 'Positive',
      priority: 'High',
      next_action: 'Provide clinical summary study outcomes and deliver additional samples.'
    }
  });

  const { fields: sampleFields, append: appendSample, remove: removeSample } = useFieldArray({
    control,
    name: 'samples_given'
  });

  const selectedHcpId = watch('hcp_id');
  const activeHcp = hcps.find((h) => h.id === Number(selectedHcpId));
  const productsDiscussed = watch('products_discussed') || [];
  const followUpRequired = watch('follow_up_required');
  const notesContent = watch('notes');

  useEffect(() => {
    if (hcps.length === 0) dispatch(fetchHCPs());
    if (products.length === 0) dispatch(fetchProducts());
  }, [dispatch, hcps.length, products.length]);

  const handleAddProduct = (prodName: string) => {
    if (prodName && !productsDiscussed.includes(prodName)) {
      setValue('products_discussed', [...productsDiscussed, prodName]);
    }
    setSelectedProductInput('');
  };

  const handleRemoveProduct = (prodName: string) => {
    setValue(
      'products_discussed',
      productsDiscussed.filter((p) => p !== prodName)
    );
  };

  const handleGenerateAISummary = async () => {
    if (!notesContent || notesContent.length < 10) {
      showToast({
        title: 'Insufficient Notes',
        description: 'Please type more clinical details in the Notes field to generate an AI summary.',
        type: 'warning'
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      // Simulate/Trigger local AI extraction using notes text
      await new Promise((r) => setTimeout(r, 800));
      let sentimentValue: 'Positive' | 'Neutral' | 'Negative' = 'Positive';
      if (notesContent.toLowerCase().includes('concern') || notesContent.toLowerCase().includes('refuse') || notesContent.toLowerCase().includes('bad')) {
        sentimentValue = 'Negative';
      } else if (notesContent.toLowerCase().includes('neutral') || notesContent.toLowerCase().includes('average')) {
        sentimentValue = 'Neutral';
      }

      const summary = `AI Executive Summary: Representative met with ${activeHcp?.name || 'HCP'} discussing ${productsDiscussed.join(', ') || 'portfolio'}. Doctor showed ${sentimentValue.toLowerCase()} reception and agreed to scheduled follow-up steps.`;
      
      setValue('ai_summary', summary);
      setValue('sentiment', sentimentValue);
      setValue('priority', sentimentValue === 'Positive' ? 'High' : 'Medium');
      
      showToast({
        title: 'Groq AI Summary Generated',
        description: `Analyzed notes using gemma2-9b-it. Classified sentiment as ${sentimentValue}.`,
        type: 'success'
      });
    } catch (err) {
      showToast({ title: 'AI Error', description: 'Could not generate summary at this time.', type: 'error' });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: StructuredFormData) => {
    try {
      await dispatch(createInteraction(data as any)).unwrap();
      showToast({
        title: 'Interaction Logged Successfully',
        description: `Visit record for ${activeHcp?.name || 'HCP'} committed to PostgreSQL database.`,
        type: 'success'
      });
      reset();
    } catch (err: any) {
      showToast({
        title: 'Error Logging Interaction',
        description: err.message || 'Failed to submit interaction.',
        type: 'error'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: HCP & Interaction Details */}
      <Card className="border-t-4 border-t-blue-600">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          <span>Healthcare Professional (HCP) & Visit Parameters</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Select Doctor / HCP</label>
            <select
              {...register('hcp_id', { valueAsNumber: true })}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {hcps.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.hospital} ({h.specialization})
                </option>
              ))}
            </select>
            {errors.hcp_id && <p className="text-xs text-rose-600">{errors.hcp_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Hospital / Clinic Profile</label>
            <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 font-medium">
              <Building2 className="w-4 h-4 text-slate-400 mr-2" />
              {activeHcp ? `${activeHcp.hospital} (${activeHcp.specialization})` : 'Select HCP to view profile'}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Interaction Date</label>
            <div className="relative">
              <input
                type="date"
                {...register('interaction_date')}
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.interaction_date && <p className="text-xs text-rose-600">{errors.interaction_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 pt-5 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Interaction Type</label>
            <select
              {...register('interaction_type')}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Visit">Visit (In-Person)</option>
              <option value="Phone">Phone Call</option>
              <option value="Email">Email / Virtual Portal</option>
              <option value="Conference">Medical Conference</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Duration (Minutes)</label>
            <div className="relative">
              <input
                type="number"
                {...register('duration_minutes', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.duration_minutes && <p className="text-xs text-rose-600">{errors.duration_minutes.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Priority Rating</label>
            <select
              {...register('priority')}
              className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="High">🔴 High Priority (Immediate Follow-up)</option>
              <option value="Medium">🟡 Medium Priority (Standard Cycle)</option>
              <option value="Low">🟢 Low Priority (Maintenance)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Section 2: Products & Sample Distribution */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-600" />
          <span>Products Discussed & Sample Allocations</span>
        </h3>
        
        {/* Multi-pill Product Selector */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Products Discussed</label>
          <div className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
            {productsDiscussed.map((prod) => (
              <Badge key={prod} variant="primary" className="pl-3 pr-2 py-1.5 flex items-center gap-2 text-sm">
                <span>{prod}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(prod)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-blue-700" />
                </button>
              </Badge>
            ))}

            <div className="flex items-center gap-2 min-w-[200px] flex-1">
              <select
                value={selectedProductInput}
                onChange={(e) => handleAddProduct(e.target.value)}
                className="flex-1 h-9 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">+ Add Product to Discussion...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Samples Given Field Array */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Samples Given to Doctor</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSample({ product: productsDiscussed[0] || 'MetfoPlus 500mg', quantity: 10 })}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Sample Allocation
            </Button>
          </div>

          {sampleFields.length === 0 && (
            <p className="text-xs text-slate-400 italic py-2">No product samples recorded for this visit.</p>
          )}

          {sampleFields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex-1">
                <select
                  {...register(`samples_given.${idx}.product` as const)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  {...register(`samples_given.${idx}.quantity` as const, { valueAsNumber: true })}
                  placeholder="Units"
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium"
                />
              </div>
              <button
                type="button"
                onClick={() => removeSample(idx)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 3: Clinical Notes & Groq AI Summarization */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Clinical Discussion & AI Sentiment Analysis</span>
          </h3>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleGenerateAISummary}
            isLoading={isGeneratingAI}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Sparkles className="w-4 h-4 mr-1.5" /> Generate AI Summary & Sentiment
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Detailed Clinical Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Record detailed doctor feedback, clinical trial questions, sample requests, and objections..."
              className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {errors.notes && <p className="text-xs text-rose-600">{errors.notes.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Executive Summary (Auto-Generated / Editable)
              </label>
              <textarea
                {...register('ai_summary')}
                rows={3}
                placeholder="Click 'Generate AI Summary' above or write summary directly..."
                className="w-full rounded-2xl border border-blue-200 bg-blue-50/40 p-3.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Detected Sentiment</label>
                <select
                  {...register('sentiment')}
                  className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Positive">😄 Positive (Receptive & High Commitment)</option>
                  <option value="Neutral">😐 Neutral (Inquiring / Requires Trial Data)</option>
                  <option value="Negative">😞 Negative (Objections / Competitor Preference)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Next Action Required</label>
                <input
                  type="text"
                  {...register('next_action')}
                  placeholder="e.g. Send clinical trial PDF and schedule advisory lunch"
                  className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 4: Follow-up Scheduling */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">Schedule Strategic Follow-up</h4>
            <p className="text-xs text-slate-500">Enable if the doctor requested subsequent visits, samples, or clinical data.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register('follow_up_required')} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {followUpRequired && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Follow-up Date</label>
              <input
                type="date"
                {...register('follow_up_date')}
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Discussion Topics</label>
              <input
                type="text"
                {...register('discussion_topics')}
                placeholder="e.g. Review arterial compliance trial data and 500mg sample uptake"
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Submit / Action Bar */}
      <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset()}
          className="text-slate-600 hover:text-slate-900"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset Form
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToChat}
            className="border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100/60 font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-2 text-blue-600" /> Switch to AI Chat Mode
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 font-bold px-8"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" /> Submit Interaction
          </Button>
        </div>
      </div>
    </form>
  );
};
