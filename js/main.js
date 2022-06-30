'use strict'

const brickCalcContainer = document.getElementById('brickCalcContainer');
const resultErrors = document.getElementById('resultErrors');
const resultData = document.getElementById('resultData');

const endSides = 4; // use in bricks in line P pcs count: bricksInLineP = (P - brickDepth * endSides) / brickWidth
const k_Pinner = 8; // use in blocks in line Pin pcs count: blocksInLinePin = (P - brickDepth * k_Pinner) / blockWidth
let getErrorIs = false;

/* MORTARS */
const facadeMortarKgPer1M3 = 2564.1;
const baseBrickMortarKgPer1M3 = 1250;
const baseBlockMortarKgPer1M3 = 695;
const baseGlueKgPer1M3 = 1913.776;

let facadeMortarWeight = 0; // kg
let baseBrickMortarWeight = 0; // kg
let baseBlockMortarWeight = 0; // kg
let baseGlueWeight = 0; // kg


const input = {
    facadeIs : true,
    baseIs : true,
    radioBaseBrick : true,
    radioBaseBlockCeramic : false,
    radioBaseBlockSilicate : false,

    inputPerimeterSize : 36,
    inputHeightSize : 6,

    selectFacadeBrickSize : {
        width : 250,
        depth : 120,
        height : 65
    },
    inputFacadeBrickSeam : 10,

    inputGapSize : 50,

    selectBaseBrickSize : {
        width : 250,
        depth : 120,
        height : 65
    },
    selectBaseBrickWallSize : 1,
    inputBaseBrickSeam : 10,

    selectBaseBlockCeramicSize : {
        width : 250,
        depth : 380,
        height : 219
    },
    inputBaseBlockCeramicSeam : 15,

    selectBaseBlockSilicateSize : {
        width : 625,
        depth : 400,
        height : 250
    },
    inputBaseBlockSilicateSeam : 3,

    holeKeys : 1,
    holes : [],

    garretKeys : 1,
    garrets : [],

}

class Hole {
    constructor(width, height, pcs) {
        this.key = 'hole-' + input.holeKeys++;
        this.width = width;
        this.height = height;
        this.pcs = pcs;
    }
}

class Garret {
    constructor(h1, w1, h2, w2, pcs) {
        this.key = 'garret-' + input.garretKeys++;
        this.h1 = h1;
        this.h2 = h2;
        this.w1 = w1;
        this.w2 = w2;
        this.pcs = pcs;
    }
}

// ***

const visualImg = document.getElementById('visualImg');
const visualImagePath = '';

function getChangedValue(id) {
    let value = Number(id.value.replace(',', '.'));
    let min = Number(id.min);
    let max = Number(id.max);
    let stepSigns = (id.step.indexOf('.') === -1) ? 0 : id.step.length - (id.step.indexOf('.') + 1);
    let step = Number(id.step);
    
    if (value > max) value = max;
    else if (value < min) value = min;
    else value = step * Math.round(value / step);

    id.value = value.toFixed(stepSigns);
    return value;
}

// ***

function changeVisualImageBase(type) {
    if (type === 'f') changeVisualImageTo('house_wall_type_f.png');
    else {
        if (input.radioBaseBrick === true) changeVisualImageTo((type === 'f_') ? 'house_wall_type_f_k.png' : 'house_wall_type_k.png');
        else if (input.radioBaseBlockCeramic === true) changeVisualImageTo((type === 'f_') ? 'house_wall_type_f_b.png' : 'house_wall_type_b.png');
        else if (input.radioBaseBlockSilicate === true) changeVisualImageTo((type === 'f_') ? 'house_wall_type_f_p.png' : 'house_wall_type_p.png');
        else console.log('kan\'t show base image');
    }
}
function changeVisualImageBaseSize() {
    if (input.radioBaseBrick === true) changeVisualImageTo('house_wall_size_f_k.png');
    else if (input.radioBaseBlockCeramic === true) changeVisualImageTo('house_wall_size_f_b.png');
    else if (input.radioBaseBlockSilicate === true) changeVisualImageTo('house_wall_size_f_p.png');
    else console.log('kan\'t show base gap size image');
}
function changeVisualImageBaseType(type) {
    if (input.facadeIs === true) changeVisualImageTo('house_wall_type_f_' + type + '.png');
    else changeVisualImageTo('house_wall_type_' + type + '.png');
}
function changeVisualImageTo(img) {
    visualImg.src = visualImagePath + img;
    if (visualImg.style.opacity == 0) visualImg.style.opacity = 1;
}
function hideVisualImage() {
    visualImg.style.opacity = 0;
}

