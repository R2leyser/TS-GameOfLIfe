import * as ex from 'excalibur';
import { Cell } from './cell';
import { RentalPool } from './lib/RentalPool';

export class GameOfLife extends ex.Scene {
    private possibleCellMap: ex.Vector[] = [];
    private activeCellMap: Map<string, Cell> = new Map<string, Cell>();
    private newActiveCellMap: Map<string, Cell> = new Map<string, Cell>();
    private deadCellMap: Map<string, Cell> = new Map<string, Cell>();
    private directions: ex.Vector[] = [];

    private pool: RentalPool<Cell> = new RentalPool( () => { 
                                        let cell = new Cell(new ex.Vector(-100,-100), 1)
                                        return cell
                                    },
                                   (used: Cell) => {
                                        console.info(`Returned ${used}`)
                                        used.updateAge(1);
                                        used.updatePos(new ex.Vector(-100, -100));
                                        return used
                                    }, 
                                    100);

    addActiveCell(vec1: ex.Vector, age?: number, dead?: boolean ) {
        this.activeCellMap.set(vec1.toString(), new Cell(vec1, age, dead));
    }

    countNeighbours(cell: Cell | undefined): number { 
        if(cell == undefined){
            return -1;
        }
        let count = 0; 
        for (let dir = 0; dir < this.directions.length; dir++) {
            const neighborPos = cell.vector.add(this.directions[dir]);
            console.info( `Checking neighbor at ${neighborPos.x},${neighborPos.y}` );
            if (this.activeCellMap.has(neighborPos.toString())) {
                count++;
                console.log( `Found neighbor at ${neighborPos.x},${neighborPos.y}` );
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
            if (!this.actors.includes(cell)){
                this.add(cell);
            }
        });

        this.possibleCellMap.length = 0;

        this.activeCellMap.forEach((cell: Cell) => {
            this.directions.forEach((dir) => {
                const neighborPos = cell.vector.add(dir);
                this.possibleCellMap.push(neighborPos);
            });
        });

        this.possibleCellMap.forEach((p: ex.Vector) => {
            let neighbors = 0;
            let key = p.toString();

            let cell = this.pool.rent();
            cell.updatePos(p);
            cell.updateAge(1);
            neighbors = this.countNeighbours(cell);
            
            if ( neighbors == 3 ) {
                this.add(cell);
                this.newActiveCellMap.set(key, cell);
            } else if ( neighbors == 2  && this.activeCellMap.has(key)) {
                this.add(cell);
                this.newActiveCellMap.set(key, cell);
            } 
        })

        this.activeCellMap.forEach((cell) => {
            this.remove(cell);
            this.pool.return(cell);
            this.activeCellMap.delete(cell.vector.toString());
        });

        this.activeCellMap = new Map(this.newActiveCellMap);

        this.newActiveCellMap.forEach((cell) => {
            this.remove(cell);
            this.pool.return(cell);
            this.newActiveCellMap.delete(cell.vector.toString());
        });
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

            this.directions.forEach((dir) => {
                let cell = this.pool.rent();
                let temp =  new ex.Vector(vec.x + dir.x, vec.y + dir.y) 
                cell.updatePos(temp);
                cell.updateAge(1);
                this.activeCellMap.set(temp.toString(), cell);
                this.add(cell);
            });

            let cell = this.pool.rent();
            cell.updatePos(vec);
            cell.updateAge(1);
            this.activeCellMap.set(vec.toString(), cell);
            this.add(cell);
        });
    }
};
