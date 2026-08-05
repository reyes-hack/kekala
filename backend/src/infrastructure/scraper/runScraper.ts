import { chromium } from 'playwright';
import fs from 'fs';
import * as readline from 'readline';

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
  let dateInput = process.argv[2];
  if (!dateInput) {
      dateInput = await askQuestion('Ingrese el día que desea extraer (ej. 28-06-2026): ');
  }
  
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

        // Hacer clic en todos los botones "Table" para revelar tablas ocultas (como la de métodos de pago)
        await page.evaluate(() => {
            const elements = document.querySelectorAll('button, a, span, div');
            for (let i = 0; i < elements.length; i++) {
                if (elements[i].textContent && elements[i].textContent?.trim() === 'Table') {
                    (elements[i] as HTMLElement).click();
                }
            }
        });
        await page.waitForTimeout(2000); // Esperar a que las tablas se rendericen
        
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
  }
}

function parseTextContent(text: string, sucursalName: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const data: any = { 
      kpis: { ordenes: 0, ventas: 0, ticketPromedio: 0 }, 
      productosVendidos: [],
      modificadoresVendidos: [],
      metodosDePago: []
  };

  // Extraer KPIs de la primera tabla
  for (const line of lines) {
    if (line.includes(sucursalName) && line.includes('$')) {
      const idx = line.indexOf(sucursalName);
      const afterName = line.substring(idx + sucursalName.length).trim();
      
      // El formato que bota innerText suele pegar columnas: "68$8,505.00$8,505.00125.07$0.00"
      // Capturamos: (Ordenes) $ (Ventas Brutas) $ (Ventas) (TicketPromedio) $
      const match = afterName.match(/^(\d+)\$([\d,]+\.\d{2})\$([\d,]+\.\d{2})([\d.]+)\$/);
      
      if (match) {
        data.kpis.ordenes = parseInt(match[1], 10);
        data.kpis.ventas = parseFloat(match[3].replace(/,/g, ''));
        data.kpis.ticketPromedio = parseFloat(match[4].replace(/,/g, ''));
        break;
      } else {
        // Fallback por si acaso Foodbot cambia y solo hay una columna de ventas
        const fallbackMatch = afterName.match(/^(\d+)\$([\d,]+\.\d{2})([\d.]+)\$/);
        if (fallbackMatch) {
            data.kpis.ordenes = parseInt(fallbackMatch[1], 10);
            data.kpis.ventas = parseFloat(fallbackMatch[2].replace(/,/g, ''));
            data.kpis.ticketPromedio = parseFloat(fallbackMatch[3].replace(/,/g, ''));
            break;
        }
      }
    }
  }

  let section = '';
  
  for (const line of lines) {
    // Detectar en qué tabla estamos según los headers
    if (line === 'Productos vendidos(modificadores incluidos)') { section = 'PRODUCTOS'; continue; }
    if (line === 'Productos vendidos(modificadores excluidos)') { section = 'PRODUCTOS_EXCLUIDOS'; continue; }
    if (line === 'Categorías vendidas') { section = 'CATEGORIAS'; continue; }
    if (line === 'Modificadores vendidos') { section = 'MODIFICADORES'; continue; }
    if (line.includes('Reporte por método de pago')) { section = 'PAGOS'; continue; }
    
    // Si llegamos a cualquier otro reporte (ej. Reporte por Canal), apagamos el parseo
    if (line.startsWith('Reporte ') && !line.includes('método de pago')) { section = 'OTHER'; continue; }
    
    // Ignorar encabezados de columnas y botones de interfaz
    if (line === 'Export Data' || line === 'Item' || line === 'Órdenes' || line === 'Quantity' || line === 'Ventas' || line === 'ModifierItem' || line === 'PaymentMethod' || line === 'Channel' || line === 'Table' || line === 'Chart') {
        continue;
    }

    if (section === 'PRODUCTOS' || section === 'MODIFICADORES') {
        if (!line.includes('$')) continue;
        
        const dollarIdx = line.indexOf('$');
        const beforeDollar = line.substring(0, dollarIdx);
        const ventasStr = line.substring(dollarIdx + 1);
        const ventas = parseFloat(ventasStr.replace(/,/g, ''));
        
        // Al parsear InnerText, a veces se juntan nombres y números "Cobertura Crocante2428"
        const digitMatch = beforeDollar.match(/^(.+?)(\d+)$/);
        if (!digitMatch) continue;
        
        let rawName = digitMatch[1].trim();
        const digitBlock = digitMatch[2];
        
        let ordenes = 0, cantidad = 0;
        if (digitBlock.length <= 1) {
            ordenes = parseInt(digitBlock, 10);
            cantidad = parseInt(digitBlock, 10);
        } else {
            const half = Math.floor(digitBlock.length / 2);
            ordenes = parseInt(digitBlock.substring(0, half), 10);
            cantidad = parseInt(digitBlock.substring(half), 10);
        }

        if (section === 'PRODUCTOS') {
            data.productosVendidos.push({
                productCode: generateProductCode(rawName),
                productName: rawName,
                ordenes,
                cantidad,
                ventas
            });
        } else if (section === 'MODIFICADORES') {
            data.modificadoresVendidos.push({
                modifierName: rawName,
                ordenes,
                cantidad,
                ventas
            });
        }
    } 
    else if (section === 'PAGOS') {
        // Formato esperado de InnerText: "CashPOS38$4,105.00" o "Terminal-ManualPOS30$4,400.00"
        if (!line.includes('$')) continue;
        
        const dollarIdx = line.indexOf('$');
        const beforeDollar = line.substring(0, dollarIdx);
        const ventasStr = line.substring(dollarIdx + 1);
        const ventas = parseFloat(ventasStr.replace(/,/g, ''));

        // Separar Método+Canal y Órdenes
        const digitMatch = beforeDollar.match(/^(.+?POS|.+?WEB)(\d+)$/i); 
        let methodChannel = beforeDollar.trim();
        let ordenes = 0;
        
        if (digitMatch) {
            methodChannel = digitMatch[1];
            ordenes = parseInt(digitMatch[2], 10);
        } else {
            const rawMatch = beforeDollar.match(/^(.+?)(\d+)$/);
            if(rawMatch) {
                methodChannel = rawMatch[1];
                ordenes = parseInt(rawMatch[2], 10);
            }
        }

        let paymentMethod = methodChannel;
        let channel = '';
        if (methodChannel.toUpperCase().endsWith('POS')) {
            paymentMethod = methodChannel.substring(0, methodChannel.length - 3).trim();
            channel = 'POS';
        } else if (methodChannel.toUpperCase().endsWith('WEB')) {
            paymentMethod = methodChannel.substring(0, methodChannel.length - 3).trim();
            channel = 'WEB';
        }

        data.metodosDePago.push({
            paymentMethod,
            channel,
            ordenes,
            ventas
        });
    }
  }

  return data;
}

run().catch(console.error);
