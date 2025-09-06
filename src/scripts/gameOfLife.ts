import * as ex from 'excalibur';
import { Cell, cellSize } from './cell';
import { RentalPool } from './lib/RentalPool';

export const initialAmountOfCells = 5000
export const framesOfFade = 100


type DeadCell = {
    pos: ex.Vector;
    life: number;
};

export class GameOfLife extends ex.Scene {
   possibleCellMap: ex.Vector[] = [];
   activeCellMap: Map<string, Cell> = new Map<string, Cell>();
   deadCellMap: Map<string, DeadCell> = new Map<string, DeadCell>();
   directions: ex.Vector[] = [ 
            ex.vec(-1,-1 ),
            ex.vec(-1, 0 ),
            ex.vec(-1, 1 ),
            ex.vec( 0,-1 ),
            ex.vec( 0, 1 ),
            ex.vec( 1,-1 ),
            ex.vec( 1, 0 ),
            ex.vec( 1, 1 ),
        ];
    pool: RentalPool<Cell> = new RentalPool( () => { 
                                        let cell = new Cell(ex.vec(-100,-100))
                                        return cell
                                    },

                                    (used: Cell) => {
                                        used.graphics.opacity = 1;
                                        return used
                                    }, 

                                    initialAmountOfCells * 2);

    private restartSimulation() {
        this.clear(false);
        this.possibleCellMap = [];
        this.activeCellMap = new Map<string, Cell>();
        this.deadCellMap = new Map<string, DeadCell>();

        for (let i = 0; i < initialAmountOfCells; i++) {
            let x = Math.ceil((Math.random() * this.engine.canvasWidth / cellSize) - 1);
            let y = Math.ceil((Math.random() * this.engine.canvasHeight / cellSize) - 1);
            let vec = ex.vec(x, y);

            if (!this.activeCellMap.has(GameOfLife.generateKey(vec))) {
                this.addActiveCell(vec);
            }
        }

    }


    static generateKey(vector: ex.Vector): string {
        return [vector.x, vector.y].join(',');
    }

    private gridToWorld(vector: ex.Vector): ex.Vector {
        return vector.scale(ex.vec(cellSize, cellSize)).add(ex.vec(cellSize/2, cellSize/2))
    }

    private addActiveCell(vec: ex.Vector) {
        if (this.activeCellMap.has(GameOfLife.generateKey(vec))){
            return
        }
        let cell = this.pool.rent();
        cell.updatePos(vec);
        cell.actions.clearActions();
        this.activeCellMap.set(GameOfLife.generateKey(vec), cell);
        this.add(cell);
    }

    private countNeighbours(vector: ex.Vector): number { 
        let count = 0; 
        for (let dir = 0; dir < this.directions.length; dir++) {
            const neighborPos = vector.add(this.directions[dir]);
            if (this.activeCellMap.has(GameOfLife.generateKey(neighborPos))) {
                count++;
            }
        }
        return count;
    }

    constructor() {
        super();
    }

    override onPreUpdate(engine: ex.Engine, elapsed: number): void {
        
        super.onPreUpdate(engine, elapsed);

        // Step 1: Gather all possible cells (current active and their neighbors)
        this.possibleCellMap.length = 0;
        const visited = new Set<string>();

        this.activeCellMap.forEach((cell: Cell) => {
            const vec = cell.vector;
            const key = GameOfLife.generateKey(vec);
            if (!visited.has(key)) {
                this.possibleCellMap.push(vec);
                visited.add(key);
            }
            for (const dir of this.directions) {
                if (!cell.isOffScreen) {
                    const neighborPos = vec.add(dir);
                    const neighborKey = GameOfLife.generateKey(neighborPos);
                    if (!visited.has(neighborKey)) {
                        this.possibleCellMap.push(neighborPos);
                        visited.add(neighborKey);
                    }
                }
            }
        });

        const neighborCounts = new Map<string, number>();

        for (const vec of this.possibleCellMap) {
            const key = GameOfLife.generateKey(vec);
            const count = this.countNeighbours(vec);
            // Ensure the active cell itself is in the count map to check for survival
            neighborCounts.set(key, count);
        }

        // Step 2: Determine the next generation
        const nextGenerationMap = new Map<string, Cell>();
        for (const p of this.possibleCellMap) {
            const key = GameOfLife.generateKey(p);
            const neighbors = neighborCounts.get(GameOfLife.generateKey(p));
            const isCurrentlyActive = this.activeCellMap.has(key);

            // Game of Life rules
            // Rule 2: A live cell with 2 or 3 neighbors survives
            if (isCurrentlyActive && (neighbors === 2 || neighbors === 3)) {
                // Keep the cell alive in the next generation
                const cell = this.activeCellMap.get(key)!;
                nextGenerationMap.set(key, cell);
            }

            // Rule 4: A dead cell with exactly 3 neighbors becomes a live cell
            else if (!isCurrentlyActive && neighbors === 3) {
                const worldP = this.gridToWorld(p);
                if (
                    worldP.x > this.engine.canvasWidth + cellSize ||
                    worldP.y > this.engine.canvasHeight + cellSize ||
                    worldP.x < -cellSize ||
                    worldP.y < -cellSize
                ) {
                    // Implicit delete
                } else {
                    const cell = this.pool.rent();
                    cell.updatePos(p);
                    cell.actions.clearActions();
                    nextGenerationMap.set(key, cell);
                    this.add(cell); // Add the new cell to the scene
                }
            }
        }

        this.activeCellMap.forEach((cell, key) => {
            if (!nextGenerationMap.has(key)) {
                this.deadCellMap.set(key, {
                    pos: cell.pos,
                    life: framesOfFade
                } as DeadCell);
                this.remove(cell);
                this.pool.return(cell);
            }
        });

        this.activeCellMap = nextGenerationMap;
    }

    // override onPostDraw(ctx: ex.ExcaliburGraphicsContext, elapsed: number): void {
    //     super.onPostDraw(ctx, elapsed);
    //     this.deadCellMap.forEach( (deadCell: DeadCell, key: string) => {
    //         const recSize = cellSize * this.camera.zoom;
    //         const alpha = deadCell.life/framesOfFade;
    //         ctx.drawRectangle(
    //             deadCell.pos.scale(this.camera.zoom)
    //                 .sub(ex.vec(recSize/2, recSize/2)),
    //             recSize,
    //             recSize,
    //             ex.Color.fromRGB(255, 0, 0, alpha)
    //         );
    //         if (deadCell.life <= -1) {
    //             this.deadCellMap.delete(key);
    //         }
    //         deadCell.life--
    //     })
    // }

    override onInitialize(): void {
        this.input.pointers.primary.on('down', (evt) => {
            const x1 = Math.floor(evt.worldPos.x / cellSize);
            const y1 = Math.floor(evt.worldPos.y / cellSize);
            let vec = ex.vec(x1, y1);
            
            for (let x = -15; x  <  15; x ++) {
                for (let y = -15; y  <  15; y ++) {
                    var tempVec = vec.add(ex.vec(x, y));
                    this.addActiveCell(tempVec);
                }
                this.addActiveCell(vec);
            }
        });

        this.input.keyboard.on('press', (evt) => {
            if (evt.key == ex.Keys.R) {
                this.restartSimulation();
            } 
        })

        this.camera.zoom = 0.5
        this.camera.pos = ex.vec( this.engine.halfCanvasWidth, this.engine.halfCanvasHeight )


        this.restartSimulation();
    }
};
