import * as ex from 'excalibur';
import { Cell } from './cell';
import { RentalPool } from './lib/RentalPool';

export class GameOfLife extends ex.Scene {
    private possibleCellMap: ex.Vector[] = [];
    private activeCellMap: Map<string, Cell> = new Map<string, Cell>();
    private directions: ex.Vector[] = [];

    private pool: RentalPool<Cell> = new RentalPool( () => { 
                                        let cell = new Cell(new ex.Vector(-100,-100), 1)
                                        return cell
                                    },

                                    (used: Cell) => {
                                        used.updateAge(1);
                                        used.updatePos(new ex.Vector(-100, -100));
                                        return used
                                    }, 

                                    100);

    addActiveCell(vec: ex.Vector, age?: number, dead?: boolean ) {
            let cell = this.pool.rent();
            cell.updatePos(vec);
            cell.updateAge(1);
            this.activeCellMap.set(vec.toString(), cell);
            this.add(cell);
    }

    countNeighbours(vector: ex.Vector): number { 
        let count = 0; 
        for (let dir = 0; dir < this.directions.length; dir++) {
            const neighborPos = vector.add(this.directions[dir]);
            console.info( `Checking neighbor at ${neighborPos.x},${neighborPos.y}` );
            if (this.activeCellMap.has(neighborPos.toString())) {
                count++;
                console.debug( `Found neighbor at ${neighborPos.x},${neighborPos.y}` );
            }
        }
        return count
    }

    constructor() {
        super()
    }

    override onPostDraw(ctx: ex.ExcaliburGraphicsContext, elapsed: number): void {
        super.onPostDraw(ctx, elapsed);


        // Step 1: Gather all possible cells (current active and their neighbors)
        this.possibleCellMap.length = 0;
        const visited = new Set<string>();

        this.activeCellMap.forEach((cell: Cell) => {
            const vec = cell.vector;
            if (!visited.has(vec.toString())) {
                this.possibleCellMap.push(vec);
                visited.add(vec.toString());
            }
            for (const dir of this.directions) {
                const neighborPos = vec.add(dir);
                if (!visited.has(neighborPos.toString())) {
                    this.possibleCellMap.push(neighborPos);
                    visited.add(neighborPos.toString());
                }
            }
        });

        // Step 2: Determine the next generation
        const nextGenerationMap = new Map<string, Cell>();
        for (const p of this.possibleCellMap) {
            const key = p.toString();
            const neighbors = this.countNeighbours(p);
            const isCurrentlyActive = this.activeCellMap.has(key);

            // Game of Life rules
            // Rule 2: A live cell with 2 or 3 neighbors survives
            if (isCurrentlyActive && (neighbors === 2 || neighbors === 3)) {
                // Keep the cell alive in the next generation
                // Note: You can reuse the existing cell object here for efficiency
                const cell = this.activeCellMap.get(key)!;
                nextGenerationMap.set(key, cell);
            } 

            // Rule 4: A dead cell with exactly 3 neighbors becomes a live cell
            else if (!isCurrentlyActive && neighbors === 3) {
                const cell = this.pool.rent();
                cell.updatePos(p);
                cell.updateAge(1);
                nextGenerationMap.set(key, cell);
                this.add(cell); // Add the new cell to the scene
            }
        }

        this.activeCellMap.forEach((cell, key) => {
            if (!nextGenerationMap.has(key)) {
                this.remove(cell);
                this.pool.return(cell);
            }
        });

        this.activeCellMap = nextGenerationMap;
    }

    override onInitialize(engine: ex.Engine): void {

        this.directions = [ 
            new ex.Vector(-1,-1 ),
            new ex.Vector(-1, 0 ),
            new ex.Vector(-1, 1 ),
            new ex.Vector( 0,-1 ),
            new ex.Vector( 0, 1 ),
            new ex.Vector( 1,-1 ),
            new ex.Vector( 1, 0 ),
            new ex.Vector( 1, 1 ),
        ]

        this.input.pointers.primary.on('down', (evt) => {
            const x = Math.floor(evt.worldPos.x / 50);
            const y = Math.floor(evt.worldPos.y / 50);
            let vec = new ex.Vector(x, y)

            if (this.activeCellMap.has(vec.toString())) {
                return
            }

            console.log(vec);
            for (let dir of this.directions) {
                var tempVec = new ex.Vector(vec.x + dir.x, vec.y + dir.y)
                this.addActiveCell(tempVec);
            }
            this.addActiveCell(vec);

        });
    }
};
