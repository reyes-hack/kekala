import { chromium } from 'playwright';
import fs from 'fs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

// Helpers for mappings
const getBranchInfo = (rawName: string) => {
    if (rawName.includes('Américas')) {
        return { branchCode: 'AMERICAS_VER', branchName: 'Américas Veracruz' };
    }
    if (rawName.includes('Dorado')) {
        return { branchCode: 'ELDORADO_VER', branchName: 'El Dorado Veracruz' };
    }
    return { 
        branchCode: rawName.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, ''),
        branchName: rawName 
    };
};

const generateProductCode = (productName: string) => {
    // e.g., "Especial Original" -> "ESPECIAL_ORIGINAL"
    return productName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');
};

async function run() {
  console.log('--- Kekala Foodbot Scraper ---');
  let dateInput = await askQuestion('Ingrese el día que desea extraer (ej. 28-06-2026): ');
  
  if (!dateInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
    console.error('Formato inválido. Debe ser DD-MM-YYYY.');
    process.exit(1);
  }

  const [day, month, year] = dateInput.split('-');
  const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  
  if (targetDate > today) {
    console.error('Error: El día solicitado es en el futuro. Escoja un día válido.');
    process.exit(1);
  }

  // Format date as YYYY-MM-DD for ISO / Database compatibility
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  console.log(`\nIniciando extracción para la fecha: ${isoDate}...\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1536, height: 730 } });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  
  try {
    console.log('[1/4] Iniciando sesión en Foodbot...');
    await page.goto('https://dashboard.foodbot.ai/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.click('text=Entrar con usuario y contraseña');
    await page.locator('input[type="email"], input[type="text"]').first().waitFor({ state: 'visible' });
    await page.locator('input[type="email"], input[type="text"]').first().fill('yunmar.ams@gmail.com');
    await page.locator('input[type="password"]').fill('Ferdatar1$');
    await page.locator('input[type="password"]').press('Enter');
    
    await page.waitForTimeout(5000);
    
    if (page.url().includes('profiles')) {
        await page.getByText('Tablero', { exact: false }).first().click();
        await page.waitForTimeout(5000);
    }
    
    console.log('[2/4] Configurando fecha en el dashboard...');
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedDate = `${parseInt(day)}/${monthNames[targetDate.getMonth()]}/${year}`;
    const fullRangeStr = `${formattedDate} 00:00.00 - ${formattedDate} 23:59.59`;
    
    console.log(`      -> Inyectando: ${fullRangeStr}`);
    
    const dateSet = await page.evaluate(({ y, m, d }) => {
      const $ = (window as any).jQuery || (window as any).$;
      if (!$) return { success: false, error: 'jQuery no disponible' };
      
      const input = $('input[name="daterange"], input#daterange').first();
      if (!input.length) return { success: false, error: 'Input daterange no encontrado' };
      
      const picker = input.data('daterangepicker');
      if (!picker) return { success: false, error: 'daterangepicker no inicializado' };
      
      const startDate = new Date(y, m, d, 0, 0, 0);
      const endDate = new Date(y, m, d, 23, 59, 59);
      
      picker.setStartDate(startDate);
      picker.setEndDate(endDate);
      
      if (picker.updateView) picker.updateView();
      if (picker.updateCalendars) picker.updateCalendars();
      
      picker.clickApply();
      
      return { success: true, value: input.val() };
    }, { y: parseInt(year), m: parseInt(month) - 1, d: parseInt(day) });
    
    console.log(`      -> Resultado daterangepicker API:`, dateSet);
    
    await page.waitForTimeout(3000);
    
    const currentValue = await page.locator('input#daterange, input[name="daterange"]').first().inputValue();
    console.log(`      -> Valor actual del input: ${currentValue}`);

    console.log('[3/4] Extrayendo datos por sucursal...');
    const sucursalesList = ['Américas VERACRUZ', 'El Dorado VERACRUZ'];
    const finalData: any = { fecha: isoDate, sucursales: [] };

    for (const sucursal of sucursalesList) {
        console.log(`      -> Procesando ${sucursal}...`);
        
        try {
            const option = page.locator('option', { hasText: new RegExp(sucursal, 'i') }).first();
            if (await option.count() > 0) {
                const parentSelect = option.locator('xpath=..');
                await parentSelect.selectOption([ { label: await option.textContent() || sucursal } ], { force: true });
            } else {
                throw new Error("No option found");
            }
        } catch(e) {
            console.log('        Intentando método alternativo...');
            try {
                await page.getByText(sucursal, { exact: false }).first().click({ force: true });
            } catch (err2) {
                console.log(`        No se pudo seleccionar ${sucursal}, saltando...`);
                continue;
            }
        }
        
        await page.keyboard.press('Escape');
        
        try {
            await page.getByText('GUARDAR', { exact: false }).click({ force: true, timeout: 5000 });
        } catch(e) { }
        
        await page.waitForTimeout(8000);
        
        for (let i = 0; i < 15; i++) {
          await page.evaluate(() => window.scrollBy(0, 600));
          await page.waitForTimeout(200);
        }
        await page.waitForTimeout(2000);
        
        const textContent = await page.evaluate(() => document.body.innerText);
        
        const debugPath = `C:\\Users\\toro5\\Documents\\AZSA\\KEKALA\\backend\\src\\infrastructure\\scraper\\debug-${sucursal.replace(/\s/g, '_')}.txt`;
        fs.writeFileSync(debugPath, textContent);
        
        const parsed = parseTextContent(textContent, sucursal);
        
        const { branchCode, branchName } = getBranchInfo(sucursal);
        
        finalData.sucursales.push({
            branchCode,
            branchName,
            ...parsed
        });
        
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
    }

    console.log('\n[4/4] Extracción completada exitosamente.');
    
    const outputPath = 'C:\\Users\\toro5\\Documents\\AZSA\\KEKALA\\backend\\src\\infrastructure\\scraper\\ventas-output.json';
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    console.log(`\nDatos guardados en: ${outputPath}\n`);
    
  } catch(error) {
    console.error('Error durante la extracción:', error);
  } finally {
    await browser.close();
    rl.close();
  }
}

function parseTextContent(text: string, sucursalName: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const data: any = { kpis: { ordenes: 0, ventas: 0, ticketPromedio: 0 }, productosVendidos: [] };

  for (const line of lines) {
    if (line.includes(sucursalName) && line.includes('$')) {
      const idx = line.indexOf(sucursalName);
      const afterName = line.substring(idx + sucursalName.length);
      const match = afterName.match(/^(\d+)\$([\d,]+\.\d{2})([\d.]+)\$/);
      if (match) {
        data.kpis.ordenes = parseInt(match[1], 10);
        data.kpis.ventas = parseFloat(match[2].replace(/,/g, ''));
        data.kpis.ticketPromedio = parseFloat(match[3].replace(/,/g, ''));
        console.log(`        KPIs encontrados: ordenes=${data.kpis.ordenes}, ventas=${data.kpis.ventas}, ticket=${data.kpis.ticketPromedio}`);
        break;
      }
    }
  }

  let inProductos = false;
  let passedHeader = false;
  
  for (const line of lines) {
    if (line === 'Productos vendidos(modificadores incluidos)') {
      passedHeader = true;
      continue;
    }
    
    if (passedHeader && !inProductos) {
      if (line === 'Item' || line === 'Órdenes' || line === 'Quantity' || line === 'Ventas') {
        continue;
      }
      if (line.includes('$')) {
        inProductos = true;
      }
    }
    
    if (inProductos) {
      if (line === 'Export Data' || line.startsWith('Productos vendidos(modificadores excluidos)') || line === 'Categorías vendidas') {
        break;
      }
      
      const dollarIdx = line.indexOf('$');
      if (dollarIdx === -1) continue;
      
      const beforeDollar = line.substring(0, dollarIdx);
      const ventasStr = line.substring(dollarIdx + 1);
      const ventas = parseFloat(ventasStr.replace(/,/g, ''));
      
      const digitMatch = beforeDollar.match(/^(.+?)(\d+)$/);
      if (!digitMatch) continue;
      
      let rawProductName = digitMatch[1].trim();
      const digitBlock = digitMatch[2];
      
      let ordenesStr: string;
      let cantidadStr: string;
      
      if (digitBlock.length <= 1) {
        ordenesStr = digitBlock;
        cantidadStr = digitBlock;
      } else {
        const half = Math.floor(digitBlock.length / 2);
        ordenesStr = digitBlock.substring(0, half);
        cantidadStr = digitBlock.substring(half);
      }
      
      const ordenes = parseInt(ordenesStr, 10);
      const cantidad = parseInt(cantidadStr, 10);
      
      data.productosVendidos.push({
        productCode: generateProductCode(rawProductName),
        productName: rawProductName,
        ordenes,
        cantidad,
        ventas
      });
    }
  }

  return data;
}

run().catch(console.error);
