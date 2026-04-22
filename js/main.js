import { CityModel }    from './CityModel.js';
import { Camera }       from './Camera.js';
import { Renderer }     from './Renderer.js';
import { InputManager } from './InputManager.js';

const canvas     = document.getElementById('cityCanvas');
const tooltip    = document.getElementById('tooltip');

const OPTIM_RADIUS = 600;

// Camera & renderer start immediately (no freeze)
const camera   = new Camera(window.innerWidth, window.innerHeight);
const renderer = new Renderer(canvas);
renderer.resize(window.innerWidth, window.innerHeight);

let cityModel  = null;
let inputMgr   = null;
let optimState = null;
let isReady    = false;

// ── RENDER LOOP ──
function renderLoop() {
    if (cityModel && isReady) {
        renderer.draw(cityModel, camera, optimState);
    } else {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#07090d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255,195,0,0.7)';
        ctx.font = 'bold 18px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Generating city map…', canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
    requestAnimationFrame(renderLoop);
}
renderLoop();

// ── DEFERRED CITY GENERATION ──
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        setTimeout(() => {
            cityModel = new CityModel();
            isReady   = true;
            inputMgr  = new InputManager(canvas, camera, cityModel, handleUIState);
        }, 50);
    });
});

// ── OPTIMIZATION MATH ──
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
        return { maxDb: 130.0, status: 'no_constraints', nearby: [], limitingBuilding: null };
    }

    const limiting = nearby.reduce(
        (min, b) => (b.allowed < min.allowed ? b : min),
        nearby[0]
    );

    return { maxDb: Math.round(limiting.allowed * 10) / 10, status: 'optimal', nearby, limitingBuilding: limiting };
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

// ── UI STATE HANDLER ──
function handleUIState(action, building, mouseX, mouseY, isDragging, worldPos) {
    if (!isReady) return;

    if (action === 'hover') {
        if (isDragging) return;

        if (building) {
            tooltip.style.cssText = `display:block;left:${mouseX + 15}px;top:${mouseY + 15}px`;
            tooltip.innerHTML = `
                <div class="b-type">${building.type}</div>
                <div class="b-db">Tolerance: ${building.dbLimit} dB</div>
                <div class="b-coord">Coord: [${Math.round(building.centerX)}, ${Math.round(building.centerY)}]</div>`;
        } else {
            tooltip.style.display = 'none';
        }

        if (worldPos) {
            optimState = { pos: worldPos, data: runOptimization(worldPos.x, worldPos.y) };
        }

    } else if (action === 'leave') {
        tooltip.style.display = 'none';
        optimState = null;

    } else if (action === 'click' && worldPos) {
        const clickedOnBuilding = isBlockedByBuilding(building, worldPos);
        const clickedOnRoad     = cityModel.isRoad(worldPos.x, worldPos.y);

        if (clickedOnBuilding) {
            tooltip.style.display = 'none';
            if (window.showToast) {
                window.showToast(
                    'Cannot Place Stage Here',
                    'Stages cannot be built on top of buildings. Please select an open area.'
                );
            }
            return;
        }

        if (clickedOnRoad) {
            tooltip.style.display = 'none';
            if (window.showToast) {
                window.showToast(
                    'Cannot Place Stage Here',
                    'Stages cannot be built on roads. Please select an open area.'
                );
            }
            return;
        }

        // Valid placement → save and navigate
        const data = runOptimization(worldPos.x, worldPos.y);
        localStorage.setItem('stageOptimData', JSON.stringify({ pos: worldPos, data }));

        window.location.href = 'stage.html';
    }
}

window.addEventListener('resize', () => {
    renderer.resize(window.innerWidth, window.innerHeight);
});