function inputNumberOnchange(id) {
    let value = getChangedValue(id);
    input[id.id] = value;

    recalculate();
}

function selectOnchange(id, value) {
    if (id === 'selectBaseBrickWallSize') input[id] = Number(value.replace(',', '.'));
    else {
        let data = value.split(' ');
        input[id].width = (id === 'selectBaseBlockCeramicSize') ? Number(data[1]) : Number(data[0]);
        input[id].depth = (id === 'selectBaseBlockCeramicSize') ? Number(data[0]) : Number(data[1]);
        input[id].height = Number(data[2])
    }

    recalculate();
}

// ***

const wallTypeButtonsDiv = document.getElementById('wallTypeButtonsDiv');
const wallTypeButtonsArr = Array.from(wallTypeButtonsDiv.querySelectorAll('button'));

const facadeDiv = document.getElementById('facadeDiv');
const baseDiv = document.getElementById('baseDiv');
const labelGapSize = document.querySelector('label[for="inputGapSize"]');

function changeWallType(type) {
    switch (type) {
        case 'facade' : wallTypeButtonsArr.forEach(button => button.className = ''); useWallTypeFacade(); break;
        case 'base' : wallTypeButtonsArr.forEach(button => button.className = ''); useWallTypeBase(); break;
        case 'all' : wallTypeButtonsArr.forEach(button => button.className = ''); useWallTypeAll(); break;
        default : console.log('unknown wall type');
    }

    recalculate();
}
function useWallTypeFacade() {
    wallTypeButtonsArr[0].className = 'selected';
    input.facadeIs = true;
    input.baseIs = false;
    facadeDiv.style.display = 'block';
    baseDiv.style.display = 'none';
}
function useWallTypeBase() {
    wallTypeButtonsArr[2].className = 'selected';
    input.facadeIs = false;
    input.baseIs = true;
    facadeDiv.style.display = 'none';
    baseDiv.style.display = 'block';
    labelGapSize.style.display = 'none';
}
function useWallTypeAll() {
    wallTypeButtonsArr[1].className = 'selected';
    input.facadeIs = true;
    input.baseIs = true;
    facadeDiv.style.display = 'block';
    baseDiv.style.display = 'block';
    labelGapSize.style.display = 'block';
}

// ***

const baseBrickDiv = document.getElementById('baseBrickDiv');
const baseBlockCeramicDiv = document.getElementById('baseBlockCeramicDiv');
const baseBlockSilicateDiv = document.getElementById('baseBlockSilicateDiv');

baseBlockCeramicDiv.style.display = 'none';
baseBlockSilicateDiv.style.display = 'none';

function radioBaseOnchange(id) {
    input.radioBaseBrick = false;
    input.radioBaseBlockCeramic = false;
    input.radioBaseBlockSilicate = false;
    input[id.id] = true;

    baseBrickDiv.style.display = 'none';
    baseBlockCeramicDiv.style.display = 'none';
    baseBlockSilicateDiv.style.display = 'none';

    if(id.id === 'radioBaseBrick') baseBrickDiv.style.display = 'block';
    if(id.id === 'radioBaseBlockCeramic') baseBlockCeramicDiv.style.display = 'block';
    if(id.id === 'radioBaseBlockSilicate') baseBlockSilicateDiv.style.display = 'block';

    recalculate();
}

// ***

const holesDataDiv = document.getElementById('holesDataDiv');
const addHoleButton = document.getElementById('addHoleButton');

const addGarretPopupShell = document.getElementById('addGarretPopupShell');
const garretsDataDiv = document.getElementById('garretsDataDiv');
const addGarretButton = document.getElementById('addGarretButton');

function addedInputOnchange(id, key, name, type) {
    let value = getChangedValue(id);
    let element = input[name].find(element => element.key === key);
    element[type] = value;
    
    recalculate();
}

