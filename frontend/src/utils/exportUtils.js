import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

/**
 * Exporta un elemento HTML a PDF.
 */
export const exportToPDF = async (elementId, filename = 'OrdenDeCompra.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // SOLUCIÓN: Los inputs editables suelen cortarse a la mitad en html2canvas.
  // Transformamos temporalmente los inputs en texto estático antes de la foto.
  const inputs = element.querySelectorAll('input');
  inputs.forEach(input => {
    const span = document.createElement('span');
    span.className = 'temp-pdf-span';
    span.innerText = input.value || '0';
    input.parentNode.insertBefore(span, input);
    input.style.display = 'none';
  });

  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    
    // Cambiado a retrato (portrait) como solicitó el usuario
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgProps = pdf.getImageProperties(imgData);
    
    const margin = 10;
    const pageW = pdf.internal.pageSize.getWidth() - (margin * 2);
    
    // Forzamos que ocupe todo el ancho disponible para evitar espacios en blanco a los lados
    const pdfWidth = pageW;
    const pdfHeight = (imgProps.height * pageW) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Hubo un error al generar el PDF. Verifica la consola.");
  } finally {
    // Restaurar los inputs a la normalidad
    inputs.forEach(input => {
      input.style.display = '';
      const span = input.parentNode.querySelector('.temp-pdf-span');
      if (span) span.remove();
    });
  }
};

/**
 * Exporta directamente usando ExcelJS con estilos perfectos
 */
