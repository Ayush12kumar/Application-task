import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HCP, Product } from '@/types';

interface HCPState {
  hcps: HCP[];
  activeHCP: HCP | null;
  products: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedSpecialization: string | null;
  selectedTier: string | null;
}

const initialState: HCPState = {
  hcps: [],
  activeHCP: null,
  products: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedSpecialization: null,
  selectedTier: null,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const fetchHCPs = createAsyncThunk(
  'hcp/fetchHCPs',
  async (params?: { search?: string; specialization?: string; tier?: string }) => {
    let url = `${API_BASE}/hcps?limit=100`;
    if (params?.search) url += `&search=${encodeURIComponent(params.search)}`;
    if (params?.specialization) url += `&specialization=${encodeURIComponent(params.specialization)}`;
    if (params?.tier) url += `&tier=${encodeURIComponent(params.tier)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch HCPs');
    const data = await res.json();
    return data.items as HCP[];
  }
);

export const fetchHCPById = createAsyncThunk(
  'hcp/fetchHCPById',
  async (id: number) => {
    const res = await fetch(`${API_BASE}/hcps/${id}`);
    if (!res.ok) throw new Error('Failed to fetch HCP details');
    return await res.json() as HCP;
  }
);

export const fetchProducts = createAsyncThunk(
  'hcp/fetchProducts',
  async () => {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json() as Product[];
  }
);

const hcpSlice = createSlice({
  name: 'hcp',
  initialState,
  reducers: {
    setActiveHCP(state, action: PayloadAction<HCP | null>) {
      state.activeHCP = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSelectedSpecialization(state, action: PayloadAction<string | null>) {
      state.selectedSpecialization = action.payload;
    },
    setSelectedTier(state, action: PayloadAction<string | null>) {
      state.selectedTier = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.hcps = action.payload;
      })
      .addCase(fetchHCPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch HCPs';
      })
      .addCase(fetchHCPById.fulfilled, (state, action) => {
        state.activeHCP = action.payload;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload;
      });
  }
});

export const { setActiveHCP, setSearchQuery, setSelectedSpecialization, setSelectedTier } = hcpSlice.actions;
export default hcpSlice.reducer;