function addHole() {
    let hole = document.createElement('div');
    hole.className = 'hole';
    hole.setAttribute('key', 'hole-' + input.holeKeys);
    hole.innerHTML = `<label>Размеры:</label>
        <nobr><input type="number" class="hole-w" value="1.200" min="0.010" step="0.001" max="20.000" onchange="addedInputOnchange(this, 'hole-${input.holeKeys}', 'holes', 'width')"> x
        <input type="number" class="hole-h" value="1.600" min="0.010" step="0.001" max="20.000" onchange="addedInputOnchange(this, 'hole-${input.holeKeys}', 'holes', 'height')"> м; </nobr>
        <label>количество: <input type="number" class="hole-pcs" value="1" min="1" step="1" max="999" onchange="addedInputOnchange(this, 'hole-${input.holeKeys}', 'holes', 'pcs')"> шт. </label>
        <button class="delete-div" onclick="deleteHole(this, 'hole-${input.holeKeys}')">Удалить</button>`;
    
    holesDataDiv.insertBefore(hole, addHoleButton);

    input.holes.push(new Hole(1.2, 1.6, 1));

    recalculate();
}
addHole();
function deleteHole(id, key) {
    id.parentNode.remove();
    input.holes = input.holes.filter(hole => hole.key !== key);

    recalculate();
}

function showGarretPopupSell() {
    addGarretPopupShell.style.display = 'flex';
    setTimeout(changeVisualImageTo, 300, 'house_r.png');
}
function hideGarretPopupSell() {
    addGarretPopupShell.style.display = 'none';
    hideVisualImage();
}
function addGarretType(type) {
    let garret = document.createElement('div');
    garret.className = 'garret';
    garret.setAttribute('key', 'garret-' + input.garretKeys);

    let garretImageDiv = document.createElement('div');
    garretImageDiv.innerHTML = `<img src="garret_type_${type}.png" alt="Тип мансарды">`;
    let garretInputsDiv = document.createElement('div');
    garretInputsDiv.className = 'garret-inputs';

    garretInputsDiv.innerHTML = `<label>h${(type == 3)?'<sub>1</sub>':''} = 
        <input type="number" class="garret-h" value="1.200" min="0.010" step="0.001" max="20.000" onchange="addedInputOnchange(this, 'garret-${input.garretKeys}', 'garrets', 'h1')"> м; 
        </label>
        <label>L${(type == 3)?'<sub>1</sub>':''} =
        <input type="number" class="garret-w" value="0.800" min="0.010" step="0.001" max="50.000" onchange="addedInputOnchange(this, 'garret-${input.garretKeys}', 'garrets', 'w1')"> м; 
        </label>`;
    if (type == 3) {
        garretInputsDiv.innerHTML += `<label>h<sub>2</sub> = 
            <input type="number" class="garret-h" value="1.800" min="0.010" step="0.001" max="20.000" onchange="addedInputOnchange(this, 'garret-${input.garretKeys}', 'garrets', 'h2')"> м; 
            </label>
            <label>L<sub>2</sub> = 
            <input type="number" class="garret-w" value="1.600" min="0.010" step="0.001" max="50.000" onchange="addedInputOnchange(this, 'garret-${input.garretKeys}', 'garrets', 'w2')"> м; 
            </label>`;
    }
    garretInputsDiv.innerHTML += `<label>количество:
        <input type="number" class="hole-pcs" value="2" min="1" step="1" max="999" onchange="addedInputOnchange(this, 'garret-${input.garretKeys}', 'garrets', 'pcs')"> шт. 
        </label>
        <button class="delete-div" onclick="deleteGarret(this, 'garret-${input.garretKeys}')">Удалить</button>`;
    garret.append(garretImageDiv, garretInputsDiv);
    garretsDataDiv.insertBefore(garret, addGarretButton);

    let h2 = (type == 3) ? 1.8 : 0;
    let w2 = (type == 3) ? 1.6 : 0;
    input.garrets.push(new Garret(1.2, 0.8, h2, w2, 2));

    recalculate();
}
function deleteGarret(id, key) {
    id.parentNode.parentNode.remove();
    input.garrets = input.garrets.filter(garret => garret.key !== key);

    recalculate();
}

// *** COUNT *** //

