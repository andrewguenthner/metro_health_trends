metro_health_trends provides a unique way of visualizing health trends across 
space and time in United States metropolitan areas.  

The site uses d3.js to construct a combination of dynamic map and chart graphics, 
which the user is free to explore.  The site is designed to be self-guiding.

Requirements:
Visitng the site only requires that Javascript is enabled and that a browser with 
support for most features of ES6 (const, let, and arrow functions) is used. An 
active Internet connection is needed to import the Bootstrap and d3 Javascript 
libraries.

Reproducing the data pre-processing requires running Jupyter Notebook in an 
environment with Numpy (1.16), Pandas (0.24), SciPy (1.2), and scikit-learn (0.21).
IMPORTANT NOTE:  The "native" Jupyter notebook kernel on Windows only supports 
Pandas 0.23.  The notebook makes use of the pandas "to_flat_index" function which is 
only available in Pandas 0.24.  For Windows, it may be necessary to install a tool 
such as nb_conda_kernels if using conda for environment management.  The notebook 
will take one csv source file downloaded from the CDC website and produce the remainder 
of the csv files needed (note the site also needs a json file to draw the US map; 
this file must be copied to the "data" directory if re-installing the source files,
the notebook will not create it).  Complete info is found in the notebook. 

The repository provides a website template and a set of pre-processed data files 
for data.  The repository also provides the raw data files as well as a Jupyter 
Notebook for reporducing the data pre-processing from the source (the source url 
is provided in the notebook).  

The site has three main pages:  the landing page (index.html) provides the main 
visualization tool.  A second summary page (summary.html) provides additional 
summary visualizations.  A third "about" page (about.html) provides a thorough 
description of the data sources, tools used, rationale, and a quick guide for 
understanding how to best use the tool, as well as illustrating some limitations 
of the tool in its current form.  

The pre-processed data files that the site uses include US state file data 
(gz_2010_us_040_00_20m.json), and three of the csv files (BRFSS_2011_to_2017.csv, 
location_data.csv, and trend_data.csv).  The remaining files are intermediate tables 
which may be useful if database rather than static storage is desired, or if there 
are issues with making the entire notebook work requiring processing in stages, 
but these files are not required by the site.  

Requierments for a minimal runtime environment for data pre-processing are provided 
in the requirements.txt file.  These requirements assume that you can successfully 
access your system environment in a Jupyter notebook, which may require additional 
libraries for some operating systems.  

Auxiliary files for the website are found in the "static" folder, including "app.js" 
for running the main page, "summary-app.js" for generating the graphics on the 
summary page, and the imported "colorbar.js" library.  Some of the items do require 
CSS styling, via the "styles.css" file in the "css" sub-folder.  The "images" folder 
contains an optional image of me for the site mavbar.  

Design considerations:
The Javascript is by no means optimized, but even so the site runs quickly.  

The desired product is a combined spatial and temporal viscualization tool for 
BRFSS data.  There are two sub-requirements to make the tool work well.  
1) Integrated views in space and time that are convenient for the user, and 
2) dealing with the size of the data.  

For 1), we use a map linked to a set of chart tiles.  The map displays a projection 
of the US, with metro areas as circles.  These are large enough to click on and to 
effectively display color, however, some trade-offs are needed in order to prevent 
too much overlap.  To deal with small screens, the pixel size of the circles is 
fixed, this makes overlap worse on small screens but testing showed the tool was 
still quite useable.  Another issue is that users need a means of identifying 
specific metros by name; this is addressed by usage of a tooltip.  The tooltip size 
is kept constant, making it somewhat obtrusive on small screens, but this is 
needed to preserve readability on small screens.  

A click of a cirlce on the map will bring up time-series data for the selected 
metro area.  The BRFSS has dozens of indicators, which are reduced to ten key 
ones.  Even so, this is too many graphs to display on one screen, especially if 
it a small screen.  To address this, the data is grouped into two sets of five 
indicators.  One set covers behaviors (smoking, drinking, etc.), the other 
covers health-related outcomes that are risk factors (diabetes, hypertension).  
A radio-button interface lets the user toggle between them.  Each graph has 
clickable data points and a clickable button for comparing trends.  If a data 
point is chosen, the map is populated with a chloropleth-type display of the 
selected indicator (e.g. smoking prevalence in 2013) for each metro.  This 
allows for spatial comparisons.  If the user clicks on the "compare trends" button 
(one per graph), a multi-category color scheme with a legend is displayed.  
This scheme shows trends as classes -- the data pre-processing automatically 
assigns one of seven trend types.  The user can then see the spatial pattern 
of colors while using the colors themselves to infer the pattern across time. 

The page layout for this system is somewhat challenging.  To preserve map and 
chart readability, the map occupies 2/3 x 2/3 of the screen area, with the five 
charts occupying about 1/3 x 1/3.  Bootstrap can be used with some CSS tweaks 
to make this type of grid, but on window resize, bootstrap will move the elements 
and break the grid.  To deal with this, the screen must be re-drawn on resize.  
Another option is to drop Bootstrap in favor of a table cell type layout, but this 
makes sizing for the selected viewport much more challenging for the other page 
elements.  To keep the charts and map readable in a dynamically-sized browser 
window, the d3 text elements, chart margins, etc. are computed as viewport-
dependent responsive functions.  

Although Javascript can render the data quickly, the BRFSS data set is quite 
large (the basic download is about 120,000 lines of data in a single csv), so 
having the clinet do all of the processing on load would likely slow down the 
rendering substantially.  Fortunately, by focusing on only ten questions, pre-
computing line fits and trend parameters, and pre-classifying trends, the 
final data set can be reduced to an array of about 30 parameters for each of 
about 250 metros.  These data sources can be loaded quickly.  US state shape 
data is also required.  The use of a lower resolution (20m) file provides for a 
small enough footprint that data loading can be accomplished quickly. 

Because d3 v5 uses asynchronous loading, the incorporation of the three external 
data sets in the main page requires some composition of chained asynchronous 
functions.  To avoid having to repeatedly import data on window resize, the 
data sets, once processed by the Javascript file, are stored and used to 
redraw the page synchronously on resize.  

The summary page is in principle much simpler to handle.  The bar graphs 
can be drawn by d3 with a single asynchronous import of a csv file with just 
seven rows and eleven columns.  For this reason, a separate re-draw function is 
not provided -- if the user resizes the window, the small csv file is just 
re-loaded.  

To accommadate a broad base of users, the pages have been made with features 
friendly to the visually impaired.  Text sizes are kept large, and color sets 
are designed to be colorblind-friendly.  Some ARIA features are incorporated, 
however the main visualization has not been converted to an ARIA friendly format.

The data pre-processing pipeline is designed to filter the data set to find the 
questions of interest, then reassemble these into a smaller table form.  As a 
preparation for potential use of database storage, database-style tables are also 
generated.  Once the tabular data is prepared, the pipeline will automatically 
fit linear and quadratic models using scikit learn with statistical inferrence 
provided by a hand-coded ANOVA.  Because the CDC data is provided in a non-standard 
form, the ANOVA has to be done without the aid of standard packages.  The notebook 
explains how this is done.  The notebook also automatically generates the trend 
classifications, which are described in detail in the "about.html" document and 
in the notebook.  Once this is done, the results are appended to the main data 
table.  A separate table is also prepared for the "summary.html" page so that 
only the data needed for this page is loaded.  