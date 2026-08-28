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
      // Securely fetch branches using Edge Function (bypassing RLS for anonymous users)
      const { data, error } = await supabase.functions.invoke('get_login_data');
      if (error) throw error;
      
      const branchesData = data?.branches || [];
      const currentActive = get().activeBranch;
      
      // Intentar obtener la sesión actual para ver si es un cajero
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      const roles = user?.app_metadata?.roles || [];
      const userBranchId = user?.app_metadata?.branch_id;
      
      let defaultBranch = branchesData?.[0] || null;
      let finalActiveBranch = currentActive ? currentActive : defaultBranch;
      
      // Si tiene una sucursal asignada (empleado/cajero), forzar estrictamente esa sucursal
      if (!roles.includes('ADMIN') && userBranchId) {
        const userBranch = branchesData.find(b => b.id === userBranchId);
        if (userBranch) {
          finalActiveBranch = userBranch;
        }
      }
      
      set({ 
        branches: branchesData, 
        activeBranch: finalActiveBranch,
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
