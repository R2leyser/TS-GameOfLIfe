// Excalibur is loaded into the ex global namespace
//
import * as ex from 'excalibur';
import { Cell } from './cell';


export class GameOfLife extends ex.Scene {
    private possibleCellMap: ex.Vector[];
    private activeCellMap: Map<string, Cell>;
    private newActiveCellMap: Map<string, Cell>;
    private deadCellMap: Map<string, Cell>;
    private garbageCollector: ex.GarbageCollector;


    private directions: ex.Vector[]

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
                // console.log(cell.vector);
                this.add(cell);
        });

        // clear possible cell map
        this.possibleCellMap.length = 0;

        // add all active cells to possible cell map
        this.activeCellMap.forEach((cell: Cell) => {
            // this.possibleCellMap.push(cell.vector);
            // add all neighbors to possible cell map
            this.directions.forEach((dir) => {
                const neighborPos = cell.vector.add(dir);
                this.possibleCellMap.push(neighborPos);
            });
        });


        this.possibleCellMap.forEach((p: ex.Vector) => {
            let neighbors = 0;

            let cell = new Cell(p, 1);
            neighbors = this.countNeighbours(cell);
            
            if ( neighbors == 3 ) {
                this.newActiveCellMap.set(p.toString(), cell);
            } else if ( neighbors == 2  && this.activeCellMap.has(p.toString())) {
                this.newActiveCellMap.set(p.toString(), cell);
            }
        })


        // this.deadCellMap.forEach((cell) => {
        //     if (!this.actors.includes(cell)){
        //         this.add(cell);
        //     }
        //     this.actors.filter((a) => {
        //         let x = a.pos.x / 50 - 0.5;
        //         let y = a.pos.y / 50 - 0.5;
        //         this.deadCellMap.has(new ex.Vector(x, y));
        //     });
        // });    


        this.activeCellMap.forEach((cell) => {
            cell.kill()
        });

        this.activeCellMap = new Map(this.newActiveCellMap);

        this.newActiveCellMap.forEach( (cell) => {
            this.remove(cell)
        });
            
        this.newActiveCellMap.clear();
        this.clear(true);

        // remove all Actors
        this.entities.forEach( (e) => {
            this.remove(e)
        })


        for (let actor of this.actors) {
            actor.kill();
        }


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

        this.possibleCellMap = [];
        this.activeCellMap = new Map<string, Cell>();
        this.deadCellMap = new Map<string, Cell>();
        this.newActiveCellMap = new Map<string, Cell>();

        this.input.pointers.primary.on('down', (evt) => {
            const x = Math.floor(evt.worldPos.x / 50);
            const y = Math.floor(evt.worldPos.y / 50);
             this.directions.forEach((dir) => {
                 let cell = new Cell(new ex.Vector(x, y).add(dir), 1);
                 this.activeCellMap.set(new ex.Vector(x, y).add(dir).toString(), cell);
                 this.add(cell);
             });
            let cell = new Cell(new ex.Vector(x, y), 1);
            this.activeCellMap.set(new ex.Vector(x, y).toString(), cell);
            this.add(cell);
        });

        this.activeCellMap.forEach((cell) => {
            this.add(cell);
        });    

    }

};
