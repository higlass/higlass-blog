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

* **z** - the zoom level (scale) at which we are viewing the map
* **x** - the x position of the "tile"
* **y** - the y position of the "tile"

In a typical map, there are 19 zoom levels. The lowest, 0, contains a single tile
which covers the entire world. The next zoom level, 1, contains 4 tiles. Each
one a quarter of the area of the previous one. The highest zoom level, 19,
contains 4 ^ 19 tiles. Which tiles are loaded at any given time depends on
the scale and the location of the map. Typically, only a handful of tiles are
loaded at any given time. By limiting the amount of data contained in each tile
and the number of tiles visible at any given time, we effectively limit the
amount of data that needs to be loaded and rendered.


<div class="wp-caption alignleft" style="width: 550px; margin-bottom: 15px">
	<div id="maps-and-tiles" style="height: 300px"> </div>
	<p class="wp-caption-text">Online maps are rendered by retrieving and stitching
	together small images called *tiles*. The view on the right shows the tiles that
	make up the zoomable map on the left.</p>
</div>

This technique makes it possible to access terabyte-scale datasets on hardware
as basic as a mobile phone. Can we learn from this approach and apply it to 
other types of data? We certainly can. It just requires defining and implementing
two operations on a set of data:

1. Downsampling
2. Slicing

With these two operations, we can create maps-like displays for any two (or one)
dimensional data, regardless of its size.

## Hi-C contact matrices

<div class="wp-caption alignright" style="width: 275px; margin-bottom: 15px">
	<div id="three-heatmaps" style="height: 600px"></div>
	<p class="wp-caption-text">Figure 2: A Hi-C contact matrix shown at three
	different scales highlighting chromosomes (top), compartments (middle) and
	TADs and loops (bottom).</p>
</div>

Until recently, there were few datasets that were too large to
display at once, worth viewing in the their entirety and relevant at multiple
scales. Maps, of course, are one. Genomes are another. The human genome is 
over 3 billion base pairs long. If stretched end to end it would span nearly
two meters. In each cell of the human body, it is exquisitely packed into a 
nucleus that is roughly 10 micrometers across (depending on the cell). That
is the equivalent of packing a 50 mile long string into a volume roughly the
size of a basketball. Needless to say, it's a snug fit.

The question that, through a long and winding journey, led to this blog post
is "what is the shape of DNA inside the nucleus of a cell?". To answer this 
question, a number of research groups perform what are known as Hi-C assays.
These assays survey which parts of the genome are in contact with each other.
The results come in the form of a matrix. On one axis is the genome and on 
the other, the same genome. Each cell contains a *count* of how many times
the assay "caught" those two portions of the genome in close proximity to
each other. To make things statistically simpler, each "portion" of the genome
is a segment one thousand nucleotides in length. So in the end, we end up
with a 3 million x 3 million matrix describing how the DNA is folded within 
the nucleus. If you took this matrix and plotted it, you would see chromosomes,
compartments and TADs, all at different scales. But how does one plot a 
3 million by 3 million matrix?

## Downsampling and slicing

With current technology, there is simply no way to plot a 3 million x 3 million
matrix at once. To do so would require an monitor the size of the empire state
building. But we don't have to plot it once. We can be like maps and only show
what is relevant given the scale and location. As we mentioned earlier, this 
requires the ability to downsample and slice. When zoomed out, we want to see
a downsampled data such that each cell represents more than the original one
thousand base pairs. When zoomed in, we want to see the subset of data that is
visible in the viewport.

With a matrix, these operations are simple. Downsampling can be done
by summing adjacent cells of the matrix: 

```python
>>> import numpy as np
>>> a = np.array([[1,2,3,4],
		  [5,6,7,8],
		  [9,10,11,12],
		  [13,14,15,16]])
>>> b = np.nansum(a.reshape((a.shape[0],-1,2)), axis=2)
>>> b
array([[ 3,  7],
       [11, 15],
       [19, 23],
       [27, 31]])
>>> c = np.nansum(b.T.reshape(b.shape[1], -1, 2), axis=2).T
>>> c
array([[14, 22],
       [46, 54]])
```

And slicing can be done by, well, slicing the matrix:

```python
>>> a[2:4,2:4]
array([[11, 12],
       [15, 16]])
```

## Tiling

With downsampling and slicing functions, we're ready to generate tiles. The
zoom level of each tile corresponds to the level of downsampling of the original
data. If we follow the example of online maps, the lowest zoom level, 0, will
contain the entire matrix. The highest zoom level, 14, in our case will contain
the original data. All the zoom levels in between will contain data at resolutions
which are powers of two multiples of the original resolution. 
So zoom level 14 will contain data
at 1Kb resolution, zoom level 13 will contain data at 2Kb resolution, zoom level
12 at 4Kb, etc. If we know the original resolution of our data, we can calculate
the number of zoom levels required to end up with one tile at the lowest resolution:

```python
bins_per_tile = 256 	# the default, but can be set to anything
base_resolution = 1000  # 1Kb data coming in

tilesize = bins_per_tile * base_resolution
n_tiles = math.ceil(datasize / tilesize)

max_zoom = int(np.ceil(np.log2(n_tiles)))
```
So if our dataset has 3 billion rows and columns, then `max_zoom` will be 14.

