
import * as ex from 'excalibur';

export const cellSize = 10
export const halfCellSize = cellSize/2

export class Cell extends ex.Actor {
    vector: ex.Vector

    updatePos( vec: ex.Vector ): void {
        this.vector = vec;
        this.pos = ex.vec(vec.x * cellSize + halfCellSize, vec.y * cellSize + halfCellSize);
    } 

    constructor() {
        super({
            pos: ex.vec(0, 0),
            width: cellSize,
            height: cellSize,
            color: ex.Color.fromHex("#4E44AC"),
            collisionType: ex.CollisionType.PreventCollision
        })

        this.vector = ex.vec(0, 0);
    }


}
