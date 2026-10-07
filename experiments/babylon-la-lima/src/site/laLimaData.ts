/** Experimental Babylon mirror of production src/bim/site/laLimaSiteContext.ts. */
export type Vec3 = [number, number, number];
export type BoxTransform = { position: Vec3; scale: Vec3 };
export type MaterialKey =
  | 'terrain' | 'grass' | 'roadAsphalt' | 'roadMarking'
  | 'industrialMetal' | 'roofProfile' | 'industrialConcrete' | 'darkMetal'
  | 'corporateConcrete' | 'corporateFacade' | 'parkingAsphalt' | 'parkingMarking';
export type SiteBatch = {
  name: string;
  material: MaterialKey;
  transforms: BoxTransform[];
  shadowCaster?: boolean;
  pickable?: boolean;
};

const box = (position: Vec3, scale: Vec3): BoxTransform => ({ position, scale });
const warehouseCenters: Array<[number, number]> = [
  [-350, 55], [-150, 55], [50, 55], [-350, 240], [-150, 240], [50, 240],
];
const corporateBuildings: BoxTransform[] = [
  box([255, 16, -305], [44, 32, 44]),
  box([335, 22, -305], [54, 44, 44]),
  box([425, 18, -305], [48, 36, 44]),
  box([285, 15, -185], [58, 30, 42]),
  box([405, 20, -185], [66, 40, 42]),
];
const roadMarkings: BoxTransform[] = [];
for (const x of [170, 192]) for (let z = -350; z <= 350; z += 30) roadMarkings.push(box([x, .73, z], [.7, .08, 12]));
for (const z of [-95, 145, 335]) for (let x = -430; x <= 430; x += 45) roadMarkings.push(box([x, .73, z], [18, .08, .7]));
const parkingLines: BoxTransform[] = [];
for (const z of [-365, -245]) for (let x = 235; x <= 465; x += 12) parkingLines.push(box([x, .94, z], [.35, .08, 12]));
for (let x = -40; x <= 120; x += 10) parkingLines.push(box([x, .94, -78], [.3, .08, 10]));

