This lightweight server needs to
implement two functions: `tileset_info` for returning the bounds and depth of
the dataset and `tiles(z,x,y)` for obtaining data at zoom level z, and position
x,y. Subsequent blog posts will describe this format in more detail, but f

With these two functions, we can create multi-resolution displays for any
datatype. To get started, we've created a number of tile generators in the
[https://github.com/pkerpedjiev/hgtiles](https://github.com/pkerpedjiev/hgtiles)
repository.

<b> HiGlass Jupyter </b>

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