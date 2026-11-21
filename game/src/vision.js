// Velvet Fox — seeing and being seen. Line of sight between two points is
// blocked by walls or by a smoke cloud; a viewer spots the thief when the
// thief is inside the viewer's cone, in range, and in line of sight.
import { SMOKE_RADIUS } from './config.js';

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Liang-Barsky clipping: true when the segment crosses the rectangle.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

function segmentHitsCircle(x1, y1, x2, y2, c) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((c.x - x1) * dx + (c.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  const ddx = px - c.x;
  const ddy = py - c.y;
  return ddx * ddx + ddy * ddy <= c.r * c.r;
}

export function hasLineOfSight(x1, y1, x2, y2, walls, smokes) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  for (const smoke of smokes) {
    if (segmentHitsCircle(x1, y1, x2, y2, { x: smoke.x, y: smoke.y, r: SMOKE_RADIUS })) return false;
  }
  return true;
}

export function canSee(viewer, target, range, halfAngle, walls, smokes) {
  const dx = target.x - viewer.x;
  const dy = target.y - viewer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 30) return hasLineOfSight(viewer.x, viewer.y, target.x, target.y, walls, smokes);
  const facing = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(facing, viewer.angle)) > halfAngle) return false;
  return hasLineOfSight(viewer.x, viewer.y, target.x, target.y, walls, smokes);
}

export function moveCircleOutOfWalls(pos, radius, walls, bounds) {
  // Push a circle out of every wall it overlaps; returns true if it moved.
  let moved = false;
  for (const wall of walls) {
    const nearestX = Math.max(wall.x, Math.min(pos.x, wall.x + wall.w));
    const nearestY = Math.max(wall.y, Math.min(pos.y, wall.y + wall.h));
    const dx = pos.x - nearestX;
    const dy = pos.y - nearestY;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < radius * radius) {
      if (dist2 === 0) {
        pos.y -= radius;
      } else {
        const dist = Math.sqrt(dist2);
        pos.x += (dx / dist) * (radius - dist);
        pos.y += (dy / dist) * (radius - dist);
      }
      moved = true;
    }
  }
  pos.x = Math.max(bounds.x + radius, Math.min(bounds.x + bounds.w - radius, pos.x));
  pos.y = Math.max(bounds.y + radius, Math.min(bounds.y + bounds.h - radius, pos.y));
  return moved;
}
