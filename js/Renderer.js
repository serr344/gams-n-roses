import { CONFIG } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grassPattern = null;

        const grassImg = new Image();
        grassImg.onload = () => {
            this.grassPattern = this.ctx.createPattern(grassImg, 'repeat');
        };
        grassImg.onerror = () => console.warn('cimen.png yüklenemedi');
        grassImg.src = CONFIG.ASSET_PATH + 'cimen.png';
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    draw(cityModel, camera, optimState = null) {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(camera.x, camera.y);
        this.ctx.scale(camera.zoom, camera.zoom);

        if (this.grassPattern) {
            this.ctx.fillStyle = this.grassPattern;
        } else {
            this.ctx.fillStyle = "#2d5a27";
        }
        this.ctx.fillRect(0, 0, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);

        this.ctx.fillStyle = "#222";
        for (let r of cityModel.roads) {
            this.ctx.fillRect(r.x, r.y, r.w, r.h);
        }

        cityModel.buildings.forEach(b => {
            const isPark = b.type.includes('Park') || b.type.includes('Meydan') || b.type === 'boşluk';
            const isMerkeziPark = b.type === 'Merkezi Park';

            if (optimState?.data?.nearby && !isPark) {
                const found = optimState.data.nearby.find(
                    n => n.centerX === b.centerX && n.centerY === b.centerY
                );
                if (found) {
                    const allAllowed = optimState.data.nearby.map(x => x.allowed);
                    const minA = Math.min(...allAllowed);
                    const maxA = Math.max(...allAllowed);
                    const t = maxA === minA ? 0.5 : (found.allowed - minA) / (maxA - minA);
                    const r = Math.round(255 * (1 - t));
                    const g = Math.round(180 * t);
                    this.ctx.fillStyle = `rgb(${r},${g},20)`;
                    this.ctx.fillRect(b.x, b.y, b.w, b.h);

                    if (camera.zoom > 1.0) {
                        this.ctx.fillStyle = '#fff';
                        this.ctx.font = `bold ${9 / camera.zoom}px Segoe UI`;
                        this.ctx.fillText(`${found.dbLimit}dB`, b.x + 2 / camera.zoom, b.y + b.h / 2);
                    }
                } else {
                    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
                    this.ctx.lineWidth = 1.5 / camera.zoom;
                    this.ctx.strokeRect(b.x, b.y, b.w, b.h);
                }
            } else if (!isPark) {
                this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
                this.ctx.lineWidth = 1.5 / camera.zoom;
                this.ctx.strokeRect(b.x, b.y, b.w, b.h);
            }

            if (isMerkeziPark) {
                this._drawMerkeziPark(b, camera);
            }

            if (!isMerkeziPark && b.imageObj && b.imageObj.complete && b.imageObj.naturalWidth !== 0) {
                let padding = isPark ? 0 : 2;
                this.ctx.drawImage(
                    b.imageObj,
                    b.x + padding, b.y + padding,
                    b.w - padding * 2, b.h - padding * 2
                );
            }

            if (isPark && !isMerkeziPark) {
                this.ctx.strokeStyle = '#1a5c10';
                this.ctx.lineWidth = 3 / camera.zoom;
                this.ctx.setLineDash([8 / camera.zoom, 4 / camera.zoom]);
                this.ctx.strokeRect(b.x, b.y, b.w, b.h);
                this.ctx.setLineDash([]);

                if (camera.zoom > 1.2) {
                    this.ctx.fillStyle = 'rgba(0,0,0,0.45)';
                    this.ctx.font = `bold ${10 / camera.zoom}px Segoe UI`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('🌳 ' + b.type, b.x + b.w / 2, b.y + b.h / 2);
                    this.ctx.textAlign = 'left';
                }
            }
        });

        if (optimState?.pos) {
            this._drawOptimOverlay(camera, optimState);
        }

        this.ctx.restore();

        if (optimState?.pos && optimState?.data) {
            this._drawHUD(camera, optimState);
        }
    }

    _drawMerkeziPark(b, camera) {
        const ctx = this.ctx;

        const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
        grad.addColorStop(0, '#1e6b12');
        grad.addColorStop(0.4, '#2d8a1f');
        grad.addColorStop(0.7, '#3a9e2a');
        grad.addColorStop(1, '#236e16');
        ctx.fillStyle = grad;
        ctx.fillRect(b.x, b.y, b.w, b.h);

        const shadowW = 18;
        const shadowGrad = ctx.createLinearGradient(b.x, b.y, b.x + shadowW, b.y);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(b.x, b.y, shadowW, b.h);

        const shadowGradR = ctx.createLinearGradient(b.x + b.w - shadowW, b.y, b.x + b.w, b.y);
        shadowGradR.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGradR.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = shadowGradR;
        ctx.fillRect(b.x + b.w - shadowW, b.y, shadowW, b.h);

        ctx.strokeStyle = '#0f4a08';
        ctx.lineWidth = 5 / camera.zoom;
        ctx.setLineDash([]);
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        ctx.strokeStyle = 'rgba(255, 210, 50, 0.6)';
        ctx.lineWidth = 2 / camera.zoom;
        const inset = 6 / camera.zoom;
        ctx.strokeRect(b.x + inset, b.y + inset, b.w - inset * 2, b.h - inset * 2);

        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;

        if (camera.zoom > 0.3) {
            const labelW = 200 / camera.zoom;
            const labelH = 60 / camera.zoom;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(cx - labelW / 2, cy - labelH / 2, labelW, labelH, 8 / camera.zoom);
            } else {
                ctx.rect(cx - labelW / 2, cy - labelH / 2, labelW, labelH);
            }
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = `bold ${22 / camera.zoom}px Segoe UI`;
            ctx.fillStyle = '#ffe066';
            ctx.fillText('🌳 Merkezi Park', cx, cy - 8 / camera.zoom);

            ctx.font = `${11 / camera.zoom}px Segoe UI`;
            ctx.fillStyle = 'rgba(200,255,180,0.85)';
            ctx.fillText('Konser Alanı • 600×500', cx, cy + 14 / camera.zoom);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        if (camera.zoom > 0.5) {
            const treeSize = 28 / camera.zoom;
            const margin = 20 / camera.zoom;
            const corners = [
                { x: b.x + margin, y: b.y + margin },
                { x: b.x + b.w - margin - treeSize, y: b.y + margin },
                { x: b.x + margin, y: b.y + b.h - margin - treeSize },
                { x: b.x + b.w - margin - treeSize, y: b.y + b.h - margin - treeSize },
            ];
            ctx.font = `${treeSize}px Segoe UI`;
            ctx.textBaseline = 'top';
            for (const c of corners) {
                ctx.fillText('🌲', c.x, c.y);
            }
            ctx.textBaseline = 'alphabetic';
        }
    }

    _drawOptimOverlay(camera, optimState) {
        const { x, y } = optimState.pos;
        const RADIUS = 600;
        const ctx = this.ctx;

        ctx.strokeStyle = 'rgba(255,200,0,0.7)';
        ctx.lineWidth = 3 / camera.zoom;
        ctx.setLineDash([12 / camera.zoom, 6 / camera.zoom]);
        ctx.beginPath();
        ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        [0.25, 0.5, 0.75].forEach(frac => {
            ctx.strokeStyle = `rgba(255,200,0,0.12)`;
            ctx.lineWidth = 1 / camera.zoom;
            ctx.beginPath();
            ctx.arc(x, y, RADIUS * frac, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.fillStyle = 'rgba(255,220,0,1)';
        ctx.beginPath();
        ctx.arc(x, y, 14 / camera.zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.stroke();

        if (camera.zoom > 0.5) {
            ctx.font = `bold ${14 / camera.zoom}px Segoe UI`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.fillText('🎸', x, y);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        if (optimState.data?.limitingBuilding?.centerX != null) {
            const lb = optimState.data.limitingBuilding;
            ctx.strokeStyle = 'rgba(255,80,80,0.8)';
            ctx.lineWidth = 2 / camera.zoom;
            ctx.setLineDash([6 / camera.zoom, 4 / camera.zoom]);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(lb.centerX, lb.centerY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    _drawHUD(camera, optimState) {
        const ctx = this.ctx;
        const { x, y } = optimState.pos;
        const data = optimState.data;

        const sx = x * camera.zoom + camera.x;
        const sy = y * camera.zoom + camera.y;

        const W = 240, H = data.limitingBuilding ? 135 : 100;
        let bx = sx + 24, by = sy - H - 16;
        if (bx + W > this.canvas.width - 10) bx = sx - W - 24;
        if (by < 10) by = sy + 24;

        ctx.fillStyle = 'rgba(8,12,20,0.92)';
        ctx.strokeStyle = data.maxDb > 100 ? '#ff4444' : data.maxDb > 80 ? '#ffaa00' : '#44ff99';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, W, H, 10);
        else ctx.rect(bx, by, W, H);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillText('🎸Location Potential Analysis', bx + 10, by + 22);

        const dbColor = data.maxDb > 100 ? '#ff4444' : data.maxDb > 80 ? '#ffaa00' : '#44ff99';
        ctx.fillStyle = dbColor;
        ctx.font = 'bold 30px Segoe UI';
        ctx.fillText(`${data.maxDb} dB`, bx + 10, by + 62);

        ctx.fillStyle = '#888';
        ctx.font = '11px Segoe UI';
        ctx.fillText(`${data.nearby?.length ?? 0} buildings in range`, bx + 130, by + 50);
        ctx.fillText('r = 600 units', bx + 130, by + 65);

        if (data.limitingBuilding) {
            ctx.strokeStyle = 'rgba(255,100,100,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + 10, by + 75);
            ctx.lineTo(bx + W - 10, by + 75);
            ctx.stroke();

            ctx.fillStyle = '#ff8888';
            ctx.font = 'bold 11px Segoe UI';
            ctx.fillText('⚠ Most restrictive:', bx + 10, by + 92);
            ctx.fillStyle = '#fff';
            ctx.font = '11px Segoe UI';
            const name = data.limitingBuilding.type.length > 22
                ? data.limitingBuilding.type.slice(0, 22) + '…'
                : data.limitingBuilding.type;
            ctx.fillText(name, bx + 10, by + 108);
            ctx.fillStyle = '#aaa';
            ctx.fillText(
                `${Math.round(data.limitingBuilding.dist)}m · ${data.limitingBuilding.dbLimit} dB limit`,
                bx + 10, by + 124
            );
        }

        if (data.status === 'no_constraints') {
            ctx.fillStyle = '#44ff99';
            ctx.font = '12px Segoe UI';
            ctx.fillText('No nearby buildings — free zone!', bx + 10, by + 88);
        }
    }
}