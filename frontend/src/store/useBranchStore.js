import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useBranchStore = create((set, get) => ({
  branches: [],
  activeBranch: null,
  loading: false,
  error: null,

  fetchBranches: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, code, name, organization_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const currentActive = get().activeBranch;
      
      set({ 
        branches: data || [], 
        // Si no hay sucursal activa, autoselecciona la primera
        activeBranch: currentActive ? currentActive : (data?.[0] || null),
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching branches:', error.message);
    }
  },

  setActiveBranch: (branch) => {
    set({ activeBranch: branch });
  }
}));
