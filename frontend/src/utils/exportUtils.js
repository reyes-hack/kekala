import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
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

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), filename);
  } catch (error) {
    console.error("Error generando Excel con estilos:", error);
    alert("Hubo un error al generar el Excel.");
  }
};