function recalculate() {
    console.log(input);
    console.log('---');

    /* // use origin object props
    let [facadeIs, baseIs, radioBaseBrick, radioBaseBlockCeramic, radioBaseBlockSilicate,
        inputPerimeterSize, inputHeightSize,
        selectFacadeBrickSize,inputFacadeBrickSeam,
        inputGapSize,
        selectBaseBrickSize, selectBaseBrickWallSize, inputBaseBrickSeam,
        selectBaseBlockCeramicSize, inputBaseBlockCeramicSeam,
        selectBaseBlockSilicateSize, inputBaseBlockSilicateSeam,
        holeKeys, holes, garretKeys, garrets] = input;
    */
    resultErrors.innerHTML = '';
    resultData.innerHTML = '';
    getErrorIs = false;

    facadeMortarWeight = 0; // kg
    baseBrickMortarWeight = 0; // kg
    baseBlockMortarWeight = 0; // kg
    baseGlueWeight = 0; // kg
    
    // {width, depth, height}

    /* test squares */
    
    let mainSquare = input.inputPerimeterSize * input.inputHeightSize; // m
    let garretsSquare = 0; // m
    input.garrets.forEach(garret => {
        let s = 0.5 * garret.w1 * garret.h1;
        if(garret.h2 && garret.w2) {

            /* test garrets h2 > h1 */
            if (garret.h2 < garret.h1) {
                alert('У четырехскатной мансарды высота h1 не может быть больше чем высота h2!');
                resultErrors.innerHTML += 'У четырехскатной мансарды высота h1 не может быть больше чем высота h2!<br>';
                getErrorIs = true;
                /*
                let idDiv = document.querySelector('div[key="' + garret.key + '"]');
                let id = idDiv.querySelector("button");
                deleteGarret(id, garret.key);
                getErrorIs = true;
                */
            }

            s += garret.w2 * garret.h1;
            s += 0.5 * garret.w2 * (garret.h2 - garret.h1);
        }
        garretsSquare += s * garret.pcs;
    });

    if (getErrorIs === true) return;

    let holesSquare = 0; // m
    input.holes.forEach(hole => {
        holesSquare += (hole.width * hole.height) * hole.pcs;
    });

    if ((mainSquare + garretsSquare) <= holesSquare) {
        alert('Площадь проемов равна или превышает общую площадь строения!');
        resultErrors.innerHTML += 'Площадь проемов равна или превышает общую площадь строения!<br>';
        resultData.innerHTML = '';
        return;
    }

    console.group('squares');
    console.log('mainSquare =', mainSquare);
    console.log('garretsSquare =', garretsSquare);
    console.log('holesSquare =', holesSquare);
    console.groupEnd();

    let facadeBrickNumbers = (input.facadeIs === true) ? countFacadeBrickNumbers(garretsSquare, holesSquare) : 0;
    let baseElementNumbers = (input.baseIs === true) ? countBaseElementNumbers(garretsSquare, holesSquare) : 0;
    if (getErrorIs === true) return;
    let gapVolume = (input.baseIs === true && input.facadeIs === true && input.inputGapSize > 0) ? countGapVolume(garretsSquare, holesSquare) : 0;

    console.group('Element Numbers');
    console.log('facadeBrickNumbers =', facadeBrickNumbers);
    console.log('baseElementNumbers =', baseElementNumbers);
    console.log('gapVolume =', gapVolume); // m3
    console.groupEnd();

    console.group('Mortars weight');
    console.log('facadeMortarWeight =', facadeMortarWeight);
    console.log('baseBrickMortarWeight =', baseBrickMortarWeight);
    console.log('baseBlockMortarWeight =', baseBlockMortarWeight);
    console.log('baseGlueWeight =', baseGlueWeight); // m3
    console.groupEnd();

    /* update result */
    resultData.innerHTML += `<b>Вам потребуется:</b><br>`;
    if (input.facadeIs === true) {
        resultData.innerHTML +=
        `<br>Фасадный кирпич ${input.selectFacadeBrickSize.width}x${input.selectFacadeBrickSize.depth}x${input.selectFacadeBrickSize.height} : <b>${facadeBrickNumbers} шт.</b><br>
        <b>${facadeMortarWeight} кг</b> цветной кладочной смеси для фасадного кирпича.<br>`;

    }
    if (input.baseIs === true) {
        if (input.radioBaseBrick === true) {
            resultData.innerHTML +=
            `<br>Рядовой кирпич ${input.selectBaseBrickSize.width}x${input.selectBaseBrickSize.depth}x${input.selectBaseBrickSize.height} : <b>${baseElementNumbers} шт.</b><br>
            <b>${baseBrickMortarWeight} кг</b> теплоизоляционной кладочной смеси.<br>`;
        }
        if (input.radioBaseBlockCeramic === true) {
            resultData.innerHTML +=
            `<br>Керамический блок ${input.selectBaseBlockCeramicSize.width}x${input.selectBaseBlockCeramicSize.depth}x${input.selectBaseBlockCeramicSize.height} : <b>${baseElementNumbers} шт.</b><br>
            <b>${baseBlockMortarWeight} кг</b> теплоизоляционной кладочной смеси.<br>`;
        }
        if (input.radioBaseBlockSilicate === true) {
            resultData.innerHTML +=
            `<br>Газосиликатный блок ${input.selectBaseBlockSilicateSize.width}x${input.selectBaseBlockSilicateSize.depth}x${input.selectBaseBlockSilicateSize.height} : <b>${baseElementNumbers} шт.</b><br>
            <b>${baseGlueWeight} кг</b> клея для газосиликатных блоков.<br>`;
        }
    }
    if (input.facadeIs === true && input.baseIs === true) resultData.innerHTML += `<br>Объем теплового зазора: <b>${(gapVolume > 0) ? gapVolume.toFixed(3) : 0} м<sup>3</sup><b>.<br>`;
}

