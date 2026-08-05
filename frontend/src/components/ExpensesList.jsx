import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Plus, Download, Wallet, CreditCard, Building, Tags, Search, Calendar, FileText, MapPin, Hash, User, CircleDollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import { NeoSelect } from './NeoSelect';
import { NeoDatePicker } from './NeoDatePicker';

export function ExpensesList() {
  const { activeBranch } = useBranchStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Opciones autocompletadas combinadas (por defecto + base de datos)
  const [categories, setCategories] = useState(['INSUMO', 'LIMPIEZA', 'MANTENIMIENTO', 'SERVICIOS', 'NÓMINA', 'MARKETING', 'OTROS']);
  const [establishments, setEstablishments] = useState(['OFFICE DEPOT', 'CHEDRAUI', 'SAMS CLUB', 'WALMART', 'MERCADO LIBRE', 'AMAZON', 'OTRO']);
  const [paymentMethods, setPaymentMethods] = useState(['EFECTIVO', 'TARJETA DE DÉBITO', 'TARJETA DE CRÉDITO', 'TRANSFERENCIA']);
  const [responsibles, setResponsibles] = useState(['ALEJANDRA', 'YAZETH', 'ELEAZAR']);

  // Estado del formulario
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    concept: '',
    establishment: '',
    amount: '',
    folio: '',
    payment_method: '',
    responsible: ''
  });

  const [saving, setSaving] = useState(false);
  const [monthFilter, setMonthFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (activeBranch) {
      fetchExpenses();
    }
  }, [activeBranch, monthFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Parsear mes y año
      const [year, month] = monthFilter.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Último día del mes

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('branch_id', activeBranch.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);

      // Extraer valores únicos de la base de datos para autocompletar
      if (data && data.length > 0) {
        updateDatalists(data);
      }
    } catch (err) {
      console.error('Error al cargar gastos:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDatalists = (data) => {
    const unique = (arr) => [...new Set(arr)].filter(Boolean);
    
    setCategories(prev => unique([...prev, ...data.map(d => d.category)]));
    setEstablishments(prev => unique([...prev, ...data.map(d => d.establishment)]));
    setPaymentMethods(prev => unique([...prev, ...data.map(d => d.payment_method)]));
    setResponsibles(prev => unique([...prev, ...data.map(d => d.responsible)]));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Forzamos mayúsculas para mantener consistencia
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'amount' || name === 'date' || name === 'folio') ? value : value.toUpperCase() 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBranch) return;

    if (formData.amount <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('expenses')
        .insert({
          branch_id: activeBranch.id,
          date: formData.date,
          category: formData.category.trim(),
          concept: formData.concept.trim(),
          establishment: formData.establishment.trim(),
          amount: parseFloat(formData.amount),
          folio: formData.folio.trim() || null,
          payment_method: formData.payment_method.trim(),
          responsible: formData.responsible.trim()
        });

      if (error) throw error;

      alert("Gasto registrado con éxito.");
      
      // Limpiar formulario manteniendo fecha, responsable y método de pago por comodidad
      setFormData(prev => ({
        ...prev,
        category: '',
        concept: '',
        establishment: '',
        amount: '',
        folio: ''
      }));

      fetchExpenses();
    } catch (err) {
      console.error("Error al guardar gasto:", err);
      alert("Ocurrió un error al intentar guardar el gasto.");
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = () => {
    if (expenses.length === 0) return;
    
    const exportData = expenses.map(e => ({
      'FECHA': e.date,
      'CATEGORÍA (Menú)': e.category,
      'ARTÍCULO / CONCEPTO': e.concept,
      'ESTABLECIMIENTO': e.establishment,
      'MONTO ($)': Number(e.amount),
      'FOLIO': e.folio || '',
      'MÉTODO DE PAGO': e.payment_method,
      'RESPONSABLE': e.responsible
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gastos");
    
    // Auto-size columns
    const maxWidths = [12, 20, 30, 20, 15, 15, 20, 20];
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `Gastos_${activeBranch?.name.replace(/ /g, '_')}_${monthFilter}.xlsx`);
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (!activeBranch) return <div style={{textAlign: 'center', padding: '40px'}}>Selecciona una sucursal</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      

      {/* FORMULARIO DE REGISTRO (Estilo rápido) */}
      <div className="neo-surface" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ background: 'var(--primary-color)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
            <Wallet size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            Registrar Nuevo Gasto
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            {/* ROW 1: Detalles Principales */}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tags size={16} style={{color: 'var(--primary-color)'}}/> Categoría <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="category" 
                value={formData.category} 
                onChange={handleInputChange} 
                options={categories} 
                placeholder="Ej. INSUMO" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{color: 'var(--primary-color)'}}/> Concepto / Artículo <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <input type="text" name="concept" required value={formData.concept} onChange={handleInputChange} className="neo-input" placeholder="¿Qué compraste?" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
            </div>
            
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '4px 0' }}></div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            {/* ROW 2: Detalles Secundarios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} style={{color: 'var(--primary-color)'}}/> Establecimiento <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="establishment" 
                value={formData.establishment} 
                onChange={handleInputChange} 
                options={establishments} 
                placeholder="Ej. OFFICE DEPOT" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Hash size={16} style={{color: 'var(--primary-color)'}}/> Folio / Ticket
              </label>
              <input type="text" name="folio" value={formData.folio} onChange={handleInputChange} className="neo-input" placeholder="Opcional" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--background-color)', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} style={{color: 'var(--primary-color)'}}/> Método Pago <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="payment_method" 
                value={formData.payment_method} 
                onChange={handleInputChange} 
                options={paymentMethods} 
                placeholder="Ej. EFECTIVO" 
                required 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} style={{color: 'var(--primary-color)'}}/> Responsable <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <NeoSelect 
                name="responsible" 
                value={formData.responsible} 
                onChange={handleInputChange} 
                options={responsibles} 
                placeholder="Ej. ALEJANDRA" 
                required 
              />
            </div>

          </div>

          {/* TOTAL HIGHLIGHT ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '20px', background: 'rgba(220, 38, 38, 0.03)', border: '1px solid rgba(220, 38, 38, 0.1)', borderRadius: '16px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '250px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--status-danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <CircleDollarSign size={18} /> Monto Total <span style={{color: 'var(--status-danger)'}}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-danger)' }}>$</span>
                <input type="number" name="amount" step="0.01" min="0.01" required value={formData.amount} onChange={handleInputChange} className="neo-input" placeholder="0.00" style={{ padding: '16px 16px 16px 36px', borderRadius: '12px', background: 'white', border: '2px solid rgba(220, 38, 38, 0.3)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-danger)', width: '100%', boxShadow: '0 4px 12px rgba(220,38,38,0.1)' }} />
              </div>
            </div>

            <button type="submit" className="neo-btn neo-btn-primary" disabled={saving} style={{ padding: '16px 40px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(30, 58, 138, 0.3)', transition: 'all 0.3s ease' }}>
              {saving ? <Wallet className="spin" size={22} /> : <Plus size={22} />} 
              {saving ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>

        </form>
      </div>

      {/* CONTROLES Y RESUMEN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div className="neo-surface" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: '12px', color: 'white' }}>
              <Calendar size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Mes de Consulta
              </label>
              <input 
                type="month" 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)} 
                style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}
              />
            </div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'rgba(0,0,0,0.1)', margin: '0 8px' }}></div>
          <button onClick={exportExcel} className="neo-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 24px', fontWeight: 600 }}>
            <Download size={18} /> Exportar Reporte
          </button>
        </div>
        
        <div className="neo-surface fade-in" style={{ padding: '16px 32px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(220, 38, 38, 0.05) 100%)', border: '1px solid rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: 'var(--neo-shadow-sm)' }}>
          <div style={{ background: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: '12px' }}>
            <Wallet size={28} style={{ color: 'var(--status-danger)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '2px' }}>Total Gastado ({monthFilter})</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-danger)' }}>
              $ {totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE GASTOS */}
      <div className="neo-surface" style={{ padding: '24px', borderRadius: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando gastos del mes...</div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--background-color)', padding: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={48} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Sin gastos este mes</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No se han registrado salidas de dinero para la sucursal seleccionada.</p>
          </div>
        ) : (
          <div className="neo-table-container">
            <table className="neo-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px', borderTopLeftRadius: '12px' }}>FECHA</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>CATEGORÍA</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>CONCEPTO</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>ESTABLECIMIENTO</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>MONTO ($)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>FOLIO</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px' }}>MÉTODO</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', background: 'var(--color-secondary)', color: 'white', fontWeight: 600, letterSpacing: '0.5px', borderTopRightRadius: '12px' }}>RESPONSABLE</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, idx) => (
                  <tr key={e.id} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{new Date(e.date + 'T12:00:00').toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 600 }}>{e.category}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem' }}>{e.concept}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{e.establishment}</td>
                    <td style={{ padding: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--status-danger)', textAlign: 'center' }}>
                      ${Number(e.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{e.folio || '-'}</td>
                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{e.payment_method}</td>
                    <td style={{ padding: '12px', fontSize: '0.9rem', fontStyle: 'italic' }}>{e.responsible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
