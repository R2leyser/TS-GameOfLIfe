// Excalibur is loaded into the ex global namespace
import * as ex from 'excalibur';
import { GameOfLife } from './gameOfLife';

const game = new ex.Engine({
    backgroundColor: ex.Color.fromHex("#18161D"),
    pixelArt: true,
    pixelRatio: 2,
    displayMode: ex.DisplayMode.FillScreen,
    maxFps: 15
})

let gameoflife = new GameOfLife();

game.addScene('gameoflife', gameoflife);

game.start().then(() => {
    game.goToScene( 'gameoflife' );
});
