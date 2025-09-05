import * as ex from 'excalibur';
import { Cell, cellSize } from './cell';
import { RentalPool } from './lib/RentalPool';

export const initialAmountOfCells = 400

export class GameOfLife extends ex.Scene {
    private possibleCellMap: ex.Vector[] = [];
    private activeCellMap: Map<string, Cell> = new Map<string, Cell>();
    private deadCellMap: Map<string, Cell> = new Map<string, Cell>();
    private directions: ex.Vector[] = [ 
            new ex.Vector(-1,-1 ),
            new ex.Vector(-1, 0 ),
            new ex.Vector(-1, 1 ),
            new ex.Vector( 0,-1 ),
            new ex.Vector( 0, 1 ),
            new ex.Vector( 1,-1 ),
            new ex.Vector( 1, 0 ),
            new ex.Vector( 1, 1 ),
        ];
    private pool: RentalPool<Cell> = new RentalPool( () => { 
                                        let cell = new Cell(new ex.Vector(-100,-100))
                                        return cell
                                    },

                                    (used: Cell) => {
                                        used.graphics.opacity = 1;
                                        return used
                                    }, 

                                    initialAmountOfCells * 2);

    private restartSimulation() {
        this.possibleCellMap = [];
        this.activeCellMap = new Map<string, Cell>();
        this.deadCellMap = new Map<string, Cell>();

        for (let i = 0; i < initialAmountOfCells; i++) {
            let x = Math.ceil((Math.random() * this.engine.halfCanvasWidth / cellSize) - 1);
            let y = Math.ceil((Math.random() * this.engine.halfCanvasHeight / cellSize) - 1);
            let vec = new ex.Vector(x, y);

            if (!this.activeCellMap.has(this.generateKey(vec))) {
                this.addActiveCell(vec);
            }
        }

    }


    private generateKey(vector: ex.Vector): string {
        return [vector.x, vector.y].join(',');
    }

    private gridToWorld(vector: ex.Vector): ex.Vector {
        return vector.scale(new ex.Vector(cellSize, cellSize)).add(new ex.Vector(cellSize/2, cellSize/2))
    }

    private addActiveCell(vec: ex.Vector, age?: number, dead?: boolean ) {
        let cell = this.pool.rent();
        cell.updatePos(vec);
        cell.actions.clearActions();
        this.activeCellMap.set(this.generateKey(vec), cell);
        this.add(cell);
    }

    private countNeighbours(vector: ex.Vector): number { 
        let count = 0; 
        for (let dir = 0; dir < this.directions.length; dir++) {
            const neighborPos = vector.add(this.directions[dir]);
            if (this.activeCellMap.has(this.generateKey(neighborPos))) {
                count++;
            }
        }
        return count;
    }

    constructor() {
        super();
    }

    override onPostDraw(ctx: ex.ExcaliburGraphicsContext, elapsed: number): void {
        super.onPostDraw(ctx, elapsed);

        // Step 1: Gather all possible cells (current active and their neighbors)
        this.possibleCellMap.length = 0;
        const visited = new Set<string>();

        this.activeCellMap.forEach((cell: Cell) => {
            const vec = cell.vector;
            const key = this.generateKey(vec);
            if (!visited.has(key)) {
                this.possibleCellMap.push(vec);
                visited.add(key);
            }
            for (const dir of this.directions) {
                if (!cell.isOffScreen) {
                    const neighborPos = vec.add(dir);
                    const neighborKey = this.generateKey(neighborPos);
                    if (!visited.has(neighborKey)) {
                        this.possibleCellMap.push(neighborPos);
                        visited.add(neighborKey);
                    }
                }
            }
        });

        // Step 2: Determine the next generation
        const nextGenerationMap = new Map<string, Cell>();
        for (const p of this.possibleCellMap) {
            const key = this.generateKey(p);
            const neighbors = this.countNeighbours(p);
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
                    worldP.x > this.engine.halfCanvasWidth + cellSize ||
                    worldP.y > this.engine.halfCanvasHeight + cellSize ||
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
                if (!this.deadCellMap.has(key)) {
                    this.deadCellMap.set(key, cell);
                    cell.actions.fade(0, 500).toPromise().finally(() => {
                        this.deadCellMap.delete(key);
                        this.pool.return(cell);
                        this.remove(cell);
                    });
                } else {
                    let deadCell = this.deadCellMap.get(key);
                    if (deadCell == undefined) {
                    } else {
                        this.pool.return(deadCell);
                        this.remove(deadCell);
                        this.deadCellMap.set(key, cell);
                        cell.actions.fade(0, 500).toPromise().finally(() => {
                            this.deadCellMap.delete(key);
                            this.pool.return(cell);
                            this.remove(cell);
                        });
                    }
                }
            }
        });

        this.activeCellMap = nextGenerationMap;
    }

    override onInitialize(engine: ex.Engine): void {
        this.input.pointers.primary.on('down', (evt) => {
            const x = Math.floor(evt.worldPos.x / cellSize);
            const y = Math.floor(evt.worldPos.y / cellSize);
            let vec = new ex.Vector(x, y);

            if (this.activeCellMap.has(this.generateKey(vec))) { } else {
                for (let dir of this.directions) {
                    var tempVec = new ex.Vector(vec.x + dir.x, vec.y + dir.y);
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

        this.restartSimulation();
    }
};
