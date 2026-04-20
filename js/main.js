import { CityModel }    from './CityModel.js';
import { Camera }       from './Camera.js';
import { Renderer }     from './Renderer.js';
import { InputManager } from './InputManager.js';

const canvas     = document.getElementById('cityCanvas');
const tooltip    = document.getElementById('tooltip');
const statusDiv  = document.getElementById('status');
const statusText = document.getElementById('status-text');

const OPTIM_RADIUS = 600;

const cityModel = new CityModel();
const camera    = new Camera(window.innerWidth, window.innerHeight);
const renderer  = new Renderer(canvas);

let optimState = null;

function runOptimization(wx, wy) {
    const nearby = cityModel.buildings.reduce((acc, b) => {
        const d = Math.hypot(b.centerX - wx, b.centerY - wy);
        if (d > 1 && d <= OPTIM_RADIUS && b.dbLimit > 0) {
            acc.push({
                type: b.type,
                dbLimit: b.dbLimit,
                dist: d,
                allowed: b.dbLimit + 20 * Math.log10(d),
                centerX: b.centerX,
                centerY: b.centerY,
            });
        }
        return acc;
    }, []);

    if (!nearby.length) {
        return {
            maxDb: 130.0,
            status: 'no_constraints',
            nearby: [],
            limitingBuilding: null
        };
    }

    const limiting = nearby.reduce(
        (min, b) => (b.allowed < min.allowed ? b : min),
        nearby[0]
    );

    return {
        maxDb: Math.round(limiting.allowed * 10) / 10,
        status: 'optimal',
        nearby,
        limitingBuilding: limiting
    };
}

function isBlockedByBuilding(building, worldPos) {
    if (!building || !worldPos) return false;

    const padX = Math.min(18, building.w * 0.22);
    const padY = Math.min(18, building.h * 0.22);

    return (
        worldPos.x >= building.x + padX &&
        worldPos.x <= building.x + building.w - padX &&
        worldPos.y >= building.y + padY &&
        worldPos.y <= building.y + building.h - padY
    );
}

function handleUIState(action, building, mouseX, mouseY, isDragging, worldPos) {
    if (action === 'hover') {
        if (isDragging) return;

        statusDiv.style.display = 'none';

        if (building) {
            tooltip.style.cssText = `display:block;left:${mouseX + 15}px;top:${mouseY + 15}px`;
            tooltip.innerHTML = `
                <div class="b-type">${building.type}</div>
                <div class="b-db">Tolerans: ${building.dbLimit} dB</div>
                <div class="b-coord">Koordinat: [${Math.round(building.centerX)}, ${Math.round(building.centerY)}]</div>`;
        } else {
            tooltip.style.display = 'none';
        }

        if (worldPos) {
            optimState = {
                pos: worldPos,
                data: runOptimization(worldPos.x, worldPos.y)
            };
        }

    } else if (action === 'leave') {
        tooltip.style.display = 'none';
        optimState = null;
        statusDiv.style.display = 'none';

    } else if (action === 'click' && worldPos) {
        const clickedOnBuilding = isBlockedByBuilding(building, worldPos);
        const clickedOnRoad = cityModel.isRoad(worldPos.x, worldPos.y);

        if (clickedOnBuilding) {
            tooltip.style.display = 'none';
            statusDiv.style.display = 'block';
            statusText.innerHTML = `
                <b style="color:#ff4d4d;">Geçersiz seçim</b><br>
                Binaların üstüne sahne kurulamaz.<br>
                <i style="font-size:12px;color:#aaa;">Lütfen boş bir alan seç.</i>`;
            return;
        }

        if (clickedOnRoad) {
            tooltip.style.display = 'none';
            statusDiv.style.display = 'block';
            statusText.innerHTML = `
                <b style="color:#ff4d4d;">Geçersiz seçim</b><br>
                Yolların üstüne sahne kurulamaz.<br>
                <i style="font-size:12px;color:#aaa;">Lütfen boş bir alan seç.</i>`;
            return;
        }

        const data = runOptimization(worldPos.x, worldPos.y);

        localStorage.setItem(
            'stageOptimData',
            JSON.stringify({ pos: worldPos, data })
        );

        localStorage.setItem(
            'gams_optimalData',
            JSON.stringify(cityModel.findOptimalStageLocation())
        );

        statusDiv.style.display = 'block';
        statusText.innerHTML = `
            <b>Seçilen Alan:</b> Boş Alan<br>
            <b>Koordinat:</b> X:${Math.round(worldPos.x)}, Y:${Math.round(worldPos.y)}<br>
            <b>Maksimum İzinli Ses:</b> ${data.maxDb} dB<br>
            <i style="font-size:12px;color:#aaa;">Stage sayfası açılıyor...</i>`;

        window.location.href = 'stage.html';
    }
}

function renderLoop() {
    renderer.draw(cityModel, camera, optimState);
    requestAnimationFrame(renderLoop);
}

new InputManager(canvas, camera, cityModel, handleUIState, () => {});

window.addEventListener('resize', () => {
    renderer.resize(window.innerWidth, window.innerHeight);
});

renderer.resize(window.innerWidth, window.innerHeight);
renderLoop();

requestAnimationFrame(() => setTimeout(() => cityModel.findOptimalStageLocation(), 0));

document.querySelector('.next-btn')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.setItem('gams_optimalData', JSON.stringify(cityModel.findOptimalStageLocation()));
    window.location.href = 'stage.html';
});