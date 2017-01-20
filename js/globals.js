var map;
var baselayer;
var marker_count_banner;
var show_all_initial = false;
var prev_tooltip_permanent = false;
var tooltip_toggle_btn = null;
var tooltip_toggle_thresholds = {
	maxMarkers : 100,
	minZoom: 22,
	maxScale: '5m'
}
var gallery_last_photo = null;
var gallery_increment = 100;
var basemap_info = {
	url_template: 'http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png',
	options: {
		maxZoom: 24
	},
	attribution: 'Aerial imagery &copy; <a href="http://escience.uni-tuebingen.de">eScience-Center</a> | Base map &copy; <a href="http://www.thunderforest.com/">Thunderforest</a> | Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap Contributors</a>'
};
var markers = [];
var markers_in_view = [];
var visible_markers_count = 0;
var view_state = null;
var highlighted_marker = null;
var marker_options = {
	selected: { radius: 13, weight: 5 },
	unselected: { radius: 8, weight: 2 }
};
var cur_filters = {
	'filter-fundnr': [],
	'filter-bereich': [],
	'filter-matgr': [],
	'filter-objekt': [],
	'filter-ware': [],
	'filter-datierung': []
};
var filter_map = {
	'filter-fundnr': 'fundnr',
	'filter-bereich': 'bereich',
	'filter-matgr': 'matgr_id',
	'filter-objekt': 'objekt_id',
	'filter-ware': {
		'fein_stat': 'ware_id',
		'grob_stat': 'ware_id'
	},
	'filter-datierung': {
		'fein_stat': 'datierung_id',
		'grob_stat': 'datierung_id'
	}
};
var highlight_border;