export const exportToExcelWithStyles = async (data, filename = 'OrdenDeCompra.xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Solicitud OC');

    // Configuración de anchos de columna (7 columnas)
    worksheet.columns = [
      { width: 30 }, // A: Producto Bases
      { width: 18 }, // B: Bases por caja
      { width: 15 }, // C: No. Cajas
      { width: 18 }, // D: Total Bases
      { width: 4 },  // E: Separador en blanco
      { width: 30 }, // F: Producto Líquidos
      { width: 22 }  // G: Cantidad (Litros)
    ];

    const borderAll = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    
    // Fila 1: Encabezado amarillo
    worksheet.mergeCells('A1:B4');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = "KEKALA CUSTOM PALETA";
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    
    worksheet.mergeCells('C1:G1');
    const c1 = worksheet.getCell('C1');
    c1.value = "SOLICITUD DE ORDEN DE COMPRA";
    c1.font = { bold: true };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Todos los bordes del cuadro amarillo
    ['C1', 'D1', 'E1', 'F1', 'G1'].forEach(c => worksheet.getCell(c).border = {top: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}, left: {style:'thin'}});

    // Fila 2: Franquiciatario
    worksheet.mergeCells('C2:D2');
    worksheet.getCell('C2').value = "FRANQUICIATARIO";
    worksheet.getCell('C2').font = { bold: true };
    worksheet.getCell('C2').border = borderAll;
    worksheet.getCell('D2').border = borderAll; // merge repair

    worksheet.mergeCells('E2:G2');
    worksheet.getCell('E2').value = "YUNMAR COMERCIALIZADORA";
    worksheet.getCell('E2').alignment = { horizontal: 'center' };
    worksheet.getCell('E2').border = borderAll;
    worksheet.getCell('F2').border = borderAll;
    worksheet.getCell('G2').border = borderAll;

    // Fila 3: Municipio / Fecha
    worksheet.mergeCells('C3:D3');
    worksheet.getCell('C3').value = "MUNICIPIO/ESTADO";
    worksheet.getCell('C3').font = { bold: true };
    worksheet.getCell('C3').border = borderAll;
    worksheet.getCell('D3').border = borderAll;
    
    worksheet.mergeCells('E3:F3');
    worksheet.getCell('E3').value = "VERACRUZ, BOCA DEL RIO";
    worksheet.getCell('E3').alignment = { horizontal: 'center' };
    worksheet.getCell('E3').border = borderAll;
    worksheet.getCell('F3').border = borderAll;

    worksheet.getCell('G3').value = "FECHA";
    worksheet.getCell('G3').font = { bold: true };
    worksheet.getCell('G3').alignment = { horizontal: 'center' };
    worksheet.getCell('G3').border = borderAll;

    // Fila 4: Sucursal / Date val
    worksheet.mergeCells('C4:D4');
    worksheet.getCell('C4').value = "SUCURSAL";
    worksheet.getCell('C4').font = { bold: true };
    worksheet.getCell('C4').border = borderAll;
    worksheet.getCell('D4').border = borderAll;

    worksheet.mergeCells('E4:F4');
    worksheet.getCell('E4').value = data.branchName.toUpperCase();
    worksheet.getCell('E4').alignment = { horizontal: 'center' };
    worksheet.getCell('E4').border = borderAll;
    worksheet.getCell('F4').border = borderAll;

    worksheet.getCell('G4').value = data.date;
    worksheet.getCell('G4').alignment = { horizontal: 'center' };
    worksheet.getCell('G4').border = borderAll;

    worksheet.addRow([]); // Fila vacía

    // Constructor de secciones
    const buildSection = (titleLeft, titleRight, leftData, rightData) => {
       const headerRow = worksheet.addRow(['', '', '', '', '', '', '']);
       
       worksheet.mergeCells(`A${headerRow.number}:D${headerRow.number}`);
       const tl = worksheet.getCell(`A${headerRow.number}`);
       tl.value = titleLeft;
       tl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
       tl.font = { bold: true, color: { argb: 'FFFFFFFF' } };
       tl.alignment = { horizontal: 'center' };
       tl.border = borderAll;
       ['B', 'C', 'D'].forEach(c => worksheet.getCell(`${c}${headerRow.number}`).border = borderAll);
       
       worksheet.mergeCells(`F${headerRow.number}:G${headerRow.number}`);
       const tr = worksheet.getCell(`F${headerRow.number}`);
       tr.value = titleRight;
       tr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
       tr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
       tr.alignment = { horizontal: 'center' };
       tr.border = borderAll;
       worksheet.getCell(`G${headerRow.number}`).border = borderAll;

       const subHeader = worksheet.addRow([
         'PRODUCTO', 'BASES POR CAJA', 'NO. CAJAS', 'TOTAL BASES', '', 'PRODUCTO', 'CANTIDAD (LITROS)'
       ]);
       [1, 2, 3, 4, 6, 7].forEach(col => {
         const cell = subHeader.getCell(col);
         cell.font = { bold: true };
         cell.alignment = { horizontal: 'center' };
         cell.border = borderAll;
       });

       const maxRows = Math.max(leftData.length, rightData.length);
       let sumCajas = 0, sumTotalBases = 0, sumLitros = 0;

       for (let i = 0; i < maxRows; i++) {
          const left = leftData[i];
          const right = rightData[i];
          const row = worksheet.addRow(['', '', '', '', '', '', '']);
          
          if (left) {
             const qty = data.orderState[left.product.id] || 0;
             const box = left.product.items_per_box;
             const name = left.product.name.replace(/(Original|Flat)/gi, '').trim().toUpperCase();
             
             row.getCell(1).value = name;
             row.getCell(2).value = box;
             row.getCell(3).value = qty;
             row.getCell(4).value = qty * box;
             
             [1, 2, 3, 4].forEach(col => row.getCell(col).border = borderAll);
             row.getCell(2).alignment = { horizontal: 'center' };
             row.getCell(3).alignment = { horizontal: 'center' };
             row.getCell(4).alignment = { horizontal: 'center' };
             
             sumCajas += qty;
             sumTotalBases += (qty * box);
          }

          if (right) {
             const qty = data.orderState[right.product.id] || 0;
             const name = right.product.name.replace(/(Cobertura|Relleno)/gi, '').trim().toUpperCase();
             
             row.getCell(6).value = name;
             row.getCell(7).value = qty;
             
             [6, 7].forEach(col => row.getCell(col).border = borderAll);
             row.getCell(7).alignment = { horizontal: 'center' };
             
             sumLitros += qty;
          }
       }

       const totalRow = worksheet.addRow(['', '', '', '', '', '', '']);
       worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
       const totL = totalRow.getCell(1);
       totL.value = "TOTAL";
       totL.font = { bold: true };
       totL.alignment = { horizontal: 'right' };
       totL.border = borderAll;
       totalRow.getCell(2).border = borderAll;
       
       totalRow.getCell(3).value = sumCajas;
       totalRow.getCell(3).font = { bold: true };
       totalRow.getCell(3).alignment = { horizontal: 'center' };
       totalRow.getCell(3).border = borderAll;
       
       totalRow.getCell(4).value = sumTotalBases;
       totalRow.getCell(4).font = { bold: true };
       totalRow.getCell(4).alignment = { horizontal: 'center' };
       totalRow.getCell(4).border = borderAll;

       totalRow.getCell(6).value = "TOTAL";
       totalRow.getCell(6).font = { bold: true };
       totalRow.getCell(6).alignment = { horizontal: 'right' };
       totalRow.getCell(6).border = borderAll;

       totalRow.getCell(7).value = sumLitros;
       totalRow.getCell(7).font = { bold: true };
       totalRow.getCell(7).alignment = { horizontal: 'center' };
       totalRow.getCell(7).border = borderAll;
    };

    buildSection('BASES ORIGINALES KEKALA', 'COBERTURAS KEKALA', data.basesOrig, data.coberturas);
    worksheet.addRow([]);
    buildSection('BASES FLAT KEKALA', 'RELLENOS KEKALA', data.basesFlat, data.rellenos);

    worksheet.addRow([]);
    
    // OTROS & KITS
    if ((data.otros && data.otros.length > 0) || (data.kits && data.kits.length > 0)) {
       const hkRow = worksheet.addRow(['', '', '', '', '', '', '']);
       if (data.otros && data.otros.length > 0) {
         worksheet.mergeCells(`A${hkRow.number}:D${hkRow.number}`);
         const to = worksheet.getCell(`A${hkRow.number}`);
         to.value = "OTROS";
         to.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
         to.font = { bold: true, color: { argb: 'FFFFFFFF' } };
         to.alignment = { horizontal: 'center' };
         to.border = borderAll;
         ['B', 'C', 'D'].forEach(c => worksheet.getCell(`${c}${hkRow.number}`).border = borderAll);
       }
       
       if (data.kits && data.kits.length > 0) {
         worksheet.mergeCells(`F${hkRow.number}:G${hkRow.number}`);
         const tk = worksheet.getCell(`F${hkRow.number}`);
         tk.value = "KITS";
         tk.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
         tk.font = { bold: true, color: { argb: 'FFFFFFFF' } };
         tk.alignment = { horizontal: 'center' };
         tk.border = borderAll;
         worksheet.getCell(`G${hkRow.number}`).border = borderAll;
       }
       
       const shRow = worksheet.addRow(['', '', '', '', '', '', '']);
       if (data.otros && data.otros.length > 0) {
         worksheet.mergeCells(`A${shRow.number}:B${shRow.number}`);
         shRow.getCell(1).value = "CATEGORÍA";
         shRow.getCell(3).value = "PRODUCTO";
         shRow.getCell(4).value = "CANTIDAD";
         [1, 2, 3, 4].forEach(col => {
           shRow.getCell(col).font = { bold: true };
           shRow.getCell(col).alignment = { horizontal: 'center' };
           shRow.getCell(col).border = borderAll;
         });
       }
       
       if (data.kits && data.kits.length > 0) {
         shRow.getCell(6).value = "PRODUCTO";
         shRow.getCell(7).value = "CANTIDAD";
         [6, 7].forEach(col => {
           shRow.getCell(col).font = { bold: true };
           shRow.getCell(col).alignment = { horizontal: 'center' };
           shRow.getCell(col).border = borderAll;
         });
       }
       
       const maxOK = Math.max((data.otros || []).length, (data.kits || []).length);
       for (let i = 0; i < maxOK; i++) {
         const dOtro = (data.otros || [])[i];
         const dKit = (data.kits || [])[i];
         const r = worksheet.addRow(['', '', '', '', '', '', '']);
         
         if (dOtro) {
           worksheet.mergeCells(`A${r.number}:B${r.number}`);
           r.getCell(1).value = dOtro.category;
           r.getCell(3).value = dOtro.product;
           r.getCell(4).value = dOtro.quantity;
           [1, 2, 3, 4].forEach(col => r.getCell(col).border = borderAll);
           r.getCell(4).alignment = { horizontal: 'center' };
         }
         
         if (dKit) {
           r.getCell(6).value = dKit.product;
           r.getCell(7).value = dKit.quantity;
           [6, 7].forEach(col => r.getCell(col).border = borderAll);
           r.getCell(7).alignment = { horizontal: 'center' };
         }
       }
    }
    
    // OBSERVACIONES
    if (data.observaciones) {
      worksheet.addRow([]);
      const obsHeader = worksheet.addRow(['OBSERVACIONES:']);
      worksheet.mergeCells(`A${obsHeader.number}:G${obsHeader.number}`);
      obsHeader.getCell(1).font = { bold: true };
      obsHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      obsHeader.getCell(1).border = borderAll;
      
      const obsRow = worksheet.addRow([data.observaciones]);
      worksheet.mergeCells(`A${obsRow.number}:G${obsRow.number}`);
      obsRow.height = 60;
      obsRow.getCell(1).alignment = { vertical: 'top', wrapText: true };
      obsRow.getCell(1).border = borderAll;
    }


    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), filename);
  } catch (error) {
    console.error("Error generando Excel con estilos:", error);
    alert("Hubo un error al generar el Excel.");
  }
};

