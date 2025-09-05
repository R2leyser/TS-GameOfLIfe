// Excalibur is loaded into the ex global namespace
import * as ex from 'excalibur';
import { GameOfLife } from './gameOfLife';

const game = new ex.Engine({
    width: 100,
    height: 100,
    backgroundColor: ex.Color.fromHex("#1E1D25"),
    pixelArt: true,
    pixelRatio: 2,
    displayMode: ex.DisplayMode.FillScreen,
    maxFps: 144
});

let gameoflife = new GameOfLife();

game.addScene('gameoflife', gameoflife);


game.start().then(() => {
    game.goToScene( 'gameoflife' );
});
