import * as ex from 'excalibur';
import { Cell } from './cell';
import { RentalPool } from './lib/RentalPool';

export class GameOfLife extends ex.Scene {
    private possibleCellMap: ex.Vector[] = [];
    private activeCellMap: Map<string, Cell> = new Map<string, Cell>();
    private newActiveCellMap: Map<string, Cell> = new Map<string, Cell>();
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

    addNewActiveCell(vec: ex.Vector, age?: number, dead?: boolean ) {
            let cell = this.pool.rent();
            cell.updatePos(vec);
            cell.updateAge(1);
            this.newActiveCellMap.set(vec.toString(), cell);
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

    override onPreDraw(ctx: ex.ExcaliburGraphicsContext, elapsed: number): void {
        super.onPreDraw(ctx, elapsed);

        this.activeCellMap.forEach((cell) => {
            this.add(cell);
        });

        this.possibleCellMap.length = 0;

        this.activeCellMap.forEach((cell: Cell) => {
            let vec = cell.vector;
            for (let dir of this.directions) {
                var neighborPos = new ex.Vector(vec.x + dir.x, vec.y + dir.y)
                this.possibleCellMap.push(neighborPos);
            };
            this.possibleCellMap.push(vec);
        });

        this.possibleCellMap.forEach((p: ex.Vector) => {
            let neighbors = 0;
            let key = p.toString();

            neighbors = this.countNeighbours(p);
            
            if ( neighbors == 3 ) {
                let cell = this.pool.rent();
                cell.updatePos(p); 
                cell.updateAge(1);
                this.newActiveCellMap.set(key,cell);
            } else if ( neighbors == 2  && this.activeCellMap.has(key)) {
                let cell = this.pool.rent();
                cell.updatePos(p); 
                cell.updateAge(1);
                this.newActiveCellMap.set(key,cell);
            } 
        })

        const keysToRemove: string[] = [];
        this.activeCellMap.forEach((cell) => {
            this.remove(cell);
            this.pool.return(cell);
            keysToRemove.push(cell.vector.toString());
        });

        this.activeCellMap.clear();

        this.activeCellMap = new Map(this.newActiveCellMap);

        const newKeysToRemove: string[] = [];
        this.newActiveCellMap.forEach((cell) => {
            this.pool.return(cell);
            newKeysToRemove.push(cell.vector.toString());
        });
        this.newActiveCellMap.clear();
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