export const LA_LIMA_SITE = {
  width: 1000,
  depth: 790,
  corporateDistrictAreaHectares: 7.98,
  logicalObjects: 297,
  expectedDrawCalls: 21,
  triangles: 3564,
  batches: [
    { name: 'SiteBase', material: 'terrain', transforms: [box([0, -1, 0], [1000, 2, 790])] },
    { name: 'GreenBuffers', material: 'grass', transforms: [
      box([0, .25, -385], [1000, .5, 20]), box([0, .25, 385], [1000, .5, 20]),
      box([-490, .25, 0], [20, .5, 750]), box([490, .25, 0], [20, .5, 750]),
      box([181, .35, 0], [6, .7, 750]), box([207, .35, -247.5], [8, .7, 285]),
    ] },
    { name: 'RoadSurfaces', material: 'roadAsphalt', transforms: [
      box([170, .45, 0], [14, .5, 750]), box([192, .45, 0], [14, .5, 750]),
      box([0, .45, -95], [960, .5, 18]), box([0, .45, 145], [960, .5, 18]),
      box([0, .45, 335], [960, .5, 18]), box([-455, .45, 0], [18, .5, 730]),
      box([-185, .45, -175], [540, .5, 18]), box([145, .45, 215], [18, .5, 240]),
    ] },
    { name: 'RoadMarkings', material: 'roadMarking', transforms: roadMarkings },
    { name: 'IndustrialWarehouses', material: 'industrialMetal', shadowCaster: true, pickable: true,
      transforms: warehouseCenters.map(([x, z]) => box([x, 9, z], [160, 18, 82])) },
    { name: 'IndustrialWarehouseRoofs', material: 'roofProfile', shadowCaster: true,
      transforms: warehouseCenters.map(([x, z]) => box([x, 18.4, z], [164, 1.2, 86])) },
    { name: 'LoadingDocks', material: 'industrialConcrete', transforms: warehouseCenters.flatMap(([x, z]) => [
      box([x - 42, 1.2, z - 47], [34, 2.4, 10]), box([x + 42, 1.2, z - 47], [34, 2.4, 10]),
    ]) },
    { name: 'IndustrialDockDoors', material: 'darkMetal', transforms: warehouseCenters.flatMap(([x, z]) =>
      [-48, 0, 48].map(offset => box([x + offset, 5.5, z - 41.6], [24, 9, .8]))) },
    { name: 'IndustrialSkylights', material: 'corporateFacade', transforms: warehouseCenters.flatMap(([x, z]) =>
      [-45, 0, 45].map(offset => box([x + offset, 19.15, z], [24, .3, 12]))) },
    { name: 'MultitenantBuilding', material: 'industrialMetal', shadowCaster: true, pickable: true,
      transforms: [box([40, 12, -35], [180, 24, 72])] },
    { name: 'MultitenantRoof', material: 'roofProfile', shadowCaster: true,
      transforms: [box([40, 24.6, -35], [184, 1.2, 76])] },
    { name: 'LogisticsYards', material: 'industrialConcrete', transforms: [
      box([-340, .6, -255], [190, 1.2, 120]), box([-105, .6, -255], [190, 1.2, 120]),
    ] },
    { name: 'LogisticsDockDoors', material: 'darkMetal', transforms: [-340, -105].flatMap(x =>
      [-60, -20, 20, 60].map(offset => box([x + offset, 3, -194.5], [24, 6, 1]))) },
    { name: 'CorporateDistrictPad', material: 'grass', transforms: [box([350, .2, -247.5], [280, .4, 285])] },
    { name: 'CorporateBuildings', material: 'corporateConcrete', shadowCaster: true, pickable: true,
      transforms: corporateBuildings },
    { name: 'CorporateRoofs', material: 'roofProfile', shadowCaster: true, transforms: corporateBuildings.map(({position, scale}) =>
      box([position[0], position[1] * 2 + .6, position[2]], [scale[0] + 3, 1.2, scale[2] + 3])) },
    { name: 'CorporateGlassBands', material: 'corporateFacade', transforms: corporateBuildings.flatMap(({position: [x,y,z], scale:[width,,depth]}) => [
      box([x, y * .75, z + depth / 2 + .45], [width * .72, 4, .8]),
      box([x, y * 1.25, z + depth / 2 + .45], [width * .72, 4, .8]),
      box([x + width / 2 + .45, y * .75, z], [.8, 4, depth * .72]),
      box([x + width / 2 + .45, y * 1.25, z], [.8, 4, depth * .72]),
    ]) },
    { name: 'CorporateEntrances', material: 'corporateFacade', transforms: corporateBuildings.map(({position:[x,,z], scale:[,,depth]}) =>
      box([x, 2.5, z + depth / 2 + 2], [12, 5, 4])) },
    { name: 'ParkingPads', material: 'parkingAsphalt', transforms: [
      box([350, .55, -365], [250, .7, 30]), box([350, .55, -245], [250, .7, 30]), box([40, .55, -78], [180, .7, 24]),
    ] },
    { name: 'ParkingLines', material: 'parkingMarking', transforms: parkingLines },
    { name: 'ParkingMedians', material: 'industrialConcrete', transforms: [-365, -245].flatMap(z =>
      [235, 350, 465].map(x => box([x, 1.1, z], [7, 1.4, 24]))) },
  ] satisfies SiteBatch[],
};

export const SITE_DETAIL_BATCHES: SiteBatch[] = [
  { name: 'DetailStreetLights', material: 'darkMetal', transforms: [-330,-130,70,270,470].flatMap(x =>
    [-85,135,325].map(z => box([x, 4.5, z], [.45, 9, .45]))) },
  { name: 'DetailRoadSigns', material: 'roadMarking', transforms: [box([155, 2.4, -55], [3.5, 2.4, .25]), box([207, 2.4, 105], [3.5, 2.4, .25])] },
  { name: 'DetailVehicles', material: 'corporateFacade', transforms: [
    box([-355, 1.2, -265], [8, 2.4, 3]), box([-120, 1.2, -245], [12, 2.8, 3.2]),
    box([310, 1.0, -365], [4.5, 2, 2.2]), box([390, 1.0, -245], [4.5, 2, 2.2]),
  ] },
];
