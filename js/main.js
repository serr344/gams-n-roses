import { CityModel } from './CityModel.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { InputManager } from './InputManager.js';

const canvas = document.getElementById('cityCanvas');
const tooltip = document.getElementById('tooltip');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('status-text');

const OPTIM_RADIUS = 600;

let cityModel = new CityModel();
let camera = new Camera(window.innerWidth, window.innerHeight);
let renderer = new Renderer(canvas);
let selectedBuilding = null;
let optimState = null;

// -------------------------------------------------------------------
// GAMSPY LP'nin analitik eşdeğeri — anlık hesap, sıfır gecikme
// Model: Maximize L
//        subject to: L <= db_limit_i + 20*log10(d_i)  ∀i
// Çözüm: L* = min_i( db_limit_i + 20*log10(d_i) )
// -------------------------------------------------------------------
function runOptimization(wx, wy) {
    const nearby = [];

    for (const b of cityModel.buildings) {
        const d = Math.hypot(b.centerX - wx, b.centerY - wy);
        // CityModel'de db özelliği dbLimit olarak güncellendiği için fallback ekliyoruz (b.dbLimit || b.db)
        const buildingDb = b.dbLimit || b.db; 

        if (d > 1 && d <= OPTIM_RADIUS && buildingDb > 0) {
            nearby.push({
                type:     b.type,
                dbLimit:  buildingDb,
                dist:     d,
                allowed:  buildingDb + 20 * Math.log10(d),  // LP kısıt sınırı
                centerX:  b.centerX,
                centerY:  b.centerY
            });
        }
    }

    if (nearby.length === 0) {
        return {
            maxDb: 130.0,
            status: 'no_constraints',
            nearby: [],
            limitingBuilding: null
        };
    }

    // LP optimal: en kısıtlayıcı bina minimumdur
    let limiting = nearby[0];
    for (const b of nearby) {
        if (b.allowed < limiting.allowed) limiting = b;
    }

    return {
        maxDb: Math.round(limiting.allowed * 10) / 10,
        status: 'optimal',
        nearby,
        limitingBuilding: limiting
    };
}

// -------------------------------------------------------------------
// UI state
// -------------------------------------------------------------------
function handleUIState(action, building, mouseX, mouseY, isDragging, worldPos) {
    if (action === 'hover' && !isDragging) {
        // Tooltip
        if (building) {
            const buildingDb = building.dbLimit || building.db;
            tooltip.style.display = 'block';
            tooltip.style.left  = mouseX + 15 + 'px';
            tooltip.style.top   = mouseY + 15 + 'px';
            tooltip.innerHTML = `
                <div class="b-type">${building.type}</div>
                <div class="b-db">Tolerans: ${buildingDb} dB</div>
                <div class="b-coord">Koordinat: [${Math.round(building.centerX)}, ${Math.round(building.centerY)}]</div>
            `;
        } else {
            tooltip.style.display = 'none';
        }
        document.body.style.cursor = 'pointer';

        // Anlık optimizasyon (Fare ile gezinirken)
        if (worldPos) {
            const data = runOptimization(worldPos.x, worldPos.y);
            optimState = { pos: { x: worldPos.x, y: worldPos.y }, data };
        }

    } else if (action === 'leave') {
        tooltip.style.display = 'none';
        document.body.style.cursor = 'grab';
        optimState = null;

    } else if (action === 'click') {
        const clickPos = worldPos;

        if (clickPos) {
            // 1. Kullanıcının seçtiği noktanın verisini hesapla ve kaydet
            const data = runOptimization(clickPos.x, clickPos.y);
            const payload = { pos: { x: clickPos.x, y: clickPos.y }, data };
            localStorage.setItem('stageOptimData', JSON.stringify(payload));

            // 2. GAMS Optimizasyon Motorunu çalıştır ve en iyi noktayı bulup kaydet
            console.log("GAMSPy Motoru haritayı tarıyor...");
            const optimalData = cityModel.findOptimalStageLocation();
            localStorage.setItem('gams_optimalData', JSON.stringify(optimalData));

            // 3. Sahne sayfasına geç
            window.location.href = 'stage.html';
        }

        if (building) {
            selectedBuilding = building;
            const buildingDb = building.dbLimit || building.db;
            statusDiv.style.display = 'block';
            statusText.innerHTML = `
                <b>Seçilen Alan:</b> ${building.type}<br>
                <b>Sınır:</b> ${buildingDb} dB<br>
                <b>Koordinat:</b> X:${Math.round(building.centerX)}, Y:${Math.round(building.centerY)}<br>
                <i style="font-size:12px;color:#aaa;">Stage sayfası açılıyor...</i>
            `;
        }
    }
}

function renderLoop() {
    renderer.draw(cityModel, camera, selectedBuilding, optimState);
    requestAnimationFrame(renderLoop);
}

new InputManager(canvas, camera, cityModel, handleUIState, () => {});

window.addEventListener('resize', () => renderer.resize(window.innerWidth, window.innerHeight));
renderer.resize(window.innerWidth, window.innerHeight);
renderLoop();

// Eğer sayfanın altındaki butona basılırsa da optimizasyonu çalıştırıp gitmesi için
const nextBtn = document.querySelector('.next-btn');
if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        // Eğer HTML'de onclick="window.location..." yazıyorsa onu ezmek için:
        e.preventDefault(); 
        
        console.log("GAMSPy Motoru haritayı tarıyor...");
        const optimalData = cityModel.findOptimalStageLocation();
        localStorage.setItem('gams_optimalData', JSON.stringify(optimalData));
        window.location.href = 'stage.html';
    });
}