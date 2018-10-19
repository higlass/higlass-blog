---
layout: post
title:  "Big data visualization using HiGlass"
description: "Using HiGlass to view and explore large datasets."
tags: higlass jupyter python
thumbnail: 
---

The past decade has seen tremendous advances in the field of data
visualization.  Libraries such as D3.js have made it not only possible but easy
to create complex, informative and beautiful visualizations. Vega and vega lite
introduced declarative specifications for describing both how data should be
plotted and how the user should interact with it. A cadre of other libraries
and services let people create interactive plots that they can share in 
web browsers.

Most of these tools and libraries, however, have one glaring limitation. They
require loading and operating on the the entire dataset. This precludes their
use with data too large to fit into memory or to render at once. Even with
smaller datasets, issues such as occlusion and overplotting can make it
difficult to explore and analyze data. This need not be the case. 
We already have techniques that allow us to break
down large datasets into smaller, digestible chunks which can be displayed
without overwhelming the rendering library or viewer. 

## Inspired by maps

Online maps, for example, are a de-facto visualization of terabyte-scale datasets. They rely on
a very simple principle: only render what is relevant at a given scale and
location. Modern "slippy maps" partition data into <i>tiles</i> which are indexed
using three integers:

* **z** - the zoom level describing the scale at which we are viewing the map
* **x** - the x position of the "tile"
* **y** - the y position of the "tile"

In a typical map, there are 19 zoom levels. The lowest, 0, contains one tile
which covers the entire world. The next zoom level, 1, contains 4 tiles. Each
one a quarter of the area of the previous one. The highest zoom level, 19,
contains 4 ^ 19 tiles. Which tiles are loaded at any given time depends on how
zoomed in and where one is on a map. Typically, only a handful of tiles are
loaded at any given time. By limiting the amount of data contained in each tile
and the number of tiles visible at any given time, we effectively limit the
amount of data that needs to be rendered.

<div class="wp-caption alignleft" style="width: 550px; margin-bottom: 15px">
	<div id="maps-and-tiles" style="height: 300px"> </div>
	<p class="wp-caption-text">Online maps are rendered by retrieving and stitching
	together small images called *tiles*. The view on the right shows the tiles that
	make up the zoomable map on the left.</p>
</div>

Can we apply the same technique to other types of data? Of course.

<h2>HiGlass</h2>

Over the past two and a half years we created HiGlass, a multiscale viewer for
any type of large data. The interaction is the same as in online maps. You can
pan and zoom and we only request resolution- and location- relevant data from
the server. **No matter how much data there is, the browser is never overloaded
and interaction remains smooth and responsive.** For proof, here is a 3 million 
by 3 million matrix displayed in a web browser.

<div class="wp-caption alignleft" style="width: 550px; margin-bottom: 15px">
	<div id="two-heatmaps" style="height: 300px"></div>
	<p class="wp-caption-text">Using a maps-like, tile based rendering, we can interactively
	navigate massive 3 million x 3 million matrices. On the left is just matrix
	and on the right is the matrix with an overlay showing the locations of the
	individual tiles. Because we are rendering directly on the client, we can adjust
	the color scale without having to re-retrieve data from the server.</p>
</div>

<br />
So how does this work? There's two key requirements:

1. A method of downsampling the data
2. A method of retrieving subsets of the data corresponding to the visible region

In the case of matrices, this is quite simple. The downsampling function is
simply a summation of adjacent cells. To retrieve subsets, we simply extract
slices of the matrix. In the example above, the downsampling has been
precomputed for each zoom level and stored in the cooler file format. Tile
requests are fulfilled by a HiGlass server running on an Amazon EC2 instance. 

<h2>Custom data sources</h2>

The example set by online maps can be adopted by nearly any other spatial-like
data. As long as we can downsample our data and partition it into tiles, we can
create a server component to power HiGlass. This lightweight server needs to
implement two functions: `tileset_info` for returning the bounds and depth of
the dataset and `tiles(z,x,y)` for obtaining data at zoom level z, and position
x,y.

With these two functions, we can create multi-resolution displays for any
datatype. To get started, we've created a number of tile generators in the
[https://github.com/pkerpedjiev/hgtiles](https://github.com/pkerpedjiev/hgtiles)
repository.

<b> HiGlass Jupyter </b>

<div class="wp-caption alignleft" style="width: 275px">
	<div id="mandelbrot" style="height: 400px"></div>
	<p class="wp-caption-text">The Mandelbrot set can be rendered as a multiscale dataset. 
	Zooming, limited to 25 levels to avoid hitting floating point precision
	artifacts.</p>
</div>
<br />

There's no better way to experiment with code than to run it in an interactive
environment. The gold standard in exploratory programming in Python is the
Jupyter notebook. It lets you compose, modify and run snippets of code
interspersed with documentation and markdown-formatted text.  More than that,
it lets you immediately see and record the output of your code.  This is
invaluable for exploring data and quickly prototyping new code.

To avail ourselves of these opportunities, we created a version of HiGlass that
can be run directly within a Jupyter notebook
([https://github.com/pkerpedjiev/higlass-jupyter](https://github.com/pkerpedjiev/higlass-jupyter)).
We can now open up our large datasets and explore them directly within a
Jupyter notebook. Options that required UI interaction to change can be
specified in code and shared with collaborators. The only limitation was the
file type support coded into the HiGlass server. Because HiGlass began as a
viewer for genomic data, the server has support for a handful of genomics
related formats. But what about the mountains of other file, data and object
types that could be used to store large datasets? We needed something more
flexible, more accessible and more low level.

<b> Custom tile generation </b>


<link rel="stylesheet" href="https://unpkg.com/higlass@1.1.5/dist/styles/hglib.css" type="text/css">

<script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.1/pixi.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.32.1/react-bootstrap.min.js"></script>

<script src="https://unpkg.com/higlass@1.2.8/dist/hglib.js"></script>
<script src="{{ '/js/higlass-jupyter-notebook/index.js' | prepend: site.baseurl }}"></script>

<script>
</script>