function countFacadeBrickNumbers(garretsSquare, holesSquare) {
    /***  --endSides-- const endSides = 4; // use in bricks in line P pcs count: bricksInLineP = (P - brickDepth * endSides) / brickWidth ***/
    let bricksInLineP = (input.inputPerimeterSize * 1000 - input.selectFacadeBrickSize.depth * endSides) / (input.selectFacadeBrickSize.width + input.inputFacadeBrickSeam);
    console.log('bricksInLineP =', bricksInLineP);
    let bricksLinesInHeight = (input.inputHeightSize * 1000) / (input.selectFacadeBrickSize.height + input.inputFacadeBrickSeam);
    console.log('bricksLinesInHeight =', bricksLinesInHeight);
    let brickWithSeamSquare = (input.selectFacadeBrickSize.width + input.inputFacadeBrickSeam) * (input.selectFacadeBrickSize.height + input.inputFacadeBrickSeam);
    let bricksInGarrets = garretsSquare * (1000**2 /* m2 -> mm2 */) / brickWithSeamSquare;
    console.log('bricksInGarrets =', bricksInGarrets);
    let bricksInHoles = holesSquare * (1000**2 /* m2 -> mm2 */) / brickWithSeamSquare;
    console.log('bricksInHoles =', bricksInHoles);
    
    let facadeBrickNumbers = Math.round(bricksInLineP * bricksLinesInHeight + bricksInGarrets) - Math.floor(bricksInHoles);

    if(facadeBrickNumbers < 0) {
        alert('Площадь проемов превышает внутренюю площадь строения!');
        resultErrors.innerHTML += 'Площадь проемов превышает внутренюю площадь строения!<br>';
        resultData.innerHTML = '';
        getErrorIs = true;
        return 0;
    }

    /* MORTARS */
    let brickSizeMeter = {
        width : input.selectFacadeBrickSize.width / 1000,
        depth : input.selectFacadeBrickSize.depth / 1000,
        height : input.selectFacadeBrickSize.height / 1000,
        seam : input.inputFacadeBrickSeam / 1000
    }; console.log('--brickSizeMeter',brickSizeMeter);
    let facadeMortarVolumePerBrick = (brickSizeMeter.width + brickSizeMeter.seam + brickSizeMeter.height) * brickSizeMeter.depth * brickSizeMeter.seam;
    console.log('facadeMortarVolumePerBrick =', facadeMortarVolumePerBrick);
    facadeMortarWeight = Math.ceil(facadeBrickNumbers * facadeMortarVolumePerBrick * facadeMortarKgPer1M3);

    return facadeBrickNumbers;
}

