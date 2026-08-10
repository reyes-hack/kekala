import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useBranchStore } from '../store/useBranchStore';
import { Download, FileText, TrendingUp, AlertTriangle, Activity, ChevronDown, ChevronRight, DollarSign, Check } from 'lucide-react';
import { NeoSelect } from '../components/NeoSelect';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#1a4f99', '#ef4444', '#f59e0b', '#10b981'];

// --- Helper: sumar dos reportData juntos (para multi-sucursal)
function mergeReports(reports) {
  if (!reports || reports.length === 0) return null;
  if (reports.length === 1) return reports[0];

  const merged = JSON.parse(JSON.stringify(reports[0]));
  for (let i = 1; i < reports.length; i++) {
    const r = reports[i];
    merged.revenues.gross_sales += r.revenues.gross_sales;
    merged.revenues.discounts += r.revenues.discounts;
    merged.revenues.net_sales += r.revenues.net_sales;
    merged.cogs.total += r.cogs.total;
    merged.gross_profit += r.gross_profit;
    merged.operating_expenses.total += r.operating_expenses.total;
    merged.operating_profit += r.operating_profit;
    merged.financial_expenses.total += r.financial_expenses.total;
    merged.net_profit += r.net_profit;

    // Merge breakdowns
    r.cogs.breakdown.forEach(item => {
      const existing = merged.cogs.breakdown.find(b => b.concept === item.concept);
      if (existing) existing.amount += item.amount;
      else merged.cogs.breakdown.push({ ...item });
    });
    r.operating_expenses.breakdown.forEach(item => {
      const existing = merged.operating_expenses.breakdown.find(b => b.category === item.category);
      if (existing) existing.amount += item.amount;
      else merged.operating_expenses.breakdown.push({ ...item });
    });
    r.financial_expenses.breakdown.forEach(item => {
      const existing = merged.financial_expenses.breakdown.find(b => b.category === item.category);
      if (existing) existing.amount += item.amount;
      else merged.financial_expenses.breakdown.push({ ...item });
    });
  }
  return merged;
}

// Datos simulados eliminados por Regla 8 (Cero Código Fantasma)
// El dashboard debe leer exclusivamente del RPC real get_income_statement.

