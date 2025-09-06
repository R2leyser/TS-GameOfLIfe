import * as ex from 'excalibur';
import { Cell, cellSize } from './cell';
import { RentalPool } from './lib/RentalPool';

export const initialAmountOfCells = 10000
export const framesOfFade = 100


type DeadCell = {
    pos: ex.Vector;
    life: number;
};

export class GameOfLife extends ex.Scene {
   possibleCellMap: ex.Vector[] = [];
   mockPossibleCellMap: ex.Vector[] = [];
   activeCellMap: Map<string, Cell> = new Map<string, Cell>();
   changedCells: Set<ex.Vector> = new Set<ex.Vector>;
   deadCellMap: Map<string, DeadCell> = new Map<string, DeadCell>();
   title: ex.Label = new ex.Label();

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
                                        let cell = new Cell()
                                        if (!cell) {
                                        }
                                        return cell
                                    },

                                    (used: Cell) => {
                                        used.updatePos(ex.vec(0, 0))
                                        return used
                                    }, 

                                    initialAmountOfCells );


    private addActiveCell(vec: ex.Vector) {
        const key = GameOfLife.generateKey(vec);
        if (this.activeCellMap.has(key)){
            return
        }

        let cell = this.pool.rent();

        cell.updatePos(vec);
        
        if (!this.changedCells.has(vec)){
            this.changedCells.add(vec);
        }

        this.activeCellMap.set(key, cell);

    }



    private restartSimulation() {
        this.activeCellMap.forEach(cell => {
            if (cell) {  
                this.pool.return(cell);
            }
        });


        this.clear(false);
        this.possibleCellMap = [];
        this.mockPossibleCellMap = [];
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

        // Gather all possible cells (current active and their neighbors)
        this.possibleCellMap.length = 0;
        this.mockPossibleCellMap.length = 0
        const visited = new Set<string>();

        this.activeCellMap.forEach((cell: Cell) => {
            const vec = cell.vector;
            const key = GameOfLife.generateKey(vec);

            const worldP = this.gridToWorld(vec);
            const isOutOfBounds = worldP.x > this.engine.canvasWidth + cellSize ||
                    worldP.y > this.engine.canvasHeight + cellSize ||
                    worldP.x < -cellSize ||
                    worldP.y < -cellSize

            if (!visited.has(key)) {
                this.possibleCellMap.push(vec);
                visited.add(key);
            }
            for (const dir of this.directions) {
                if (!(isOutOfBounds)) { 
                    const neighborPos = vec.add(dir);
                    const neighborKey = GameOfLife.generateKey(neighborPos);
                    if (!visited.has(neighborKey)) {
                        this.possibleCellMap.push(neighborPos);
                        visited.add(neighborKey);
                    }
                }
            }
        });
        this.changedCells.clear();

        const neighborCounts = new Map<string, number>();

        for (const vec of this.possibleCellMap) {
            const key = GameOfLife.generateKey(vec);
            const count = this.countNeighbours(vec);
            neighborCounts.set(key, count);
        }

        const nextGenerationMap = new Map<string, Cell>();
        for (const p of this.possibleCellMap) {
            const key = GameOfLife.generateKey(p);
            const neighbors = neighborCounts.get(GameOfLife.generateKey(p)) as number;
            const isCurrentlyActive = this.activeCellMap.has(key);
            const worldP = this.gridToWorld(p);
            const isOutOfBounds = worldP.x > this.engine.canvasWidth + cellSize ||
                    worldP.y > this.engine.canvasHeight + cellSize ||
                    worldP.x < -cellSize ||
                    worldP.y < -cellSize

            // Cell reproduce
            if (!isCurrentlyActive && neighbors === 3) {
                if ( isOutOfBounds ) {
                } else {

                    let cell = this.pool.rent();

                    cell.updatePos(p);

                    nextGenerationMap.set(key, cell);
                    if (!this.changedCells.has(p)) {
                        this.changedCells.add(p);
                    }

                }
            // Cell dies
            } else if (isCurrentlyActive && (neighbors > 3 || neighbors < 2)) {

                if (!this.changedCells.has(p)) {
                    this.changedCells.add(p);
                }

                const currentCell = this.activeCellMap.get(key);
                if (currentCell !== undefined) {
                    this.pool.return(currentCell);
                    this.activeCellMap.delete(key)
                }
            //Cell survives
            } else if (isCurrentlyActive && (neighbors === 2 || neighbors === 3)) {
                const currentCell = this.activeCellMap.get(key);
                if (currentCell != undefined) {
                    nextGenerationMap.set(key, currentCell);
                }
            }
        }

        this.activeCellMap = nextGenerationMap;
    }

    override onPreDraw(ctx: ex.ExcaliburGraphicsContext, elapsed: number): void {
        super.onPreDraw(ctx, elapsed);

        this.activeCellMap.forEach( (cell: Cell) => {
            const recSize = cellSize * this.camera.zoom;
            ctx.drawRectangle(
                cell.pos.scale(this.camera.zoom)
                    .sub(ex.vec(recSize/2, recSize/2)),
                recSize,
                recSize,
                cell.color
            );
        })
    }


    override onInitialize(): void {

        this.input.pointers.primary.on('down', (evt) => {
            const x1 = Math.floor(evt.worldPos.x / cellSize);
            const y1 = Math.floor(evt.worldPos.y / cellSize);
            let vec = ex.vec(x1, y1);
            
            for (let x = -20; x < 20; x ++) {
                for (let y = -20; y  <  20; y ++) {
                    let rand = Math.random();
                    if (rand > 0.7) { 
                        var tempVec = vec.add(ex.vec(x, y));
                        this.addActiveCell(tempVec);
                        this.changedCells.add(tempVec);
                    }
                }
                this.addActiveCell(vec);
                this.changedCells.add(vec);
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