export const exportMermasToExcelWithStyles = async (mermas, branchName, monthFilter) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Mermas');

    let logoId = null;
    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      logoId = workbook.addImage({
        buffer: arrayBuffer,
        extension: 'png',
      });
    } catch (e) {
      console.warn("Could not load logo for Excel", e);
    }

    worksheet.columns = [
      { width: 15 },
      { width: 30 },
      { width: 15 },
      { width: 22 },
      { width: 20 },
      { width: 25 },
      { width: 30 },
    ];

    const borderAll = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    worksheet.mergeCells('A1:G4');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = "REPORTE DE MERMAS KEKALA";
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFD97706' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    if (logoId !== null) {
      worksheet.addImage(logoId, {
        tl: { col: 0.2, row: 0.2 },
        ext: { width: 80, height: 80 }
      });
    }

    worksheet.mergeCells('A5:D5');
    worksheet.getCell('A5').value = `SUCURSAL: ${branchName}`;
    worksheet.getCell('A5').font = { bold: true, size: 12 };
    
    worksheet.mergeCells('E5:G5');
    worksheet.getCell('E5').value = `MES / PERIODO: ${monthFilter || 'Todos'}`;
    worksheet.getCell('E5').font = { bold: true, size: 12 };
    worksheet.getCell('E5').alignment = { horizontal: 'right' };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'FECHA', 'TIPO DE PRODUCTO', 'TURNO', 'CANTIDAD DAÑADA', 'LOTE', 'MOTIVO', 'NOTAS'
    ]);

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderAll;
    });

    let sumTotal = 0;

    mermas.forEach(m => {
      sumTotal += Number(m.quantity) || 0;
      const row = worksheet.addRow([
        m.date,
        m.product_name,
        m.shift,
        Number(m.quantity),
        m.batch,
        m.reason,
        m.notes
      ]);
      row.eachCell((cell, colNumber) => {
        cell.border = borderAll;
        if (colNumber === 4) {
          cell.alignment = { horizontal: 'center' };
          cell.font = { bold: true, color: { argb: 'FFD97706' } };
        } else {
          cell.alignment = { vertical: 'middle' };
        }
      });
    });

    const totalRow = worksheet.addRow(['', '', 'TOTAL:', sumTotal, '', '', '']);
    totalRow.getCell(3).font = { bold: true };
    totalRow.getCell(3).alignment = { horizontal: 'right' };
    totalRow.getCell(4).font = { bold: true, color: { argb: 'FFD97706' } };
    totalRow.getCell(4).alignment = { horizontal: 'center' };
    totalRow.getCell(4).border = borderAll;

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `Mermas_${branchName.replace(/ /g, '_')}_${monthFilter || new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error("Error exportando mermas:", error);
    alert("Hubo un error al exportar.");
  }
};

export const exportTurnosToPDF = async (shifts, assignments, employees) => {
  try {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Add Logo
    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      const reader = new FileReader();
      const base64data = await new Promise((resolve) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
      });
      pdf.addImage(base64data, 'PNG', 14, 10, 24, 24);
    } catch (e) {
      console.warn("Could not load logo for PDF", e);
    }

    pdf.setFontSize(18);
    pdf.setTextColor(30, 58, 138); // brand blue
    pdf.text("ASIGNACIÓN DE TURNOS SEMANALES", 45, 20);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`, 45, 28);

    const head = [['SUCURSAL / HORARIO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']];
    
    const body = shifts.map(shift => {
      const row = [`${shift.branches?.name || 'N/A'}\n${shift.name}\n${shift.start_time.substring(0,5)} - ${shift.end_time.substring(0,5)}`];
      
      [0, 1, 2, 3, 4, 5, 6].forEach(dayIndex => {
        const assignment = assignments.find(a => a.shift_id === shift.id && a.day_of_week === dayIndex);
        let empName = 'Sin Asignar';
        if (assignment) {
          const emp = employees.find(e => e.id === assignment.profile_id);
          if (emp) empName = emp.name;
        }
        row.push(empName);
      });
      
      return row;
    });

    autoTable(pdf, {
      startY: 40,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, halign: 'center', valign: 'middle' },
      styles: { fontSize: 8, cellPadding: 4, valign: 'middle' },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 35 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    pdf.save(`Turnos_Semanales_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error("Error exportando a PDF:", error);
    alert("Hubo un error al exportar a PDF.");
  }
};
