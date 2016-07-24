'use strict';
/*global angular, THREE, $
 */

/**
 * Plot controller
 */
function PlotCtrl($http, CONFIG, plotModelsResource, $timeout, $scope) {
  let vm = this;

  $timeout(function() {
    //$('#covizTabOptions').removeClass('initiallyHidden'); // show title tab options - plot and tutorial
  });

  $scope.CompletedEvent = function() {
    //console.log("Completed Event called");
  };

  $scope.ExitEvent = function() {
    //console.log("Exit Event called");
  };

  $scope.ChangeEvent = function(targetElement) {
    //console.log("Change Event called");
    //console.log(this._currentStep);
  };

  $scope.BeforeChangeEvent = function(targetElement) {
    //console.log("Before Change Event called");
    //console.log(targetElement);
  };

  $scope.AfterChangeEvent = function(targetElement) {
    ///console.log("After Change Event called");
    //console.log(targetElement);
  };

  vm.IntroOptions = {
    steps: [{
      element: document.querySelector('.step1'),
      intro: "Click this button to import your data.",
      position: 'top'
    }, {
      element: '.step2',
      intro: "Once you have loaded your data it will be visually represented here on the plot area.",
      position: 'left'
    }, {
      element: '.step3',
      intro: 'Uploaded data can be viewed and altered here, any changes will automatically be visible in the plot area ',
      position: 'right'
    }, {
      element: '.step4',
      intro: 'Filter your data by selecting a covariate to view.',
      position: 'right'
    }, {
      element: '.step5',
      intro: 'Download a PNG of the plot area for external use.',
      position: 'top'
    }, {
      element: '.step6',
      intro: 'Download an XLSX template to input results which can then be uploaded',
      position: 'top'
    }, {
      element: '.step7',
      intro: 'Reset or clear the uploaded results.',
      position: 'right'
    }],
    showStepNumbers: false,
    showBullets: false,
    exitOnOverlayClick: true,
    exitOnEsc: true,
    nextLabel: '<i class="fa fa-forward" aria-hidden="true"></i> Next',
    prevLabel: '<i class="fa fa-backward" aria-hidden="true"></i> Previous',
    skipLabel: '<i class="fa fa-stop" aria-hidden="true"></i> Stop Tour',
    doneLabel: '<i class="fa fa-check" aria-hidden="true"></i> Done'
  };

  vm.container = null;
  vm.mesh = null;
  vm.scene = null;
  vm.camera = null;
  vm.renderer = null;
  vm.controls = null;
  vm.scene = null;
  vm.objects = [];
  vm.plane = null;
  vm.raycaster = new THREE.Raycaster();
  vm.mouse = new THREE.Vector2();
  vm.offset = new THREE.Vector3();
  vm.INTERSECTED = null;
  vm.SELECTED = null;
  vm.meshObjects = [];
  //vm.$modelTreatments = [];
  vm.studies = [];
  vm.studyLine = null;
  vm.covariates = [];
  vm.studyLinks = []; // this is a n object holding each study link and its associated covariates
  vm.covariatesDistinctList = []; // this is a list of disctiv covariate names used for selection purposes
  vm.segmentSize = 0;
  vm.$segmentTotal = 0;
  vm.treatmentsCount = 0;
  vm.studiesCount = 0;
  vm.covariatesCount = 0;
  vm.links = [];
  vm.covariateSelection = "days";
  vm.totalRebuild = false;
  vm.initOpen = true;
  vm.selectedCovariate = 'Covariate Selection';
  vm.currentExcelFilename = '';
  vm.newPDFFileName = '';
  vm.saveRawDataFileName = '';
  vm.showCovariateLabels = true;

  vm.regexNumeric = '^[0-9.,]+$';
  vm.formErrors = false;
  vm.showGrid = true;
  vm.useWireframe = false;
  vm.jsonDataTemplate = [];
  vm.loadedData = false;
  vm.savedJson = [];
  vm.useConfigOptions = false;
  vm.currentCameraXYZ = [];
  vm.currentTargetXYZ = [];
  vm.changeBeenMade = false;
  vm.resettingData = false;
  vm.originalModelData = []

  vm.exampleModelData = [{
    "config": [{},
      {
        "data": [{
          "treatments": [{
            "name": "Treatment example 1",
            "treatment_index": 1,
            "basenode": true,
            "distanceFromBaseNode": 299,
            "pos": [0, 0, 0],
            "weighting": 3,
            "color": "red",
            "showTreatment": true
          }, {
            "name": "Treatment example 2",
            "treatment_index": 2,
            "basenode": false,
            "distanceFromBaseNode": 298,
            "pos": [0, 0, 0],
            "weighting": 1,
            "color": "red",
            "showTreatment": true
          }],
          "studies": [{
            "index": 1,
            "sourceIndex": 1,
            "targetIndex": 2,
            "weighting": 1,
            "studyName": "Study example 1",
            "color": "grey",
            "offset": 0,
            "spacing": 1
          }, {
            "index": 2,
            "sourceIndex": 1,
            "targetIndex": 2,
            "weighting": 1,
            "studyName": "Study example 2",
            "color": "grey",
            "offset": 0,
            "spacing": 1
          }, {
            "index": 3,
            "sourceIndex": 1,
            "targetIndex": 2,
            "weighting": 1,
            "studyName": "Study example 3",
            "color": "grey",
            "offset": 0,
            "spacing": 1
          }],
          "covariates": [{
            "index": 1,
            "studyIndex": 1,
            "name": "age",
            "covariate": 25,
            "unit": "yrs",
            "color": "red"
          }, {
            "index": 2,
            "studyIndex": 1,
            "name": "weight",
            "covariate": 110,
            "unit": "lbs",
            "color": "red"
          }, {
            "index": 3,
            "studyIndex": 2,
            "name": "age",
            "covariate": 50,
            "unit": "yrs",
            "color": "red"
          }, {
            "index": 4,
            "studyIndex": 3,
            "name": "weight",
            "covariate": 70,
            "unit": "lbs",
            "color": "red"
          }]
        }]
      }
    ]
  }];

  vm.modelData = angular.copy(vm.exampleModelData[0].config[1].data);
  vm.originalModelData = angular.copy(vm.exampleModelData); // for reset purposes

  vm.covariateValueChange = function(covariateObj) {
    if (!covariateObj.colorChanged) {
      covariateObj.color = covariateObj.covariate > 0 ? 'green' : 'red';
    }

    covariateObj.valueChanged = true;

    applyChanges();
  };

  vm.covariateColorChange = function(covariateObj) {
    covariateObj.colorChanged = true;
    applyChanges();
  };

  vm.spacingSliderOptions = function() {
    let jsonObj = {
      options: {
        floor: 0,
        ceil: 1,
        step: 0.1,
        hideLimitLabels: true,
        showSelectionBar: true,
        showTicks: true,
        precision: 1,
        onStart: function() {
          vm.useWireframe = false;
          applyChanges();
        },
        onEnd: function() {
          vm.useWireframe = false;
          applyChanges();
        },
        onChange: function() {
          applyChanges();
        },
        translate: function(value) {
          if (value === 0) {
            return 'Default';
          }
          return '';
        }
      }
    };

    return jsonObj;
  };

  vm.offSetSliderOptions = function() {
    let jsonObj = {
      options: {
        floor: -1,
        ceil: 1,
        step: 0.1,
        hideLimitLabels: true,
        showSelectionBar: true,
        showTicks: true,
        precision: 1,
        onStart: function() {
          vm.useWireframe = false;
          applyChanges();
        },
        onEnd: function() {
          vm.useWireframe = false;
          applyChanges();
        },
        onChange: function() {
          applyChanges();
        },
        translate: function(value) {
          if (value === 0) {
            return 'Default';
          }
          return '';
        }
      }
    };
    return jsonObj;
  };

  vm.xAxisSetSliderOptions = function() {
    let jsonObj = {
      options: {
        floor: -2000,
        ceil: 2500,
        step: 100,
        hideLimitLabels: true,
        showSelectionBar: true,
        showTicks: true,
        precision: 1,
        onStart: function() {
          vm.useWireframe = true;
          //applyChanges();
        },
        onEnd: function() {
          vm.useWireframe = false;
          applyChanges();
        },
        onChange: function() {
          applyChanges();
        },
        translate: function() {
          return '';
        }
      }
    };
    return jsonObj;
  };

  vm.yAxisSetSliderOptions = function() {
    let jsonObj = {
      options: {
        floor: -2000,
        ceil: 2000,
        step: 100,
        hideLimitLabels: true,
        showSelectionBar: true,
        showTicks: true,
        precision: 1,
        onStart: function() {
          vm.useWireframe = true;
          //applyChanges();
        },
        onEnd: function() {
          vm.useWireframe = false;
          applyChanges();
        },
        onChange: function() {
          applyChanges();
        },
        translate: function() {
          return '';
        }
      }
    };
    return jsonObj;
  };

  vm.autoApplyChanges = function() {
    $timeout(function() {
      applyChanges();
    }, 0, true);
  };

  //this is used to force a redraw of the sliders
  vm.reCalcViewDimensions = function() {
    $timeout(function() {
      $scope.$broadcast('reCalcViewDimensions');
    });
  };

  function applyChanges() {

    $('#plotContainer').empty(); // clear all html
    vm.totalRebuild = false;
    setCurrentCameraAndTargetPos();
    init('applyChanges');

    vm.controls.target.set(vm.currentTargetXYZ[0].x, vm.currentTargetXYZ[0].y, vm.currentTargetXYZ[0].z);
    //set camera positions
    vm.camera.position.x = vm.currentCameraXYZ[0].x;
    vm.camera.position.y = vm.currentCameraXYZ[0].y;
    vm.camera.position.z = vm.currentCameraXYZ[0].z;
  }

  // setup/populate model obj variables
  function getModelDataObjects() {
    vm.treatments = vm.modelData[0].treatments;
    vm.studies = vm.modelData[0].studies;
    vm.covariates = vm.modelData[0].covariates;

    vm.treatmentsCount = vm.treatments.length;
    vm.studiesCount = vm.studies.length;
    vm.covariatesCount = vm.covariates.length;

    vm.container = document.createElement('div');
    $('#plotContainer').append(vm.container);

    //vm.$studies = vm.studies; // collection of study items
    vm.segmentSize = 360 / (vm.treatmentsCount - 1); // -1 to exclude the basenode;
    vm.$segmentTotal = 0;

    if (vm.totalRebuild || vm.initOpen) {
      //initialise as showing covariate labels
      vm.showHideCovariateLabels = true;
      //initially show grid
      vm.showGrid = true;
      rebuildModelData();
    }
    // create list of covariates for the drop down
    createDistinctCovariateList();
  }

  //setup the initial three objects required
  function setupThreeObjects() {
    if (vm.totalRebuild || vm.initOpen || !vm.useConfigOptions) {
      vm.camera = new THREE.PerspectiveCamera(70,
        $('#plotContainer').width() / $('#plotContainer').width(),
        1, 10000);

      vm.camera.position.x = -200;
      vm.camera.position.y = 200;
      vm.camera.position.z = 550;
    }

    //

    vm.controls = new THREE.OrbitControls(vm.camera, vm.container);

    vm.controls.enableDamping = true;
    vm.controls.dampingFactor = 1;
    vm.controls.enableZoom = true;
    vm.controls.maxPolarAngle = Math.PI; // stop the orbitcontrol form going below the 'ground' ie the -axis

    vm.scene = new THREE.Scene();
    vm.scene.add(new THREE.AmbientLight(0x505050));

    let light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    light.castShadow = true;

    light.shadow.camera.near = 200;
    light.shadow.camera.far = vm.camera.far;
    light.shadow.camera.fov = 50;

    light.shadow.bias = -0.00022;

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    vm.scene.add(light);

    vm.plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2000, 2000, 8, 8),
      new THREE.MeshBasicMaterial({
        visible: false,
        wireframe: vm.useWireframe

      })
    );

    vm.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    vm.renderer.setClearColor(0xf0f0f0);
    vm.renderer.setPixelRatio(window.devicePixelRatio);
    vm.renderer.setSize($('#plotContainer').width(), $('#plotContainer').width());
    vm.renderer.sortObjects = false;
    vm.renderer.shadowMap.enabled = true;
    vm.renderer.shadowMap.type = THREE.PCFShadowMap;
    vm.renderer.domElement.id = 'canvas';

    vm.container.appendChild(vm.renderer.domElement);
  }

  function init(caller) {
    //console.log(caller);
    // setup/populate model obj variables
    getModelDataObjects();

    //setup the initial three objects required
    setupThreeObjects();

    //console.log('vm.currentCameraXYZ', vm.currentCameraXYZ);
    //console.log('vm.currentTargetXYZ', vm.currentTargetXYZ);
    createTreatments();
    createLinks();

    if (vm.showGrid) {
      createGrid();
    }

    //add all changes from above into the scene
    vm.scene.add(vm.plane);

    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();
    animate();

    vm.initOpen = false;
  }

  // create an object to hold the correct covariates in the correct study
  function rebuildModelData() {
    //console.log('rebuildModelData');
    // has link data already been created/loaded
    if (vm.modelData[0].links !== undefined) {
      vm.links = vm.modelData[0].links;
      return;
    }

    let linksObject = {
      links: []
    };

    let sourceIndex = 0;
    let targetIndex = 0;

    function _linkExists(studyObj) {
      let exists = false;
      let lenlinksObject = linksObject.links.length;
      for (let i = 0; i < lenlinksObject; i++) {
        if (
          linksObject.links[i].sourceIndex === studyObj.sourceIndex &&
          linksObject.links[i].targetIndex === studyObj.targetIndex ||
          linksObject.links[i].targetIndex === studyObj.sourceIndex &&
          linksObject.links[i].sourceIndex === studyObj.targetIndex ||
          linksObject.links[i].sourceIndex === studyObj.targetIndex &&
          linksObject.links[i].targetIndex === studyObj.sourceIndex
        ) {
          exists = true;
        }
      }

      return exists;
    }

    function _trialExists(trialIndex) {
      let exists = false;
      let lenTreatments = vm.treatments.length;
      for (let i = 0; i < lenTreatments; i++) {
        if (vm.treatments[i].treatment_index === trialIndex) {
          vm.treatments[i].pos[0] = vm.useLoadedData ? vm.treatments[i].pos[0] : 300;
          vm.treatments[i].pos[1] = vm.useLoadedData ? vm.treatments[i].pos[1] : 300;
          exists = true;
          break;
        }
      }
      return exists;
    }

    let linkCount = 1;
    let lenStudies = vm.studies.length;

    for (let i = 0; i < lenStudies; i++) {
      sourceIndex = vm.studies[i].sourceIndex;
      targetIndex = vm.studies[i].targetIndex;

      if (!_linkExists(vm.studies[i]) && (_trialExists(sourceIndex) && _trialExists(targetIndex))) {
        let newLink = {
          index: linkCount++,
          sourceIndex: vm.studies[i].sourceIndex,
          targetIndex: vm.studies[i].targetIndex,
          offset: 0,
          spacing: 1,
          color: 'silver',
          showTreatment: true,
          studies: []

        };
        linksObject.links.push(newLink);
      }
    }

    //get each study that uses the source and target index
    let lenlLinksObject = linksObject.links.length;
    for (let i = 0; i < lenlLinksObject; i++) {
      let thisLink = linksObject.links[i];
      let studiesArr = vm.studies.filter(function(s) {
        let exists = (s.sourceIndex === thisLink.sourceIndex &&
            s.targetIndex === thisLink.targetIndex) ||
          (s.targetIndex === thisLink.sourceIndex && s.sourceIndex === thisLink.targetIndex) ||
          (s.sourceIndex === thisLink.targetIndex && s.targetIndex === thisLink.sourceIndex);
        return exists;
      });

      // builds a study and its index into the studies array
      let lenStudiesArr = studiesArr.length;
      for (let i = 0; i < lenStudiesArr; i++) {
        let thisStudy = studiesArr[i];
        let newStudy = {
          studyIndex: thisStudy.index,
          studyName: thisStudy.studyName,
          weighting: thisStudy.weighting,
          color: 'black',
          covariates: vm.getCovariates(thisStudy.index)
        };
        thisLink.studies.push(newStudy);
      }
    }

    vm.links = linksObject.links;

    //console.log('rebuildModelData', JSON.stringify(vm.links));
  }

  function createDistinctCovariateList() {
    let covariateList = [];
    let lenCovariates = vm.covariates.length;
    for (let i = 0; i < lenCovariates; i++) {
      if ($.inArray(vm.covariates[i].name, covariateList) === -1) {
        covariateList.push(vm.covariates[i].name);
      }
    }
    vm.covariatesDistinctList = covariateList;
  }

  vm.getCovariates = function(studyId) {
    let studyCovariates;

    studyCovariates = vm.covariates.filter(function(c) {
      c.colorChanged = false;
      c.valueChanged = false;
      c.color = c.covariate > 0 ? 'green' : 'red';

      //  c.valueChanged = false;
      return c.studyIndex === studyId;
    });

    return studyCovariates;
  };

  // Creates the nodes
  function createTreatments() {
    // iterate each node object
    //console.log('vm.$treatments', vm.treatments);

    let lenTreatments = vm.treatments.length;
    for (let i = 0; i < lenTreatments; i++) {
      if (isTreatmentVisible(vm.treatments[i].treatment_index)) {
        //set the size of the sphere
        let sphereWeight = vm.treatments[i].weighting * 10;
        let distanceFromBaseNode = vm.treatments[i].distanceFromBaseNode;
        let geometry = new THREE.SphereGeometry(sphereWeight, 15, 15);
        let object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
          color: vm.treatments[i].color,
          wireframe: vm.useWireframe
        }));

        object.castShadow = false;
        object.receiveShadow = false;
        object.NodeID = vm.treatments[i].treatment_index;

        if (vm.treatments[i].basenode) {
          object.position.x = 0;
          object.position.y = 0;
          object.position.z = 0;
        } else {
          // console.log('pos', vm.treatments[index].pos);
          // console.log('vm.treatments[index].pos[0]', vm.treatments[index].pos[0]);
          // console.log('vm.treatments[index].pos[1]', vm.treatments[index].pos[1]);

          object.position.x = vm.treatments[i].pos[0];
          object.position.y = vm.treatments[i].pos[1];

          if ((vm.totalRebuild || vm.initOpen) && !vm.useLoadedData) {
            object.position.x = Math.cos(vm.$segmentTotal * Math.PI / 180) * distanceFromBaseNode;
            object.position.y = Math.sin(vm.$segmentTotal * Math.PI / 180) * distanceFromBaseNode;
          }

          object.position.z = 0;

          vm.$segmentTotal += vm.segmentSize;
        }

        vm.treatments[i].pos.splice(0, 3); // clear previous position data
        vm.treatments[i].pos.push(object.position.x, object.position.y, object.position.z);

        vm.scene.add(object);
        vm.objects.push(object);
      }
    }
  }

  // gets the start point for the link object
  function getPos(sIndex) {
    //console.log('$modelTreatments', $modelTreatments);
    let rtnVal = [];
    let lenTreatments = vm.treatments.length;
    let i = 0;
    for (i; i < lenTreatments; i++) {
      if (vm.treatments[i].treatment_index === sIndex) {
        rtnVal = vm.treatments[i].pos;
        break;
      }
    }
    return rtnVal;
  }

  function createStudyText() {
    let lenTreatments = vm.treatments.length;
    for (let i = 0; i < lenTreatments; i++) {
      // $.each(vm.treatments, function(index, obj) {
      if (isTreatmentVisible(vm.treatments[i].treatment_index)) {
        let sphereWeight = vm.treatments[i].weighting * 10;
        let mesh;
        let x = vm.treatments[i].pos[0];
        let y = vm.treatments[i].pos[1] + sphereWeight;
        let z = vm.treatments[i].pos[2];
        mesh = createLabel(vm.treatments[i].name, x, y, z, 10, "black", "");

        vm.meshObjects.push(mesh);
        vm.scene.add(mesh);
      }
    }
  }

  function createLabel(text, x, y, z, size, color, backGroundColor, backgroundMargin) {
    if (!backgroundMargin) {
      backgroundMargin = 5;
    }
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    context.font = size + "pt Arial";
    let textWidth = context.measureText(text).width;
    canvas.width = textWidth + backgroundMargin;
    canvas.height = size + backgroundMargin;
    context = canvas.getContext("2d");
    context.font = size + "pt Arial";
    if (backGroundColor) {
      context.fillStyle = backGroundColor;
      context.fillRect(
        canvas.width / 2 - textWidth / 2 - backgroundMargin / 2,
        canvas.height / 2 - size / 2 + backgroundMargin / 2, textWidth + backgroundMargin, size + backgroundMargin
      );
    }
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    let material = new THREE.MeshBasicMaterial({
      map: texture,
      depthWrite: false // this seems to fix the issue of meshs obscuring meshes behind them.
    });

    material.map.minFilter = THREE.LinearFilter;
    material.transparent = true;
    let mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width, canvas.height), material);
    // mesh.overdraw = true;
    mesh.doubleSided = true;
    mesh.position.x = x;
    mesh.position.y = y + (canvas.height / 2);
    mesh.position.z = z;

    return mesh;
  }

  function isTreatmentVisible(trialIndex) {
    let len = vm.treatments.length;
    for (let i = 0; i < len; i++) {
      if (vm.treatments[i].treatment_index === trialIndex && vm.treatments[i].showTreatment) {
        return true;
      }
    }
    return false;
  }

  // creates the links between treatments
  function createLinks() {
    let genericLineWidth = 5;

    let len = vm.links.length;
    for (let i = 0; i < len; i++) {
      let link = vm.links[i];
      //console.log('s isTreatmentVisible', isTreatmentVisible(link.sourceIndex));
      //console.log('t isTreatmentVisible', isTreatmentVisible(link.targetIndex));
      if (!isTreatmentVisible(link.sourceIndex) || !isTreatmentVisible(link.targetIndex)) {
        break;
      }
      let sourcePos = getPos(link.sourceIndex);
      let targetPos = getPos(link.targetIndex);

      //console.log('link', link);

      let startStudyLine = new THREE.Vector3(sourcePos[0], sourcePos[1], sourcePos[2]); // get start position of line
      let endStudyLine = new THREE.Vector3(targetPos[0], targetPos[1], sourcePos[2]); // get end position of line

      let studyLinegeometry = new THREE.Geometry();
      studyLinegeometry.vertices.push(
        startStudyLine,
        endStudyLine

      );
      let linematerial = new THREE.LineBasicMaterial({
        color: link.color,
        linewidth: genericLineWidth
      });

      vm.studyLine = new THREE.Line(studyLinegeometry, linematerial); // build line
      vm.studyLine.connector = true;

      vm.scene.add(vm.studyLine); // add line to scene

      if (!vm.useWireframe) {
        createStudyCovariates(link);
      }
    }

    if (!vm.useWireframe) {
      createStudyText();
    }
  }

  function createStudyCovariates(link) {
    if (!isTreatmentVisible(link.sourceIndex) || !isTreatmentVisible(link.targetIndex)) {
      return;
    }
    let sourcePos = getPos(link.sourceIndex);
    let targetPos = getPos(link.targetIndex);

    let thisCovarIndex = 1;

    let offsetModifier = link.offset; //0; // todo: get from user inputs on trial x > trial y level gops form 0 to 1
    let spacingModifier = link.spacing; //1; // todo: get from user inputs on trial x > trial y level goes from 1 to 0

    let linkStudies = link.studies;
    let allLinkStudyCovariates = [];
    let linkStudyMap = {};

    linkStudies.forEach(linkStudy => {
      allLinkStudyCovariates = allLinkStudyCovariates.concat(linkStudy.covariates);
      linkStudyMap[linkStudy.studyIndex] = { studyName: linkStudy.studyName, color: linkStudy.color };
    });
    let covariatesToDisplay = allLinkStudyCovariates.filter(covariate => covariate.name === vm.covariateSelection);
    let covariateCount = covariatesToDisplay.length;
    let covariateIncrement = spacingModifier / (covariateCount + 1);

    let len = covariatesToDisplay.length;
    for (let i = 0; i < len; i++) {
      let covariate = covariatesToDisplay[i];

      let studyName = linkStudyMap[covariate.studyIndex].studyName;
      let studyColor = linkStudyMap[covariate.studyIndex].color;

      let geometry = new THREE.CylinderGeometry(5, 5, covariate.covariate, 10, 1);
      let material = new THREE.MeshBasicMaterial({
        color: covariate.color,
        wireframe: vm.useWireframe
      });
      let cylinder = new THREE.Mesh(geometry, material);

      let diffX = Math.round(Math.abs(sourcePos[0] - targetPos[0]));
      let diffY = Math.round(Math.abs(sourcePos[1] - targetPos[1]));

      let offsetX = 0;
      let offsetY = 0;
      if (offsetModifier > 0) {
        offsetX = diffX * offsetModifier - (diffX * covariateIncrement);
        offsetY = diffY * offsetModifier - (diffY * covariateIncrement);
      } else if (offsetModifier < 0) {
        offsetX = diffX * offsetModifier + (diffX * covariateIncrement);
        offsetY = diffY * offsetModifier + (diffY * covariateIncrement);
      }

      let distanceModifier = (thisCovarIndex * covariateIncrement); // 0.25, 0.5, 0.75

      let distanceX = (diffX * distanceModifier) + offsetX;
      let distanceY = (diffY * distanceModifier) + offsetY;

      cylinder.position.x = targetPos[0] + (distanceX); // targetPos
      cylinder.position.y = targetPos[1] + (distanceY); // sourcePos
      cylinder.position.z = (covariate.covariate / 2) - 1;

      let directionModiferX = targetPos[0] < sourcePos[0] ? -1 : 1;
      let directionModiferY = targetPos[1] < sourcePos[1] ? -1 : 1;

      distanceX *= directionModiferX;
      distanceY *= directionModiferY;

      if (targetPos[0] < 0 && targetPos[1] < 0) {
        cylinder.position.x = (sourcePos[0]) + distanceX;
        cylinder.position.y = (sourcePos[1]) + distanceY;
      }

      if (targetPos[0] >= 0 && targetPos[1] >= 0) {
        cylinder.position.x = (sourcePos[0]) + distanceX;
        cylinder.position.y = (sourcePos[1]) + distanceY;
      }

      if (sourcePos[0] >= 0 && sourcePos[1] >= 0) {
        cylinder.position.x = (sourcePos[0]) + distanceX;
        cylinder.position.y = (sourcePos[1]) + distanceY;
      }

      if (sourcePos[0] < 0 && sourcePos[1] < 0) {
        cylinder.position.x = (sourcePos[0]) + distanceX;
        cylinder.position.y = (sourcePos[1]) + distanceY;
      }

      cylinder.rotateX(Math.sin(Math.PI / 180) * 90);
      cylinder.isCylinder = true;

      vm.scene.add(cylinder);

      if (vm.showHideCovariateLabels) {
        let mesh;
        //let valueColor = covariate.value < 0 ? 'red' : 'green';
        let valueColor = 'black';

        mesh = createLabel(studyName, cylinder.position.x, cylinder.position.y + 15, covariate.covariate, 10,
          studyColor, '');
        vm.meshObjects.push(mesh);
        vm.scene.add(mesh);

        let valueText = covariate.covariate === 0 ? "N/R" : covariate.covariate + "(" + covariate.unit + ")";
        // valueColor = covariate.value === 0 ? studyColor : valueColor;
        //valueColor = 'black';

        mesh = createLabel(valueText, cylinder.position.x, cylinder.position.y, covariate.covariate, 10,
          valueColor,
          "");
        vm.meshObjects.push(mesh);
        vm.scene.add(mesh);
      }

      thisCovarIndex++;
    }
  }

  init('createStudyCovariates');
  animate();

  vm.showCovariateData = function(selectionText) {
    vm.covariateSelection = selectionText;
    vm.selectedCovariate = selectionText === "None" ? "Covariate Selection" : `Viewing Covariate "${selectionText}"`;

    applyChanges();
  };

  vm.getTrialName = function(id) {
    let trialObj = vm.treatments.filter(function(t) {
      return t.treatment_index === id;
    });

    return trialObj[0].name;
  };

  vm.getLinkStudies = function(sourceId, targetId) {
    let studiesObj = vm.links.filter(function(l) {
      return l.sourceIndex === sourceId && l.targetIndex === targetId;
    });

    return studiesObj[0].studies;
  };

  vm.fileChanged = function(event) {
    vm.file = null;
    vm.file = event.target.files[0];
    if (vm.file) {
      sendFileToAPI(vm.file);
    } else {
      vm.error = `File has not been specified`;
    }
  };

  vm.getData = function() {
    angular.element('#plotInputFile').click();
  };

  vm.updateData = function() {
    //console.log(JSON.stringify(vm.modelData));
    if (vm.formErrors) {
      return;
    }
    if (vm.file) {
      $('#plotContainer').empty(); // clear all html
      vm.totalRebuild = false;
      init('vm.updateData');
    } else {
      angular.element('#plotInputFile').click();
    }
  };

  // function called by the reset button - will reset everything to the last loaded or default data set
  vm.resetData = function() {
    //if (vm.file) {
    $('#plotContainer').empty(); // clear all html
    vm.selectedCovariate = 'Covariate Selection';
    vm.covariateSelection = 'None';
    vm.totalRebuild = true;
    vm.useConfigOptions = false;
    vm.resettingData = true;

    vm.modelData = angular.copy(vm.originalModelData[0].config[1].data);

    console.log('vm.modelData', vm.modelData);


    init('vm.resetData');

    if (!$.isEmptyObject(vm.originalModelData[0].config[0])) {
      useConfigOptions();
    }

  };

  /**
   * The event handler for the link's onclick event. We give THIS as a
   * parameter (=the link element), ID of the canvas and a filename.
   */
  vm.nowSave = function(type) {
    if (type === 0 /*download*/ ) {
      downloadCanvas(document.getElementById('download'), 'canvas', `${vm.newPDFFileName.replace('.png', '')}.png`);
      angular.element('#downloadModal').modal('hide');
    } else /*save raw data*/ {
      $scope.saveRawData();

      let e = document.createEvent('MouseEvents');
      let a = document.createElement('a');

      let data = JSON.stringify(vm.savedJson);
      let blob = new Blob([data], { type: 'text/json' });

      a.href = window.URL.createObjectURL(blob);
      a.download = `${vm.saveRawDataFileName.replace('.json', '')}.json`;
      //console.log(['text/json', a.download, a.href].join(':'));
      a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
      e.initEvent('click', true, false, window,
        0, 0, 0, 0, 0, false, false, false, false, 0, null);
      a.dispatchEvent(e);

      angular.element('#saveRawDataModal').modal('hide');
    }
  };

  function setConfigOptions() {
    vm.savedJson.config[0].showGrid = vm.showGrid;
    vm.savedJson.config[0].showCovariateLabels = vm.showHideCovariateLabels;
    vm.savedJson.config[0].selectedCovariateText = vm.covariateSelection;
    vm.savedJson.config[0].cameraPosition = [{}];
    vm.savedJson.config[0].cameraPosition[0].x = vm.camera.position.x;
    vm.savedJson.config[0].cameraPosition[0].y = vm.camera.position.y;
    vm.savedJson.config[0].cameraPosition[0].z = vm.camera.position.z;
    vm.savedJson.config[0].targetPosition = [{}];
    vm.savedJson.config[0].targetPosition[0].x = vm.controls.target.x;
    vm.savedJson.config[0].targetPosition[0].y = vm.controls.target.y;
    vm.savedJson.config[0].targetPosition[0].z = vm.controls.target.z;
  }

  //save raw json data
  $scope.saveRawData = function() {
    vm.savedJson = { config: [{}, { data: [] }] };

    setConfigOptions();

    vm.jsonDataTemplate = angular.copy(vm.modelData);
    vm.jsonDataTemplate[0].links = vm.links; // add link object so as not to lose link information when realdoing
    vm.savedJson.config[1].data[0] = vm.jsonDataTemplate[0];
  };

  /**
   * This is the function that will take care of image extracting and
   * setting proper filename for the download.
   * IMPORTANT: Call it from within a onclick event.
   */
  function downloadCanvas(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL("image/png", 1.0);
    link.download = filename;
  }

  $scope.templateAlert = {
    title: 'Template Downloaded',
    type: "success"
  };

  // download a blank template for the user;
  vm.getBlankTemplate = function() {
    document.getElementById('downloadTemplate').href = '../assets/BlankTemplate.xlsx';
    document.getElementById('downloadTemplate').download = 'BlankTemplate.xlsx';
  };

  //is the loaded file ok?
  $scope.FileOk = true;

  function sendFileToAPI(file) {
    let fd = new FormData();
    fd.append('file', file);
    vm.modelData = plotModelsResource.getModel({}, fd)
      .$promise
      .then(res => {
        //console.log(res);
        vm.modelData = res;

        $('#plotContainer').empty(); // clear all html
        vm.selectedCovariate = 'Covariate Selection';
        vm.covariateSelection = 'None';
        vm.modelData = angular.copy(vm.modelData);

        vm.useLoadedData = false;
        vm.totalRebuild = true;
        $scope.FileOk = true;
        //vm.modelData = angular.copy(vm.exampleModelData[0].config[1].data);
        //vm.originalModelData = angular.copy(vm.exampleModelData); // for reset purposes

        init('sendFileToAPI');

        //build the data as when you save a file , this will enable the reset function to work
        $scope.saveRawData();

        console.log('vm.savedJson');
        vm.modelData = angular.copy(vm.savedJson.config[1].data);
        vm.originalModelData[0] = angular.copy(vm.savedJson);

        vm.useLoadedData = true;

      }).catch(err => {
        $scope.FileOk = false;
      });
  }

  function createGrid() {
    ///////////////////
    // CREATE GRID AXIS
    let size = 1000;
    let step = 50;

    let gridXgeometry = new THREE.Geometry();
    let gridYgeometry = new THREE.Geometry();
    let gridZgeometry = new THREE.Geometry();

    for (let i = -size; i <= size; i += step) {
      // X AXIS
      gridXgeometry.vertices.push(new THREE.Vector3(-size, 0, i));
      gridXgeometry.vertices.push(new THREE.Vector3(size, 0, i));
      gridXgeometry.vertices.push(new THREE.Vector3(i, 0, -size));
      gridXgeometry.vertices.push(new THREE.Vector3(i, 0, size));

      // Z AXIS
      gridZgeometry.vertices.push(new THREE.Vector3(0, size, i));
      gridZgeometry.vertices.push(new THREE.Vector3(0, -size, i));
      gridZgeometry.vertices.push(new THREE.Vector3(0, i, size));
      gridZgeometry.vertices.push(new THREE.Vector3(0, i, -size));

      // Y AXIS
      gridYgeometry.vertices.push(new THREE.Vector3(i, -size, 0));
      gridYgeometry.vertices.push(new THREE.Vector3(i, size, 0));
      gridYgeometry.vertices.push(new THREE.Vector3(size, i, 0));
      gridYgeometry.vertices.push(new THREE.Vector3(-size, i, 0));
    }

    let material = new THREE.LineBasicMaterial({
      color: 0x000000,
      opacity: 0.05,
      transparent: true
    });

    // X AXIS
    let line = new THREE.LineSegments(gridXgeometry, material);
    vm.scene.add(line);

    vm.raycaster = new THREE.Raycaster();
    vm.mouse = new THREE.Vector2();

    gridXgeometry = new THREE.PlaneBufferGeometry(1000, 1000);
    gridXgeometry.rotateX(-Math.PI / 2);

    vm.plane = new THREE.Mesh(gridXgeometry, new THREE.MeshBasicMaterial({
      visible: false
    }));
    vm.scene.add(vm.plane);
    vm.objects.push(vm.plane);

    // Y AXIS
    line = new THREE.LineSegments(gridYgeometry, material);
    vm.scene.add(line);

    vm.raycaster = new THREE.Raycaster();
    vm.mouse = new THREE.Vector2();

    gridYgeometry = new THREE.PlaneBufferGeometry(1000, 1000);
    gridYgeometry.rotateX(-Math.PI / 2);

    vm.plane = new THREE.Mesh(gridYgeometry, new THREE.MeshBasicMaterial({
      visible: false
    }));
    vm.scene.add(vm.plane);
    vm.objects.push(vm.plane);

    // Z AXIS
    line = new THREE.LineSegments(gridZgeometry, material);
    vm.scene.add(line);

    vm.raycaster = new THREE.Raycaster();
    vm.mouse = new THREE.Vector2();

    gridZgeometry = new THREE.PlaneBufferGeometry(1000, 1000);
    gridZgeometry.rotateZ(-Math.PI / 2);

    vm.plane = new THREE.Mesh(gridZgeometry, new THREE.MeshBasicMaterial({
      visible: false
    }));
    vm.scene.add(vm.plane);

    // CREATE GRID AXIS - END
    ///////////////////
  }

  function animate() {
    requestAnimationFrame(animate);
    $.each(vm.meshObjects, function() {
      this.lookAt(vm.camera.position);
    });

    render();
  }

  function render() {
    vm.controls.update();
    vm.renderer.render(vm.scene, vm.camera);
  }

  function onWindowResize() {
    vm.camera.aspect = $('#plotContainer').width() / $('#plotContainer').width();
    vm.camera.updateProjectionMatrix();

    vm.renderer.setSize($('#plotContainer').width(), $('#plotContainer').width());
  }

  $scope.panelOpenClose = function(event) {
    //let imgToChange = $($(event.target).parent().prev().closest('div').find('i'));
    let imgToChange = $($(event.target).parent().prev().closest('div').find('i'));

    if (imgToChange.hasClass('unCollapsedImg')) {
      imgToChange.removeClass('unCollapsedImg');
      imgToChange.addClass('collapsedImg');
    } else {
      imgToChange.removeClass('collapsedImg');
      imgToChange.addClass('unCollapsedImg');
    }

    vm.reCalcViewDimensions();
  };

  // show or hide covariate labels
  $scope.showHideCovariateLabels = function(blnSelection) {
    vm.showHideCovariateLabels = blnSelection;
    applyChanges();

  };

  //show or hide the grid
  $scope.showHideGrid = function(blnSelection) {
    vm.showGrid = blnSelection;
    applyChanges();
  };

  //point a specified node --- is very much WIP
  $scope.pointCameraAtNode = function(selectedNode) {
    vm.controls.target = new THREE.Vector3(selectedNode.pos[0], selectedNode.pos[1], 0);
  };

  vm.uploadedRawData = '';

  //show or hide slected treatment nodes and anything related to it.
  $scope.showHideTreatment = function(selectedNode) {
    selectedNode.showTreatment = !selectedNode.showTreatment;
    // $('#plotContainer').empty(); // clear all html
    vm.totalRebuild = true;
    applyChanges();

    //console.log('vm.uploadRawData', vm.uploadRawData);
  };

  //use saved config data.
  function useConfigOptions() {
    let configJson = vm.originalModelData[0].config[0];

    $timeout(function() {
      $scope.showHideGrid(configJson.showGrid);
      $scope.showHideCovariateLabels(configJson.showCovariateLabels);
      vm.showCovariateData(configJson.selectedCovariateText);

      //set the target point of the controls
      vm.controls.target.set(configJson.targetPosition[0].x, configJson.targetPosition[0].y, configJson.targetPosition[
        0].z);
      //set camera positions
      vm.camera.position.x = configJson.cameraPosition[0].x;
      vm.camera.position.y = configJson.cameraPosition[0].y;
      vm.camera.position.z = configJson.cameraPosition[0].z;

      //setCurrentCameraAndTargetPos(); // this may need to back in

      resetPanels();
    }, 0);

    vm.useConfigOptions = true;
  }

  //use data from the laded raw data file
  $scope.useRawData = function($fileContent) {
    try {
      JSON.parse($fileContent);
    } catch (e) {
      $scope.FileOk = false;
      return false;
    }

    vm.useLoadedData = true;
    vm.totalRebuild = true;
    vm.initOpen = true;
    vm.useConfigOptions = false;

    vm.savedJson = JSON.parse($fileContent);

    vm.originalModelData = angular.copy(vm.savedJson);

    vm.modelData = angular.copy(vm.originalModelData[0].config[1].data);
    $('#plotContainer').empty();
    init('$scope.useRawData');

    useConfigOptions();

    //vm.useLoadedData = false;
    $scope.FileOk = true;
  };

  // reset any open panels
  function resetPanels() {
    $('.panel-collapse.collapse.in').collapse('toggle');
    $('.unCollapsedImg').addClass('collapsedImg');
    $('.collapsedImg').removeClass('unCollapsedImg');
  }

  // load in raw json data
  $scope.loadRawData = function() { // clear all html
    //console.log(vm.camera.getWorldDirection());
    $('#uploadRawData').trigger('click');
  };

  // get and set current position of both camera and target
  function setCurrentCameraAndTargetPos() {

    // if(!vm.useLoadedData)
    // {
    vm.currentCameraXYZ = [{}];
    vm.currentTargetXYZ = [{}];
    vm.currentCameraXYZ = [{ x: vm.camera.position.x, y: vm.camera.position.y, z: vm.camera.position.z }];
    vm.currentTargetXYZ = [{ x: vm.controls.target.x, y: vm.controls.target.y, z: vm.controls.target.z }];
    // }
    // else
    // {
    //   vm.currentCameraXYZ = [{ x: configJson.cameraPosition[0].x, y: configJson.cameraPosition[0].y, z: configJson.cameraPosition[0].z }];
    //   vm.currentTargetXYZ = [{ x: configJson.targetPosition[0].x, y: configJson.targetPosition[0].y, z: configJson.targetPosition[0].z }];
    //
    //   vm.controls.center.set(configJson.targetPosition[0].x, configJson.targetPosition[0].y, configJson.targetPosition[
    //     0].z);
    //   //set camera positions
    //   vm.camera.position.x = configJson.cameraPosition[0].x;
    //   vm.camera.position.y = configJson.cameraPosition[0].y;
    //   vm.camera.position.z = configJson.cameraPosition[0].z;
    //
    //
    //
    // }
    //console.log('vm.currentCameraXYZ', vm.currentCameraXYZ);
    //console.log('vm.currentTargetXYZ', vm.currentTargetXYZ);

  }
}

angular.module('covariateVisualiserUi').controller('PlotCtrl', PlotCtrl);
