
import * as ex from 'excalibur';

export const cellSize = 5
export const halfCellSize = cellSize/2

export class Cell {
    vector: ex.Vector = ex.vec(0,0);
    pos: ex.Vector = ex.vec(0, 0);
    width: number = cellSize;
    height: number = cellSize;
    color: ex.Color = ex.Color.fromHex("#4E44AC");
    collisionType = ex.CollisionType.PreventCollision;

    updatePos( vec: ex.Vector ): void {
        this.vector = vec;
        this.pos = ex.vec(vec.x * cellSize + halfCellSize, vec.y * cellSize + halfCellSize);
    } 



}