Slicing data from the data matrix requires determining which rows and columns should
be included in the tile.

```
tile_width = 2 ** (max_zoom - z) * bins_per_dimension

x_start = tile_x * tile_width
y_start = tile_y * tile_width

x_end = min(matrix.shape[0], x_start + tile_width)
y_end = min(matrix.shape[1], y_start + tile_width)

raw_tile = matrix[x_start:x_end,y_start:y_end]
```

And because this function is operating on the original, unaggregated, data and
`tile_width` could be large we need to apply our downsampling aggregation function:

```
num_to_sum = 2 ** (max_zoom - z)
downsampled_tile = (np.nansum(
	raw_tile.T.reshape(raw_tile.shape[1],-1,num_to_sum),
	axis=2).T)
```

Note that for larger datasets, such as our Hi-C matrices, we pre-downsample
the data for each zoom level so when a request hits the server, we can just
quickly look up and retrieve the data for that zoom level.

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

This data spans over 3 billion base pairs. At the highest resolution, each
pixel represents the number of contacts between two 1 kilo-base regions of the
genome. The data is is pre-aggregated at 14 levels of resolution and stored on
disk as HDF5 matrices according to the schema defined by the  [cooler
format](http://github.com/mirnylab/cooler). The server, running on an AWS EC2
instance, fulfills each client tile request by slicing out the relevant region
and returning it as a JSON object containing a base64 formatted string.
Combining tile extraction with a caching server leads to 99% of responses
being generated in less than 100ms. With a good internet connection, this
makes for a fast, responsive user  experience when browsing the data.



<h2>Tiling other types of data</h2>

The example set by online maps can be adopted by nearly any other spatial-like
data. As long as we can downsample our data and partition it into tiles, we
can create a server component to power HiGlass. The previous example showed
how matrices can be downsampled and decomposed into tiles. In this section we
will demonstrate how we can use a generic function to generate tiles for
HiGlass.

<div class="wp-caption alignleft" style="width: 275px">
    <div id="mandelbrot" style="height: 400px"></div>
    <p class="wp-caption-text">The Mandelbrot set can be rendered as a multiscale dataset. 
    Zooming, limited to 25 levels to avoid hitting floating point precision
    artifacts. <a href="http://higlass.io/app/?config=X36M4xrtS3iPFCp7cFigUQ">[fullscreen]</a></p>
</div>
<br />

According to Wikipedia, "The Mandelbrot set is the set of complex numbers $c$
for which the function $f_{c}(z)=z^{2}+c$ does not diverge
when iterated from $z=0$, i.e., for which the sequence  $f_{c}(0)$, 
$f_{c}(f_{c}(0))$, etc., remains bounded in absolute value." The essence of
this definition is that for any complex number, $c$, we can calculate whether
it is part of the Mandelbrot set by iteratively applying $f_{c}$. Furthermore,
for any complex number $c$, we can calculate how many times (i.e. iterations)
we need to apply $f_{c}$ before the absolute value of $c$ exceeds a certain
threshold (e.g. 2). Because a complex number can be represented by two components,
the real and the imaginary, any pixel with a $x$ and
the $y$ value can be used to represent a complex number. By counting the number
of iterations it takes to exceed the threshold we can calculate a color for 
each pixel and render the traditional Mandelbrot set (Figure 3).

So what about zooming? If we assign scales to the x- and y- axes of a figure
and modify them as the user zooms in and out, then we can partition the figure
into a grid of (x,y) pairs and iteratively calculate $f_{c}$ on the coordinates of
each cell in the grid. As we zoom in, the granularity of the grid increases,
the distance between cells shrinks and we have to recalculate the $f_{c}$ on
the new grid. Using the tile-based approach described above, we can divide our
grid into 256x256 tiles and offload the calculations to the server (AWS Lambda
code available [as a gist here](https://gist.github.com/pkerpedjiev/567cb2d2879d66f1e862d4d28c33f418)).
**With a server-side tile API, we can use the standard HiGlass
heatmap track to view the Mandelbrot set at multiple levels of resolution
without having to pre-calculate anything or do heavy processing on the
client**. Interestingly, in this case, while we are taking slices of a window,
we don't have the highest resolution data. So instead of downsampling, we rely
on a form of upsampling to calculate a higher resolution rendering of a smaller
region.

<h2>Summary</h2>

The three examples presented: online maps, large matrices, and the Mandelbrot
set demonstrate three separate use cases where classical z, x, y indexed
tiling can be used to display datasets far too large to display at once. By
down/up-sampling and slicing, we can provide the client with only the data
that it needs to display at the current zoom level and location. By using a
generic front end renderer and tile fetcher like HiGlass, we can use different
server implementation to provision it with manageable chunks of data to view.




<link rel="stylesheet" href="https://unpkg.com/higlass@1.1.5/dist/styles/hglib.css" type="text/css">

<script crossorigin src="https://unpkg.com/react@16/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.1/pixi.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-bootstrap/0.32.1/react-bootstrap.min.js"></script>

<script src="https://unpkg.com/higlass@1.2.8/dist/hglib.js"></script>
<script src="{{ '/js/higlass-jupyter-notebook/index.js' | prepend: site.baseurl }}"></script>

<script>
</script>
