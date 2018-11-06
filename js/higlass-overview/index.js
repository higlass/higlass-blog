// three heatmaps with viewport projections
hglib.viewer(
        document.getElementById('maps-and-tiles'),
        "https://higlass.io/api/v1//viewconfs/?d=dRp3cYjPTfiUPzjeXoBkcA",
        { bounded: true, editable: false }
    );

// F09GKDv2RS-Qwkhqa8rYHA
// 
hglib.viewer(
        document.getElementById('two-heatmaps'),
        "https://higlass.io/api/v1//viewconfs/?d=CL_lVumdTWKbTCE9n556ZQ",
        { bounded: true, editable: false }
    );

// 
hglib.viewer(
        document.getElementById('three-heatmaps'),
        "https://higlass.io/api/v1//viewconfs/?d=Y7FtjugjR6OIV_P2DRqCSg",
        { bounded: true, editable: false }
    );

// mandelbrot set
hglib.viewer(
        document.getElementById('mandelbrot'),
        "https://higlass.io/api/v1/viewconfs/?d=X36M4xrtS3iPFCp7cFigUQ",
        { bounded: true, editable: false }
    );

