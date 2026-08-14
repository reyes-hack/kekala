import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Plus, Download, PackageOpen, Trash2, Calendar, FileText, Hash, AlertTriangle, Clock, Box } from 'lucide-react';
import * as XLSX from 'xlsx';
import { NeoSelect } from '../components/NeoSelect';

import { NeoDatePicker } from '../components/NeoDatePicker';
import { useNeoFilters } from '../hooks/useNeoFilters';
import { NeoAdvancedFilter } from '../components/NeoAdvancedFilter';
import { NeoPagination } from '../components/NeoPagination';
import { AuthContext } from '../components/ProtectedRoute';

export function Mermas() {
// ... (saltando las partes que no cambian, pero oh espera, tengo que reemplazar líneas exactas)
  const { activeBranch } = useBranchStore();
  const { isAdmin } = useContext(AuthContext);
  const [mermas, setMermas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Combobox Data
  const [products, setProducts] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [flavors, setFlavors] = useState([]); // This could be populated dynamically later
  
  // Status ID for 'APPROVED'
  const [approvedStatusId, setApprovedStatusId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [totalRecords, setTotalRecords] = useState(0);

  const {
    page, pageSize, globalSearch, advancedFilters,
    setPage, setPageSize, setGlobalSearch, applyAdvancedFilter, clearFilters
  } = useNeoFilters({ initialPageSize: 10 });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    product: '', flavor: '', shift: '', quantity: '', batch: '', reason: '', notes: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const shifts = ["TURNO MAÑANA", "TURNO TARDE"];

  useEffect(() => {
    if (activeBranch) loadFormCatalogs();
  }, [activeBranch]);

  useEffect(() => {
    if (activeBranch) loadMermas();
  }, [activeBranch, page, pageSize, globalSearch, advancedFilters]);

  const loadFormCatalogs = async () => {
    try {
      // Use getSession() instead of getUser() because the JWT hook injects
      // branch_id, organization_id, and roles into app_metadata at token level.
      // getUser() returns server-stored metadata WITHOUT hook modifications.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      setCurrentUser(user);

      // Use RPC function instead of querying table directly to respect RLS
      const { data: prods, error: prodsErr } = await supabase.rpc('get_pos_products');
      if (prodsErr) console.error('Error fetching products:', prodsErr);
      
      setProducts((prods || []).map(p => ({ label: p.name, value: p.id })));

      const { data: catalogTypes } = await supabase.from('catalog_types').select('id, code').in('code', ['WASTE_REASON', 'WASTE_STATUS']);
      if (catalogTypes) {
        const reasonType = catalogTypes.find(c => c.code === 'WASTE_REASON');
        const statusType = catalogTypes.find(c => c.code === 'WASTE_STATUS');

        if (reasonType) {
          const { data: reasonVals } = await supabase.from('catalog_values').select('id, name').eq('catalog_type_id', reasonType.id).eq('is_active', true);
          setReasons((reasonVals || []).map(r => ({ label: r.name, value: r.id })));
        }

        if (statusType) {
          const { data: statusVals } = await supabase.from('catalog_values').select('id, code').eq('catalog_type_id', statusType.id).eq('code', 'APPROVED');
          if (statusVals && statusVals.length > 0) setApprovedStatusId(statusVals[0].id);
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  const loadMermas = async () => {
    setLoading(true);
    try {
      // For cashiers, use JWT branch_id to match the same branch used for insert
      const queryBranchId = currentUser?.app_metadata?.branch_id || activeBranch.id;

      let query = supabase
        .from('waste_items')
        .select(`
          id, quantity,
          product:products(name),
          waste_record:waste_records!inner(
            waste_number, waste_date, metadata, notes, branch_id,
            reason:catalog_values!reason_id(name),
            reporter:profiles!reported_by(first_name, last_name, display_name)
          )
        `, { count: 'exact' })
        .eq('waste_record.branch_id', queryBranchId);

      // Advanced Filters
      if (advancedFilters.date_from) {
        query = query.gte('waste_record.waste_date', advancedFilters.date_from);
      }
      if (advancedFilters.date_to) {
        query = query.lte('waste_record.waste_date', advancedFilters.date_to);
      }
      if (advancedFilters.shift) {
        query = query.eq('waste_record.metadata->>shift', advancedFilters.shift);
      }

      // Global Search (Folio o Notas)
      if (globalSearch) {
        query = query.or(`waste_number.ilike.%${globalSearch}%,notes.ilike.%${globalSearch}%`, { foreignTable: 'waste_record' });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order('waste_date', { foreignTable: 'waste_record', ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setTotalRecords(count || 0);

      const formattedMermas = (data || []).map(item => {
        const reporter = item.waste_record?.reporter;
        const reporterName = reporter?.display_name || 
          ((reporter?.first_name || '') + ' ' + (reporter?.last_name || '')).trim() || 'Desconocido';
        return {
          id: item.id,
          date: item.waste_record?.waste_date,
          number: item.waste_record?.waste_number,
          product_name: item.product?.name || 'Desconocido',
          flavor: item.waste_record?.metadata?.flavor || '-',
          shift: item.waste_record?.metadata?.shift || '-',
          batch: item.waste_record?.metadata?.batch_number || '-',
          quantity: item.quantity,
          reason: item.waste_record?.reason?.name || '-',
          notes: item.waste_record?.notes,
          photo_url: item.waste_record?.metadata?.photo_url || null,
          reported_by_name: reporterName
        };
      });

      setMermas(formattedMermas);
    } catch (error) {
      console.error('Error al cargar mermas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product || !formData.quantity || !formData.reason || !formData.shift) {
       alert("Por favor llena todos los campos obligatorios.");
       return;
    }

    if (!window.confirm(`¿Estás seguro de registrar esta merma? Se descontarán ${formData.quantity} unidades del inventario de esta sucursal automáticamente.`)) {
      return;
    }
    
    setSaving(true);
    try {
      // 1. Generate a waste number
      const wasteNum = `MERMA-${new Date().getTime().toString().slice(-6)}`;

      let photoUrl = null;

      // 1.5 Subir Foto a Storage si existe
      if (photoFile) {
        setUploadingPhoto(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${wasteNum}_${Math.random()}.${fileExt}`;
        const filePath = `${activeBranch.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error("Error subiendo foto:", uploadError);
          alert("La merma se guardará, pero hubo un error subiendo la foto.");
        } else {
          const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(filePath);
          photoUrl = publicUrlData.publicUrl;
        }
        setUploadingPhoto(false);
      }

      // 2. Insert into waste_records
      const recordId = crypto.randomUUID();
      const orgId = currentUser.app_metadata?.organization_id || activeBranch.organization_id;
      const isCashier = currentUser.app_metadata?.roles?.includes('CASHIER');
      const jwtBranchId = currentUser.app_metadata?.branch_id;
      
      // DEBUG: Verificar qué branch_id se usará
      console.log('🔍 DEBUG Merma Insert:', {
        jwtBranchId,
        activeBranchId: activeBranch.id,
        activeBranchName: activeBranch.name,
        isCashier,
        orgId,
        roles: currentUser.app_metadata?.roles
      });

      // For cashiers: ALWAYS use JWT branch_id - never trust the UI store
      let branchId;
      if (isCashier) {
        if (!jwtBranchId) {
          alert('Error de seguridad: Tu sesión no tiene sucursal asignada. Cierra sesión e inicia de nuevo.');
          setSaving(false);
          return;
        }
        branchId = jwtBranchId;
      } else {
        // Admin can register in any branch
        branchId = activeBranch.id;
      }

      const { error: recordError } = await supabase
        .from('waste_records')
        .insert({
          id: recordId,
          organization_id: orgId,
          branch_id: branchId,
          waste_number: wasteNum,
          reported_by: currentUser.id,
          status_id: approvedStatusId,
          reason_id: formData.reason,
          waste_date: formData.date,
          metadata: {
            flavor: formData.flavor,
            shift: formData.shift,
            batch_number: formData.batch,
            photo_url: photoUrl
          },
          notes: formData.notes
        });

      if (recordError) throw recordError;

      // 3. Insert into waste_items (This triggers inventory deduction)
      const { error: itemsError } = await supabase
        .from('waste_items')
        .insert({
          organization_id: orgId,
          waste_record_id: recordId,
          product_id: formData.product,
          quantity: formData.quantity,
          unit_cost_at_time: 0,
          subtotal_loss: 0
        });

      if (itemsError) throw itemsError;

      setFormData({
        date: new Date().toISOString().split('T')[0],
        product: '',
        flavor: '',
        shift: '',
        quantity: '',
        batch: '',
        reason: '',
        notes: ''
      });
      setPhotoFile(null);
      loadMermas();
    } catch (error) {
      console.error('Error registrando merma:', error);
      alert('Error registrando merma: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = () => {
    if (mermas.length === 0) return;

    const dataToExport = mermas.map(m => ({
      'FECHA': m.date,
      'FOLIO': m.number,
      'TIPO DE PALETA / PRODUCTO': m.product_name,
      'SABOR': m.flavor,
      'TURNO': m.shift,
      'CANTIDAD DAÑADA': m.quantity,
      'LOTE': m.batch,
      'MOTIVO': m.reason,
      'NOTAS': m.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mermas');
    XLSX.writeFile(workbook, `Mermas_${activeBranch?.name.replace(/ /g, '_')}_${monthFilter}.xlsx`);
  };

  const totalMermas = mermas.reduce((sum, m) => sum + Number(m.quantity), 0);

  if (!activeBranch) return <div style={{textAlign: 'center', padding: '40px'}}>Selecciona una sucursal</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '0 20px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER / TITULO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: 'var(--neo-shadow-sm)' }}>
           <Trash2 size={32} />
         </div>
         <div>
           <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Control de Mermas</h1>
           <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Registro de producto dañado para conciliación.</p>
         </div>
      </div>

      {/* FORMULARIO DE REGISTRO */}
      <div className="neo-surface" style={{ padding: '0', borderRadius: '16px' }}>
        <div style={{ background: 'var(--color-secondary)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            Registrar Paletas Defectuosas
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          
          {/* Warning Message for Employees */}
          {currentUser && currentUser.app_metadata?.roles?.includes('CASHIER') && (
            <div style={{ 
              marginBottom: '0px', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--status-danger)'
            }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                <strong>Aviso Importante:</strong> El registro de mermas es irreversible. Una vez guardado, este reporte no podrá ser modificado ni eliminado y descontará el producto del inventario de forma permanente.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} style={{color: 'var(--primary-color)'}}/> Fecha <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoDatePicker 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageOpen size={16} style={{color: 'var(--primary-color)'}}/> Tipo de Paleta <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="product" 
                value={formData.product} 
                onChange={handleInputChange} 
                options={products} 
                placeholder="Ej. ORIGINAL" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box size={16} style={{color: 'var(--primary-color)'}}/> Sabor
              </label>
              <NeoSelect 
                name="flavor" 
                value={formData.flavor} 
                onChange={handleInputChange} 
                options={["COCO", "YOGURT GRIEGO", "NUEZ", "FRESA", "MAMEY"]} 
                placeholder="Ej. COCO" 
              />
            </div>
            
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '4px 0' }}></div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{color: 'var(--primary-color)'}}/> Turno <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="shift" 
                value={formData.shift} 
                onChange={handleInputChange} 
                options={shifts} 
                placeholder="Seleccionar Turno" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} style={{color: 'var(--primary-color)'}}/> Lote
              </label>
              <input type="text" name="batch" value={formData.batch} onChange={handleInputChange} className="neo-input" placeholder="Opcional" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{color: 'var(--primary-color)'}}/> Motivo / Razón <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="reason" 
                value={formData.reason} 
                onChange={handleInputChange} 
                options={reasons} 
                placeholder="Ej. Daño Físico" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageOpen size={16} style={{color: 'var(--primary-color)'}}/> Evidencia Fotográfica (Opcional)
              </label>
              <div style={{ position: 'relative', width: '100%', height: '44px', display: 'flex', alignItems: 'center', background: 'var(--background-color)', border: '1px dashed var(--text-muted)', borderRadius: '12px', padding: '0 16px', cursor: 'pointer', overflow: 'hidden' }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: photoFile ? 'var(--status-ok)' : 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {photoFile ? photoFile.name : 'Subir o tomar foto...'}
                </span>
              </div>
            </div>

          </div>

          {/* TOTAL HIGHLIGHT ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '20px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '250px' }}>
              <label style={{ fontSize: '0.9rem', color: '#d97706', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <AlertTriangle size={18} /> Cantidad Dañada <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>#</span>
                <input type="number" name="quantity" step="1" min="1" required value={formData.quantity} onChange={handleInputChange} className="neo-input" placeholder="0" style={{ padding: '16px 16px 16px 36px', borderRadius: '12px', background: 'white', border: '2px solid rgba(245, 158, 11, 0.3)', fontSize: '1.2rem', fontWeight: 800, color: '#d97706', width: '100%', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)' }} />
              </div>
            </div>

            <button type="submit" className="neo-btn neo-btn-primary" disabled={saving} style={{ padding: '16px 40px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(30, 58, 138, 0.3)', transition: 'all 0.3s ease' }}>
              {saving ? <Trash2 className="spin" size={22} /> : <Plus size={22} />} 
              {saving ? 'Registrando...' : 'Registrar Merma'}
            </button>
          </div>

        </form>
      </div>

      {/* CONTROLES AVANZADOS Y RESUMEN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Top Summary Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div className="neo-surface fade-in" style={{ padding: '16px 32px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--neo-shadow-sm)' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <AlertTriangle size={28} style={{ color: '#d97706' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '2px' }}>Total Registros Actuales</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>
                {totalRecords} Mermas
              </div>
            </div>
          </div>
          
          <button onClick={exportExcel} className="neo-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 24px', fontWeight: 600 }}>
            <Download size={18} /> Exportar Reporte
          </button>
        </div>

        {/* Universal Filter Component */}
        <NeoAdvancedFilter 
          globalSearch={globalSearch}
          onSearchChange={setGlobalSearch}
          filters={advancedFilters}
          onFilterApply={applyAdvancedFilter}
          onClearFilters={clearFilters}
          filterConfig={[
            { id: 'date_from', label: 'Desde Fecha', type: 'date' },
            { id: 'date_to', label: 'Hasta Fecha', type: 'date' },
            { id: 'shift', label: 'Turno', type: 'select', options: [{val: 'TURNO MAÑANA', label: 'Mañana'}, {val: 'TURNO TARDE', label: 'Tarde'}] }
          ]}
        />
      </div>


      {/* TABLA DE MERMAS */}
      <div className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando mermas del mes...</div>
        ) : mermas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--background-color)', padding: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={48} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Sin mermas registradas</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Excelente trabajo. No hay paletas defectuosas en este mes.</p>
          </div>
        ) : (
          <div className="neo-table-container">
            <table className="neo-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px', borderTopLeftRadius: '12px' }}>FECHA</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>TIPO DE PALETA</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>SABOR</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>TURNO</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>CANTIDAD</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>LOTE</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>MOTIVO</th>
                  {isAdmin && <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>REGISTRADO POR</th>}
                  <th style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px', borderTopRightRadius: '12px' }}>FOTO</th>
                </tr>
              </thead>
              <tbody>
                {mermas.map((m, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{new Date(m.date + 'T12:00:00').toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{m.product_name}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{m.flavor}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.shift}</td>
                    <td style={{ padding: '12px', fontSize: '1rem', fontWeight: 800, color: '#d97706', textAlign: 'center' }}>
                      {m.quantity}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.batch}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{m.reason}</td>
                    {isAdmin && <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.reported_by_name}</td>}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {m.photo_url ? (
                        <a href={m.photo_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                          <img src={m.photo_url} alt="Evidencia" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '2px solid rgba(26, 79, 153, 0.15)', cursor: 'pointer' }} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {totalRecords > 0 && !loading && (
          <NeoPagination 
            currentPage={page}
            pageSize={pageSize}
            totalCount={totalRecords}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