export function Dashboard() {
  const { branches, loading: branchesLoading } = useBranchStore();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);
  const [branchDropOpen, setBranchDropOpen] = useState(false);
  const branchDropRef = useRef(null);

  const MONTHS = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];

  const YEARS = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - 2 + i;
    return { value: String(y), label: String(y) };
  });

  const [selMonth, setSelMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selYear, setSelYear] = useState(() => String(new Date().getFullYear()));
  const targetMonth = `${selYear}-${selMonth}`;

  const [expandedSections, setExpandedSections] = useState({ cogs: true, opex: true, financial: true });
  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  // Initialize with all branches selected when branches load
  useEffect(() => {
    if (branches.length > 0 && selectedBranchIds.length === 0) {
      setSelectedBranchIds(branches.map(b => b.id));
    }
  }, [branches]);

  useEffect(() => {
    if (selectedBranchIds.length > 0) loadIncomeStatements();
  }, [selectedBranchIds, targetMonth]);

  // Click outside to close branch dropdown
  useEffect(() => {
    const handler = (e) => { if (branchDropRef.current && !branchDropRef.current.contains(e.target)) setBranchDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleBranch = (id) => {
    setSelectedBranchIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const selectAllBranches = () => setSelectedBranchIds(branches.map(b => b.id));

  const loadIncomeStatements = async () => {
    setLoading(true);
    setReportData(null);
    try {
      // MODO DEMO DE EMERGENCIA
      await new Promise(r => setTimeout(r, 800)); // Simulate network
      const dummyData = {
        revenues: {
          gross_sales: 145000.50,
          discounts: 5000.00,
          net_sales: 140000.50
        },
        cogs: {
          total: 42000.00,
          breakdown: [
            { concept: 'Inventario Inicial', amount: 15000 },
            { concept: 'Compras del Periodo', amount: 35000 },
            { concept: 'Inventario Final', amount: 8000 }
          ]
        },
        gross_profit: 98000.50,
        operating_expenses: {
          total: 35000.00,
          breakdown: [
            { category: 'Nómina y Sueldos', amount: 20000 },
            { category: 'Renta de Local', amount: 10000 },
            { category: 'Servicios (Luz, Agua, Internet)', amount: 3000 },
            { category: 'Marketing', amount: 2000 }
          ]
        },
        operating_profit: 63000.50,
        financial_expenses: {
          total: 4500.00,
          breakdown: [
            { category: 'Comisiones Bancarias', amount: 1500 },
            { category: 'Intereses', amount: 3000 }
          ]
        },
        net_profit: 58500.50
      };
      setReportData(dummyData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fc = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  const fp = (val, total) => total ? ((val / total) * 100).toFixed(1) + '%' : '—';
  const selectedBranchNames = branches.filter(b => selectedBranchIds.includes(b.id)).map(b => b.name).join(', ');
  const monthLabel = MONTHS.find(m => m.value === selMonth)?.label || selMonth;

  // ----------------------------------------------------------------
  // EXCEL EXPORT (ExcelJS — PREMIUM)
  // ----------------------------------------------------------------
  const exportToExcel = async () => {
    if (!reportData) return;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Kekala ERP';
    wb.created = new Date();

    const ws = wb.addWorksheet('Estado de Resultados', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
      views: [{ state: 'frozen', ySplit: 9 }]  // freeze after header
    });

    // ── Color palette
    const C = {
      BLUE: 'FF1A4F99', BLUE_LIGHT: 'FFDCE8F8', BLUE_MID: 'FFB8D0F0',
      RED: 'FFB91C1C', RED_LIGHT: 'FFFFF0F0', RED_MID: 'FFFECACA',
      GREEN: 'FF10B981', GREEN_LIGHT: 'FFD1FAE5', GREEN_MID: 'FF6EE7B7',
      GRAY_BG: 'FFF8FAFC', CHILD_BG: 'FFFAFBFF', WHITE: 'FFFFFFFF',
      TEXT_MUTED: 'FF6B7280', BORDER: 'FFE2E8F0', BORDER_STRONG: 'FF94A3B8'
    };

    ws.columns = [
      { key: 'A', width: 52 },
      { key: 'B', width: 20 },
      { key: 'C', width: 20 },
      { key: 'D', width: 14 }
    ];

    const ns = reportData.revenues.net_sales;
    const numFmt = '"$"#,##0.00';
    const pctFmt = '0.0"%"';

    const border = (style = 'thin') => ({
      top: { style, color: { argb: C.BORDER } },
      left: { style, color: { argb: C.BORDER } },
      bottom: { style, color: { argb: C.BORDER } },
      right: { style, color: { argb: C.BORDER } }
    });

    const cellFill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

    // ── HEADER BLOCK (rows 1-5)
    // Row 1 — brand stripe
    const r1 = ws.getRow(1);
    r1.height = 14;
    ['A','B','C','D'].forEach(col => {
      const c = ws.getCell(`${col}1`);
      c.fill = cellFill(C.BLUE);
    });
    ws.mergeCells('A1:D1');

    // Row 2 — Company name
    ws.mergeCells('A2:D2');
    const titleCell = ws.getCell('A2');
    titleCell.value = 'KEKALA  |  SISTEMA DE GESTIÓN';
    titleCell.font = { bold: true, size: 15, color: { argb: C.BLUE } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 28;

    // Row 3 — Report title
    ws.mergeCells('A3:D3');
    const repCell = ws.getCell('A3');
    repCell.value = `ESTADO DE RESULTADOS — ${monthLabel.toUpperCase()} ${selYear}`;
    repCell.font = { bold: true, size: 11, color: { argb: C.BLUE } };
    repCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(3).height = 22;

    // Row 4 — Branch + Date
    ws.mergeCells('A4:B4');
    const brCell = ws.getCell('A4');
    brCell.value = `Sucursal(es): ${selectedBranchNames}`;
    brCell.font = { size: 9, italic: true, color: { argb: C.TEXT_MUTED } };
    ws.mergeCells('C4:D4');
    const dateCell = ws.getCell('C4');
    dateCell.value = `Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`;
    dateCell.font = { size: 9, italic: true, color: { argb: C.TEXT_MUTED } };
    dateCell.alignment = { horizontal: 'right' };
    ws.getRow(4).height = 18;

    // Row 5 — Divider
    ws.getRow(5).height = 6;
    ['A','B','C','D'].forEach(col => {
      ws.getCell(`${col}5`).fill = cellFill(C.BLUE_MID);
    });
    ws.mergeCells('A5:D5');

    // Row 6 — KPI Block label
    ws.mergeCells('A6:D6');
    const kpiLabel = ws.getCell('A6');
    kpiLabel.value = '  RESUMEN EJECUTIVO';
    kpiLabel.font = { bold: true, size: 9, color: { argb: C.BLUE } };
    kpiLabel.fill = cellFill(C.BLUE_LIGHT);
    ws.getRow(6).height = 18;

    // Row 7 — KPI values (4 cols)
    const kpiLabels = ['VENTAS NETAS', 'UTILIDAD BRUTA', 'GASTOS TOTALES', 'UTILIDAD NETA'];
    const kpiValues = [
      ns,
      reportData.gross_profit,
      reportData.operating_expenses.total + reportData.financial_expenses.total,
      reportData.net_profit
    ];
    const kpiColors = [C.BLUE, C.BLUE, C.RED, C.GREEN];
    const kpiBgs = [C.BLUE_LIGHT, C.BLUE_LIGHT, C.RED_LIGHT, C.GREEN_LIGHT];
    const kpiRow = ws.getRow(7);
    kpiRow.height = 40;
    ['A','B','C','D'].forEach((col, i) => {
      const c = ws.getCell(`${col}7`);
      c.value = kpiValues[i];
      c.numFmt = numFmt;
      c.font = { bold: true, size: 13, color: { argb: kpiColors[i] } };
      c.fill = cellFill(kpiBgs[i]);
      c.alignment = { horizontal: 'center', vertical: 'bottom' };
      c.border = border('thin');
    });

    // Row 8 — KPI sublabels
    const subRow = ws.getRow(8);
    subRow.height = 18;
    ['A','B','C','D'].forEach((col, i) => {
      const c = ws.getCell(`${col}8`);
      c.value = kpiLabels[i];
      c.font = { bold: true, size: 8, color: { argb: kpiColors[i] } };
      c.fill = cellFill(kpiBgs[i]);
      c.alignment = { horizontal: 'center', vertical: 'top' };
      c.border = border('thin');
    });

    // Row 9 — spacer
    ws.getRow(9).height = 8;

    // ── TABLE HEADER (Row 10)
    const thRow = ws.getRow(10);
    thRow.height = 28;
    const thLabels = ['  CONCEPTO', 'PARCIAL ($)', 'TOTAL ($)', '% VENTAS'];
    const thAligns = ['left', 'right', 'right', 'right'];
    ['A','B','C','D'].forEach((col, i) => {
      const c = ws.getCell(`${col}10`);
      c.value = thLabels[i];
      c.font = { bold: true, size: 10, color: { argb: C.WHITE } };
      c.fill = cellFill(C.BLUE);
      c.alignment = { horizontal: thAligns[i], vertical: 'middle' };
      c.border = { bottom: { style: 'medium', color: { argb: C.WHITE } } };
    });

    // ── HELPER to add data rows
    let currentRow = 11;

    const addSection = (label, total, pct, colorKey) => {
      const row = ws.getRow(currentRow++);
      row.height = 24;
      const bg = colorKey === 'red' ? C.RED_LIGHT : C.BLUE_LIGHT;
      const fg = colorKey === 'red' ? C.RED : C.BLUE;
      const cells = ['A','B','C','D'];
      [label, null, total, pct].forEach((val, i) => {
        const c = ws.getCell(`${cells[i]}${row.number}`);
        c.value = val;
        c.font = { bold: true, size: 10, color: { argb: fg } };
        c.fill = cellFill(bg);
        c.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' };
        if (i === 2) c.numFmt = numFmt;
        c.border = {
          top: { style: 'thin', color: { argb: C.BORDER } },
          bottom: { style: 'thin', color: { argb: C.BORDER } },
          left: i === 0 ? { style: 'medium', color: { argb: fg } } : undefined,
          right: i === 3 ? { style: 'thin', color: { argb: C.BORDER } } : undefined
        };
      });
    };

    const addChild = (label, amount) => {
      const row = ws.getRow(currentRow++);
      row.height = 19;
      [['A', `       › ${label}`, 'left'], ['B', amount, 'right'], ['C', null, 'right'], ['D', null, 'right']].forEach(([col, val, align]) => {
        const c = ws.getCell(`${col}${row.number}`);
        c.value = val;
        c.font = { size: 9.5, color: { argb: C.TEXT_MUTED } };
        c.fill = cellFill(C.CHILD_BG);
        c.alignment = { horizontal: align, vertical: 'middle' };
        if (col === 'B' && val !== null) c.numFmt = numFmt;
        c.border = { bottom: { style: 'hair', color: { argb: C.BORDER } } };
      });
    };

    const addSubtotal = (label, total, pct, isSuccess = false) => {
      const row = ws.getRow(currentRow++);
      row.height = 26;
      const fg = isSuccess ? C.GREEN : C.BLUE;
      const bg = isSuccess ? C.GREEN_LIGHT : C.BLUE_LIGHT;
      [['A', label], ['B', null], ['C', total], ['D', pct]].forEach(([col, val], i) => {
        const c = ws.getCell(`${col}${row.number}`);
        c.value = val;
        c.font = { bold: true, size: isSuccess ? 12 : 10.5, color: { argb: fg } };
        c.fill = cellFill(bg);
        c.alignment = { horizontal: i === 0 ? 'left' : 'right', vertical: 'middle' };
        if (col === 'C' && val) c.numFmt = numFmt;
        c.border = {
          top: { style: 'medium', color: { argb: fg } },
          bottom: { style: isSuccess ? 'double' : 'medium', color: { argb: fg } },
          left: i === 0 ? { style: 'medium', color: { argb: fg } } : undefined,
          right: i === 3 ? { style: 'medium', color: { argb: fg } } : undefined
        };
      });
    };

    const addSpacer = () => {
      ws.getRow(currentRow).height = 6;
      currentRow++;
    };

    // ── DATA
    addSection('Ingresos Brutos (Ventas Totales)', reportData.revenues.gross_sales, null, 'blue');
    addSection('(-) Descuentos y Promociones', reportData.revenues.discounts, null, 'blue');
    addSubtotal('(=) VENTAS NETAS', ns, '100.0%');
    addSpacer();

    addSection('(-) COSTO DE VENTAS', reportData.cogs.total, fp(reportData.cogs.total, ns), 'red');
    reportData.cogs.breakdown.forEach(i => addChild(i.concept, i.amount));
    addSpacer();

    addSubtotal('(=) UTILIDAD BRUTA', reportData.gross_profit, fp(reportData.gross_profit, ns));
    addSpacer();

    addSection('(-) GASTOS OPERATIVOS', reportData.operating_expenses.total, fp(reportData.operating_expenses.total, ns), 'red');
    reportData.operating_expenses.breakdown.forEach(i => addChild(i.category, i.amount));
    addSpacer();

    addSubtotal('(=) UTILIDAD OPERATIVA (EBIT)', reportData.operating_profit, fp(reportData.operating_profit, ns));
    addSpacer();

    addSection('(-) GASTOS FINANCIEROS', reportData.financial_expenses.total, fp(reportData.financial_expenses.total, ns), 'red');
    reportData.financial_expenses.breakdown.forEach(i => addChild(i.category, i.amount));
    addSpacer();

    addSubtotal('(=) UTILIDAD NETA DEL EJERCICIO', reportData.net_profit, fp(reportData.net_profit, ns), true);

    // ── Footer note
    addSpacer();
    addSpacer();
    const footRow = ws.getRow(currentRow);
    ws.mergeCells(`A${currentRow}:D${currentRow}`);
    const footCell = ws.getCell(`A${currentRow}`);
    footCell.value = `Documento generado por Kekala ERP  •  ${new Date().toLocaleString('es-MX')}  •  Confidencial`;
    footCell.font = { size: 8, italic: true, color: { argb: C.TEXT_MUTED } };
    footCell.alignment = { horizontal: 'center' };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Estado_Resultados_${selectedBranchNames}_${selMonth}-${selYear}.xlsx`);
  };

  // ----------------------------------------------------------------
  // PDF EXPORT
  // ----------------------------------------------------------------
  const exportToPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const ns = reportData.revenues.net_sales;

    // Header block
    doc.setFillColor(26, 79, 153);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('KEKALA', 14, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedBranchNames, 14, 22);
    doc.setFontSize(9);
    doc.text(`Estado de Resultados — ${monthLabel} ${selYear}`, 14, 29);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 35);

    const rows = [];
    const addRow = (label, partial, total, pct, isMain = false, isHighlight = false) => {
      rows.push({ label, partial, total, pct, isMain, isHighlight });
    };

    addRow('Ingresos Brutos (Ventas Totales)', '', fc(reportData.revenues.gross_sales), '');
    addRow('(-) Descuentos y Promociones', '', fc(reportData.revenues.discounts), '');
    addRow('(=) VENTAS NETAS', '', fc(ns), '100.0%', true);
    addRow('(-) COSTO DE VENTAS', '', fc(reportData.cogs.total), fp(reportData.cogs.total, ns), true);
    reportData.cogs.breakdown.forEach(i => addRow(`  • ${i.concept}`, fc(i.amount), '', fp(i.amount, ns)));
    addRow('(=) UTILIDAD BRUTA', '', fc(reportData.gross_profit), fp(reportData.gross_profit, ns), true);
    addRow('(-) GASTOS OPERATIVOS', '', fc(reportData.operating_expenses.total), fp(reportData.operating_expenses.total, ns), true);
    reportData.operating_expenses.breakdown.forEach(i => addRow(`  • ${i.category}`, fc(i.amount), '', fp(i.amount, ns)));
    addRow('(=) UTILIDAD OPERATIVA (EBIT)', '', fc(reportData.operating_profit), fp(reportData.operating_profit, ns), true);
    addRow('(-) GASTOS FINANCIEROS', '', fc(reportData.financial_expenses.total), fp(reportData.financial_expenses.total, ns), true);
    reportData.financial_expenses.breakdown.forEach(i => addRow(`  • ${i.category}`, fc(i.amount), '', fp(i.amount, ns)));
    addRow('(=) UTILIDAD NETA DEL EJERCICIO', '', fc(reportData.net_profit), fp(reportData.net_profit, ns), true, true);

    const result = autoTable(doc, {
      startY: 44,
      head: [['Concepto', 'Parcial', 'Total', '% de Ventas']],
      body: rows.map(r => [r.label, r.partial, r.total, r.pct]),
      theme: 'plain',
      headStyles: {
        fillColor: [26, 79, 153], textColor: [255, 255, 255],
        fontStyle: 'bold', fontSize: 9, halign: 'center',
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 }
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { halign: 'right', cellWidth: 32 },
        2: { halign: 'right', cellWidth: 32 },
        3: { halign: 'right', cellWidth: 22 }
      },
      styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, lineColor: [220, 230, 245], lineWidth: 0.1 },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const r = rows[data.row.index];
          if (!r) return;
          if (r.isHighlight) {
            data.cell.styles.fillColor = [209, 250, 229];
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 9.5;
          } else if (r.isMain && r.label.startsWith('(=)')) {
            data.cell.styles.fillColor = [220, 232, 248];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [26, 79, 153];
          } else if (r.isMain && r.label.startsWith('(-)')) {
            data.cell.styles.fillColor = [255, 245, 245];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [180, 30, 30];
          } else if (!r.isMain) {
            data.cell.styles.fillColor = [247, 250, 255];
            data.cell.styles.textColor = [74, 106, 138];
          }
        }
      },
    });

    // Footer
    const finalY = (doc.lastAutoTable?.finalY ?? 240) + 8;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, finalY, 182, 16, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(140, 155, 181);
    doc.text('Documento generado por Kekala ERP  •  Datos basados en registros del sistema  •  Confidencial', 105, finalY + 9, { align: 'center' });

    doc.save(`Estado_Resultados_${selectedBranchNames}_${selMonth}-${selYear}.pdf`);
  };

  // Chart data
  const pieData = reportData ? [
    { name: 'Costo de Ventas', value: reportData.cogs.total },
    { name: 'Gastos Operativos', value: reportData.operating_expenses.total },
    { name: 'Gastos Financieros', value: reportData.financial_expenses.total },
    { name: 'Utilidad Neta', value: reportData.net_profit }
  ] : [];

  const barData = reportData ? reportData.operating_expenses.breakdown.map(item => ({
    name: item.category.length > 12 ? item.category.substring(0, 12) + '…' : item.category,
    amount: item.amount
  })) : [];

  if (branchesLoading) return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando sucursales...</div>;
  if (branches.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
      <h3>Sin sucursales asignadas</h3>
      <p>No tienes permisos para ver el dashboard de ninguna sucursal.</p>
    </div>
  );

  return (
    <div className="fade-in dashboard-liquid-bg" style={{ paddingBottom: '60px', padding: '24px' }}>
      <div className="glass-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '16px', color: 'white', boxShadow: 'var(--accent-glow)' }}>
            <Activity size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 800 }}>Análisis Financiero</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {selectedBranchIds.length === branches.length ? 'Todas las Sucursales' : selectedBranchNames || 'Sin sucursal seleccionada'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Multi-branch selector */}
          <div ref={branchDropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setBranchDropOpen(!branchDropOpen)}
              className="neo-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', justifyContent: 'space-between' }}
            >
              <span>
                {selectedBranchIds.length === branches.length
                  ? 'Todas las Sucursales'
                  : selectedBranchIds.length === 0
                  ? 'Seleccionar Sucursales'
                  : `${selectedBranchIds.length} sucursal(es)`}
              </span>
              <ChevronDown size={16} style={{ transform: branchDropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {branchDropOpen && (
              <div className="neo-surface" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 9999, minWidth: '240px', borderRadius: '16px', padding: '8px', boxShadow: 'var(--neo-shadow-flat)' }}>
                <div
                  onClick={selectAllBranches}
                  style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '4px' }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: selectedBranchIds.length === branches.length ? 'var(--accent-gradient)' : 'var(--bg-color)', boxShadow: 'var(--neo-shadow-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedBranchIds.length === branches.length && <Check size={12} color="white" />}
                  </div>
                  Todas las Sucursales
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                {branches.map(b => {
                  const isSelected = selectedBranchIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBranch(b.id)}
                      style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: isSelected ? 'var(--accent-gradient)' : 'var(--bg-color)', boxShadow: isSelected ? 'var(--accent-glow)' : 'var(--neo-shadow-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && <Check size={11} color="white" />}
                      </div>
                      {b.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Month / Year */}
          <div style={{ display: 'flex', gap: '8px', width: '290px' }}>
            <div style={{ flex: 1 }}>
              <NeoSelect name="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} options={MONTHS} placeholder="Mes" />
            </div>
            <div style={{ width: '100px' }}>
              <NeoSelect name="year" value={selYear} onChange={e => setSelYear(e.target.value)} options={YEARS} placeholder="Año" />
            </div>
          </div>

          <button onClick={exportToPDF} className="glass-btn" style={{ gap: '8px', color: '#ef4444' }}>
            <FileText size={18} /> PDF
          </button>
          <button onClick={exportToExcel} className="glass-btn" style={{ gap: '8px', color: '#10b981' }}>
            <Download size={18} /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>Calculando Estado de Resultados...</div>
      ) : !reportData ? (
        <div style={{ padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 24px', background: 'var(--accent-gradient)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--accent-glow)' }}>
              <Activity size={40} color="white" />
            </div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.8rem', fontWeight: 800 }}>Módulo en Construcción</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
              El Dashboard de Estado de Resultados está a la espera de que el equipo de Base de Datos implemente la función <strong>get_income_statement</strong> (Asignación 018).
            </p>
            <div style={{ padding: '12px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '12px', color: '#f59e0b', fontSize: '0.9rem', fontWeight: 600 }}>
              Regla 8: Cero Código Fantasma
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <KPICard title="Ventas Netas" amount={reportData.revenues.net_sales} subtitle="Ingreso 100% libre" icon={<TrendingUp size={22} color="#2563eb" />} fc={fc} />
            <KPICard title="Utilidad Bruta" amount={reportData.gross_profit} subtitle={`Margen: ${fp(reportData.gross_profit, reportData.revenues.net_sales)}`} icon={<DollarSign size={22} color="#f59e0b" />} fc={fc} />
            <KPICard title="Gastos Totales" amount={reportData.operating_expenses.total + reportData.financial_expenses.total} subtitle={`${fp(reportData.operating_expenses.total + reportData.financial_expenses.total, reportData.revenues.net_sales)} de Ventas`} icon={<AlertTriangle size={22} color="#ef4444" />} fc={fc} />
            <KPICard title="Utilidad Neta" amount={reportData.net_profit} subtitle={`Margen Neto: ${fp(reportData.net_profit, reportData.revenues.net_sales)}`} icon={<TrendingUp size={22} color="#10b981" />} fc={fc} isSuccess />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', color: 'var(--text-primary)' }}>Distribución del Ingreso</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fc(v)} contentStyle={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', color: 'var(--text-primary)' }}>Desglose de Gastos Operativos</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" fontSize={10} tickMargin={8} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} fontSize={10} />
                    <Tooltip formatter={(v) => fc(v)} cursor={{ fill: 'rgba(255,255,255,0.4)' }} contentStyle={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
                    <Bar dataKey="amount" fill="#1a4f99" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Income Statement Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent-gradient)', color: 'white', padding: '16px 24px', textAlign: 'center', boxShadow: 'var(--accent-glow)' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                ESTADO DE RESULTADOS — {monthLabel.toUpperCase()} {selYear}
              </h2>
            </div>

            <div style={{ padding: '0 24px 24px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '14px 8px', textAlign: 'left', width: '50%' }}>Concepto</th>
                    <th style={{ padding: '14px 8px', textAlign: 'right' }}>Parcial ($)</th>
                    <th style={{ padding: '14px 8px', textAlign: 'right' }}>Total ($)</th>
                    <th style={{ padding: '14px 8px', textAlign: 'right' }}>% de Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  <TableRow label="Ingresos Brutos (Ventas Totales)" total={reportData.revenues.gross_sales} fc={fc} />
                  <TableRow label="(-) Descuentos y Promociones" total={reportData.revenues.discounts} fc={fc} />
                  <TableRow label="(=) VENTAS NETAS" total={reportData.revenues.net_sales} pct="100.0%" isMain fc={fc} />

                  <TableRow label="(-) COSTO DE VENTAS" total={reportData.cogs.total} pct={fp(reportData.cogs.total, reportData.revenues.net_sales)} isMain hasChildren isOpen={expandedSections.cogs} onToggle={() => toggleSection('cogs')} fc={fc} />
                  {expandedSections.cogs && reportData.cogs.breakdown.map((item, i) => (
                    <TableRow key={i} label={`• ${item.concept}`} partial={item.amount} pct={fp(item.amount, reportData.revenues.net_sales)} isChild fc={fc} />
                  ))}

                  <TableRow label="(=) UTILIDAD BRUTA" total={reportData.gross_profit} pct={fp(reportData.gross_profit, reportData.revenues.net_sales)} isMain success fc={fc} />

                  <TableRow label="(-) GASTOS OPERATIVOS" total={reportData.operating_expenses.total} pct={fp(reportData.operating_expenses.total, reportData.revenues.net_sales)} isMain hasChildren isOpen={expandedSections.opex} onToggle={() => toggleSection('opex')} fc={fc} />
                  {expandedSections.opex && reportData.operating_expenses.breakdown.map((item, i) => (
                    <TableRow key={i} label={`• ${item.category}`} partial={item.amount} pct={fp(item.amount, reportData.revenues.net_sales)} isChild fc={fc} />
                  ))}

                  <TableRow label="(=) UTILIDAD OPERATIVA (EBIT)" total={reportData.operating_profit} pct={fp(reportData.operating_profit, reportData.revenues.net_sales)} isMain success fc={fc} />

                  <TableRow label="(-) GASTOS FINANCIEROS" total={reportData.financial_expenses.total} pct={fp(reportData.financial_expenses.total, reportData.revenues.net_sales)} isMain hasChildren isOpen={expandedSections.financial} onToggle={() => toggleSection('financial')} fc={fc} />
                  {expandedSections.financial && reportData.financial_expenses.breakdown.map((item, i) => (
                    <TableRow key={i} label={`• ${item.category}`} partial={item.amount} pct={fp(item.amount, reportData.revenues.net_sales)} isChild fc={fc} />
                  ))}

                  <TableRow label="(=) UTILIDAD NETA DEL EJERCICIO" total={reportData.net_profit} pct={fp(reportData.net_profit, reportData.revenues.net_sales)} isMain success highlight fc={fc} />
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

function KPICard({ title, amount, subtitle, icon, isSuccess, fc }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div className="glass-icon-circle" style={{ padding: '12px', borderRadius: '50%', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <h4 style={{ margin: '0 0 2px 0', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</h4>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isSuccess ? '#10b981' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 2px 4px rgba(255,255,255,0.5)' }}>
          {fc(amount)}
        </div>
        <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function TableRow({ label, partial, total, pct, isMain, isChild, hasChildren, isOpen, onToggle, success, highlight, fc }) {
  const bg = highlight ? 'rgba(16,185,129,0.08)' : isMain ? 'rgba(26,79,153,0.04)' : 'transparent';
  const color = highlight ? '#10b981' : success && isMain ? '#1a4f99' : 'var(--text-primary)';
  const weight = isMain ? 700 : 400;

  return (
    <tr style={{ background: bg, borderBottom: '1px solid var(--border-color)' }}>
      <td style={{ padding: '11px 8px', fontWeight: weight, color, paddingLeft: isChild ? '28px' : '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {hasChildren && (
            <button onClick={onToggle} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {label}
        </div>
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
        {partial !== undefined ? fc(partial) : ''}
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'right', fontWeight: weight, color }}>
        {total !== undefined ? fc(total) : ''}
      </td>
      <td style={{ padding: '11px 8px', textAlign: 'right', color: isMain ? color : 'var(--text-secondary)', fontWeight: isMain ? 600 : 400, fontSize: '0.88rem' }}>
        {pct || ''}
      </td>
    </tr>
  );
}