function countBaseElementNumbers(garretsSquare, holesSquare) {

    /***  --k_Pinner-- const k_Pinner = 8; // use in blocks in line Pin pcs count: blocksInLinePin = (P - brickDepth * k_Pinner) / blockWidth ***/
    let innerP = (input.facadeIs === true) ?
        (input.inputPerimeterSize * 1000) - (input.selectFacadeBrickSize.depth + input.inputGapSize) * k_Pinner :
        input.inputPerimeterSize * 1000;
    console.log('innerP =', innerP);

    let baseLayers = (input.radioBaseBrick === true) ? Math.round(input.selectBaseBrickWallSize * 2) : 1;

    /* if depth layer + 1 -> bricks in next depth perimeter  - 4 pcs */
    let elementsInLineP;
    let baseInnerBricks = 0; // if used bricks -> count inner to calculate mortar
    if (input.radioBaseBrick === true) {
        let brickBaseLayers = baseLayers;
        console.log('brickBaseLayers =', brickBaseLayers);
        brickBaseLayers--;
        let baseBrickDepth = input.selectBaseBrickSize.depth + (Number(!!brickBaseLayers) * input.inputBaseBrickSeam);
        console.log('baseBrickDepth =', baseBrickDepth);
        elementsInLineP = (innerP - baseBrickDepth * endSides) / (input.selectBaseBrickSize.width + input.inputBaseBrickSeam);
        console.log('elementsInLineP (inner) =', elementsInLineP);
        let stepElementsNumber = elementsInLineP - 4;
        while (brickBaseLayers > 0 && stepElementsNumber > 0) {
            console.log('elementsInLineP (inner) add +', stepElementsNumber);
            elementsInLineP += stepElementsNumber;
            baseInnerBricks += stepElementsNumber;
            stepElementsNumber -= 4;
            brickBaseLayers--;
        }
    } else {
        let elementBaseWidth = (input.radioBaseBlockCeramic === true) ? input.selectBaseBlockCeramicSize.width :
            input.selectBaseBlockSilicateSize.width + input.inputBaseBlockSilicateSeam;
        let elementBaseDepth = (input.radioBaseBlockCeramic === true) ? input.selectBaseBlockCeramicSize.depth :
            input.selectBaseBlockSilicateSize.depth;

        elementsInLineP = (innerP - elementBaseDepth * endSides) / elementBaseWidth;
    }

    console.log('elementsInLineP (inner) finally =', elementsInLineP);
    
    let elementHeight;
    if (input.radioBaseBrick === true) elementHeight = input.selectBaseBrickSize.height + input.inputBaseBrickSeam;
    else if (input.radioBaseBlockCeramic === true) elementHeight = input.selectBaseBlockCeramicSize.height + input.inputBaseBlockCeramicSeam;
    else if (input.radioBaseBlockSilicate === true) elementHeight = input.selectBaseBlockSilicateSize.height + input.inputBaseBlockSilicateSeam;
    else {
        console.log('unknown inner wall type');
        return 0;
    }
    let elementsLinesInHeight = (input.inputHeightSize * 1000) / elementHeight;
    console.log('elementsLinesInHeight =', elementsLinesInHeight);

    let elementWithSeamSquare;
    if (input.radioBaseBrick === true) {
        elementWithSeamSquare = (input.selectBaseBrickSize.width + input.inputBaseBrickSeam) * (input.selectBaseBrickSize.height + input.inputBaseBrickSeam);
    } else if (input.radioBaseBlockCeramic === true) {
        elementWithSeamSquare = input.selectBaseBlockCeramicSize.width * (input.selectBaseBlockCeramicSize.height + input.inputBaseBlockCeramicSeam);
    } else if (input.radioBaseBlockSilicate === true) {
        elementWithSeamSquare = (input.selectBaseBlockSilicateSize.width + input.inputBaseBlockSilicateSeam) * (input.selectBaseBlockSilicateSize.height + input.inputBaseBlockSilicateSeam);
    } else {
        console.log('unknown inner wall type');
        return 0;
    }

    let elementsInGarrets = garretsSquare * (1000**2 /* m2 -> mm2 */) / elementWithSeamSquare;
    if (baseLayers > 1) elementsInGarrets = elementsInGarrets * baseLayers;
    console.log('elementsInGarrets =', elementsInGarrets);
    let elementsInHoles = holesSquare * (1000**2 /* m2 -> mm2 */) / elementWithSeamSquare;
    if (baseLayers > 1) elementsInHoles = elementsInHoles * baseLayers;
    console.log('elementsInHoles =', elementsInHoles);
    let baseElementNumbers = Math.round(elementsInLineP * elementsLinesInHeight + elementsInGarrets) - Math.floor(elementsInHoles);

    /*
    if(baseElementNumbers < 0) {
        alert('Площадь проемов превышает внутренюю площадь строения!');
        resultErrors.innerHTML += 'Площадь проемов превышает внутренюю площадь строения!<br>';
        resultData.innerHTML = '';
        getErrorIs = true;
        return 0;
    }
    */
    if (baseElementNumbers < 0) {
        if (input.facadeIs === true) baseElementNumbers = 0;
        else {
            alert('Площадь проемов превышает площадь строения!');
            resultErrors.innerHTML += 'Площадь проемов превышает площадь строения!<br>';
            resultData.innerHTML = '';
            getErrorIs = true;
            return 0;
        }
    }

    /* MORTARS */
    if (input.radioBaseBrick === true) {
        let baseBrickSizeMeter = {
            width : input.selectBaseBrickSize.width / 1000,
            depth : input.selectBaseBrickSize.depth / 1000,
            height : input.selectBaseBrickSize.height / 1000,
            seam : input.inputBaseBrickSeam / 1000
        }; console.log('--|--baseBrickSizeMeter', baseBrickSizeMeter);
        let baseMortarVolumePerBrick = (baseBrickSizeMeter.width + baseBrickSizeMeter.seam + baseBrickSizeMeter.height) * baseBrickSizeMeter.depth * baseBrickSizeMeter.seam;
        console.log('baseMortarVolumePerBrick =', baseMortarVolumePerBrick);
        let baseMortarVolumePerInnerBrick = (baseInnerBricks === 0) ? 0 : (baseBrickSizeMeter.width + baseBrickSizeMeter.seam) * (baseBrickSizeMeter.height + baseBrickSizeMeter.seam) * baseBrickSizeMeter.seam;
        console.log('baseMortarVolumePerInnerBrick =', baseMortarVolumePerInnerBrick);
        baseBrickMortarWeight = Math.ceil((baseElementNumbers * baseMortarVolumePerBrick + baseInnerBricks * baseMortarVolumePerInnerBrick) * baseBrickMortarKgPer1M3);
    } else if (input.radioBaseBlockCeramic === true) {
        let baseBlockCeramicSizeMeter = {
            width : input.selectBaseBlockCeramicSize.width / 1000,
            depth : input.selectBaseBlockCeramicSize.depth / 1000,
            seam : input.inputBaseBlockCeramicSeam / 1000
        }; console.log('--||-baseBlockCeramicSizeMeter', baseBlockCeramicSizeMeter);
        let baseMortarVolumePerBlockCeramic = baseBlockCeramicSizeMeter.width * baseBlockCeramicSizeMeter.depth * baseBlockCeramicSizeMeter.seam;
        console.log('baseMortarVolumePerBlockCeramic =', baseMortarVolumePerBlockCeramic);
        baseBlockMortarWeight = Math.round(baseElementNumbers * baseMortarVolumePerBlockCeramic * baseBlockMortarKgPer1M3);
    } else if (input.radioBaseBlockSilicate === true) {
        let baseBlockSilicateSizeMeter = {
            width : input.selectBaseBlockSilicateSize.width / 1000,
            depth : input.selectBaseBlockSilicateSize.depth / 1000,
            height : input.selectBaseBlockSilicateSize.height / 1000,
            seam : input.inputBaseBlockSilicateSeam / 1000
        }; console.log('--|||baseBlockSilicateSizeMeter', baseBlockSilicateSizeMeter);
        let baseMortarVolumePerBlockSilicate = (baseBlockSilicateSizeMeter.width + baseBlockSilicateSizeMeter.seam + baseBlockSilicateSizeMeter.height)
            * baseBlockSilicateSizeMeter.depth * input.selectBaseBrickSize.depth;
        console.log('baseMortarVolumePerBlockSilicate =', baseMortarVolumePerBlockSilicate);
        baseGlueWeight = Math.round(baseElementNumbers * baseMortarVolumePerBlockSilicate * baseGlueKgPer1M3);
    } else {
        console.log('unknown inner wall type');
        return 0;
    }

    return baseElementNumbers;
}

function countGapVolume(garretsSquare, holesSquare) {
    let gapP = (input.inputPerimeterSize) - (input.selectFacadeBrickSize.depth / 1000) * k_Pinner;
    let gapSizeInMeters = input.inputGapSize  / 1000;
    let gapS = gapP * gapSizeInMeters - gapSizeInMeters * gapSizeInMeters * 4;
    let gapVolume = gapS * input.inputHeightSize;
    let garretsVolume = garretsSquare * (input.inputGapSize  / 1000);
    let holesVolume = holesSquare * (input.inputGapSize  / 1000);
    return gapVolume + garretsVolume - holesVolume;
}