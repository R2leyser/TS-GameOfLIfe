
import * as ex from 'excalibur';
import { GameOfLife } from './gameOfLife';

export const cellSize = 10
export const halfCellSize = cellSize/2

export class Cell extends ex.Actor {
    vector: ex.Vector

    constructor(vector: ex.Vector) {
        super({
            pos: ex.vec(vector.x * cellSize + halfCellSize, vector.y * cellSize + halfCellSize),
            width: cellSize,
            height: cellSize,
            color: ex.Color.fromHex("#4E44AC")
        })

        this.vector = vector;
    }

    updatePos( vec: ex.Vector ): void {
        this.vector = vec;
        this.pos = ex.vec(vec.x * cellSize + halfCellSize, vec.y * cellSize + halfCellSize);
    } 
}
