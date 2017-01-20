$(window).on('resize', center_noshow);

//---------------------------------------------------------------------
$(document).ready(function() {
//---------------------------------------------------------------------
	integrate_funde();
	initialize_map();
	initialize_filter_boxes();
})

//---------------------------------------------------------------------
function integrate_funde() {
//---------------------------------------------------------------------
	// run only when any data changed
	// php/fundnr.php might also need to be updated
	return;

	for(var fundnr in funde) {
		var i;

		var fundfotos = [];
		for(i = 0; i < fotos.length; i++)
			fotos[i].fundnr == fundnr && fundfotos.push(fotos[i].fotonr);
		funde[fundnr].fotos = fundfotos;

		var feinkeramik = [];
		for(i = 0; i < fein_stat.length; i++)
			fein_stat[i].fundnr == fundnr && feinkeramik.push(fein_stat[i]);
		funde[fundnr].fein_stat = feinkeramik;

		var grobkeramik = [];
		for(i = 0; i < grob_stat.length; i++)
			grob_stat[i].fundnr == fundnr && grobkeramik.push(grob_stat[i]);
		funde[fundnr].grob_stat = grobkeramik;
	}

	console.log('var funde=' + JSON.stringify(funde) + ';');
}

//---------------------------------------------------------------------
function initialize_map() {
//---------------------------------------------------------------------
	map = L.map('map', {
		attributionControl: false
	});

	map.whenReady(function() {
		$('#busy').fadeOut('slow');
		$('body').removeClass('loading').removeClass('wait');
	});

	map.on('zoomend moveend resize', function() {
		update_markers_in_view(false);
	});

	map.on('tooltiptoggle', set_marker_tooltips);

	L.control.attribution({
		prefix: false
	}).addAttribution(basemap_info.attribution).addTo(map);

	L.control.scale({
		maxWidth: 200,
		metric: true,
		imperial: false,
		updateWhenIdle: true,
		position: 'bottomright'
	}).addTo(map);

	L.tileLayer(basemap_info.url_template, basemap_info.options).addTo(map);

	var sn33 = true;
	L.tileLayer.wms("https://escience-center.uni-tuebingen.de/geoserver/Al-Kashbah/wms", {
		maxZoom: basemap_info.options.maxZoom,
		layers: sn33? 'al-kashbah_a-h' : 'al-kashbah_ortho_a-h',
		format: 'image/png',
		transparent: true,
		version: '1.1.1'
	}).addTo(map);

	create_markers();

	if(!show_all_initial) {
		$('#no-show').show();
		center_noshow();
		$('#galerie-box').hide();
	}

	$('#logo').detach().appendTo($('#map'));
}

//---------------------------------------------------------------------
function get_view_state() {
//---------------------------------------------------------------------
	return JSON.stringify(map.getCenter()) + map.getZoom();
}

//---------------------------------------------------------------------
function show_hide_tooltip_toggle() {
//---------------------------------------------------------------------
	/*if(tooltip_toggle_btn !== null
	   && markers_in_view.length >= tooltip_toggle_thresholds.maxMarkers
	   && map.getZoom() < tooltip_toggle_thresholds.minZoom) */
	if(tooltip_toggle_btn !== null
	   && (markers_in_view.length == 0
		   || (markers_in_view.length >= tooltip_toggle_thresholds.maxMarkers
	   		   && map.getZoom() < tooltip_toggle_thresholds.minZoom)))
	{
		prev_tooltip_permanent = tooltip_toggle_btn.isOn(); // recall, so we can reactivate
		if(prev_tooltip_permanent)
			tooltip_toggle_btn.toggle(); // turn off permanent tooltips
		tooltip_toggle_btn.remove();
		tooltip_toggle_btn = null;
	}
	else if(tooltip_toggle_btn === null
			&& markers_in_view.length > 0
			&& (markers_in_view.length < tooltip_toggle_thresholds.maxMarkers
				|| map.getZoom() >= tooltip_toggle_thresholds.minZoom))
	{
		tooltip_toggle_btn = L.control.tooltipToggle({
			position: 'bottomright',
			labelShow: 'Fundnummern einblenden',
			labelHide: 'Fundnummern ausblenden',
			tooltipText: 'Fundnummern sind nur permanent einblendbar, wenn weniger als ' + tooltip_toggle_thresholds.maxMarkers +
					 ' Funde sichtbar sind oder wenn die Skala rechts unten maximal ' + tooltip_toggle_thresholds.maxScale + ' zeigt.',
			permanentVisibility: false
		}).addTo(map);

		// Conrad will das nicht wieder aktiviert haben. Siehe Email vom 27.10.2016
		/*if(prev_tooltip_permanent)
			tooltip_toggle_btn.toggle();*/
	}
}

//---------------------------------------------------------------------
function add_photos_to_gallery() {
//---------------------------------------------------------------------
	var start_from_scratch = !gallery_last_photo;

	if(start_from_scratch)
		gallery_last_photo = { marker: 0, photo: 0 };

	$('#load-more').remove();
	var foto_list = $('#galerie');
	var photos_added = 0;

	for(; gallery_last_photo.marker < markers_in_view.length; gallery_last_photo.marker++) {
		var fund = markers_in_view[gallery_last_photo.marker].options.fund;
		var fotos = fund.fotos;

		for(; gallery_last_photo.photo < fotos.length; gallery_last_photo.photo++) {
			var photo_file = 'assets/photos/' + fotos[gallery_last_photo.photo] + '.JPG';

			var img = $('<img/>').addClass('thumb small').attr({
				rel: 'group1',
				src: photo_file,
				'data-glisse-big': photo_file,
				'data-fundindex': gallery_last_photo.marker,
				title: fund.fundnr
			}).appendTo(foto_list);

			img.glisse({
				changeSpeed: 250,
				speed: 250,
				effect: 'bounce',
				fullscreen: false
			});

			img.contextmenu(function () {
				select_marker(markers_in_view[parseInt($(this).data('fundindex'))]);
				return false;
			});

			img.mouseover(function() {
				var marker = markers_in_view[parseInt($(this).data('fundindex'))];
				marker.fire('mouseover');
				marker.setStyle({ weight: marker_options.unselected.weight + 3 });
				marker.bringToFront();
			});

			img.mouseout(function() {
				var marker = markers_in_view[parseInt($(this).data('fundindex'))];
				marker.fire('mouseout');
				marker.setStyle({ weight: marker_options.unselected.weight });
			});

			photos_added++;

			if(photos_added >= gallery_increment)
				break;
		}

		if(photos_added >= gallery_increment) {
			// reached max increment
			gallery_last_photo.photo++; // remember next starting point
			if(gallery_last_photo.photo >= fotos.length) {
				gallery_last_photo.marker++;
				gallery_last_photo.photo = 0
			}
			if(gallery_last_photo.marker < markers_in_view.length) {
				foto_list.append($('<div/>').attr('id', 'load-more').html(
					'<a href="javascript:void(0)" onclick="gallery_load_more()">Weitere Bilder zeigen</a>'
				));
			}
			break;
		}
		else {
			// reset last photo seen index
			gallery_last_photo.photo = 0;
		}
	}

	if(start_from_scratch && photos_added == 0)
		foto_list.text('Für die im Kartenausschnitt sichtbaren Funde sind keine Bilder vorhanden.');
}

//---------------------------------------------------------------------
function gallery_load_more() {
//---------------------------------------------------------------------
	add_photos_to_gallery();
}

//---------------------------------------------------------------------
function update_photo_gallery() {
//---------------------------------------------------------------------
	$('#galerie').empty();
	$('#galerie-box').hide();
	gallery_last_photo = null;

	if(highlighted_marker !== null
	  || (!show_all_initial && visible_markers_count == 0))
	{
		return;
	}

	add_photos_to_gallery();
	$('#galerie-box').show();
}

//---------------------------------------------------------------------
function update_markers_in_view(force) {
//---------------------------------------------------------------------
	// see if anything changed to not do this twice
	if(!force && view_state === get_view_state())
		return;

	view_state = get_view_state();

	var prev_markers_in_view_str = markers_in_view.toString();

	setTimeout(function() {
		var bounds = map.getBounds();
		markers_in_view = [];

		for(var i = markers.length - 1; i >= 0; i--) {
			if(markers_in_view.length >= visible_markers_count)
				break;

			var m = markers[i];

			if(!m.options.visible)
				continue;

			if(bounds.contains(m.options.fund.coord))
				markers_in_view.push(m);
		}

		if(prev_markers_in_view_str === markers_in_view.toString())
			return; // nothing changed

		marker_count_banner.setCount(markers_in_view.length);

		show_hide_tooltip_toggle();

		if(tooltip_toggle_btn && tooltip_toggle_btn.isOn())
		   set_marker_tooltips(); // add perma marker to any marker that has become visible due to move or zoom

		update_photo_gallery();
	}, 0);
}

//---------------------------------------------------------------------
function set_marker_tooltips() {
//---------------------------------------------------------------------
	var perma = tooltip_toggle_btn && tooltip_toggle_btn.isOn();

	var set_of_markers = perma ? markers_in_view : markers;

	for(var i = set_of_markers.length - 1; i >= 0; i--) {
		var m = set_of_markers[i];

		var tooltip = m.getTooltip();
		if(tooltip) {
			if(perma == tooltip.options.permanent)
				continue;
			m.unbindTooltip();
		}

		m.bindTooltip(m.options.fund.fundnr, {
			permanent: perma,
			direction: 'top',
			className: 'custom-tooltip'
		});
	}
}

//---------------------------------------------------------------------
function check_zoom_to_filter() {
//---------------------------------------------------------------------
	if($('#zoom-to-filter').prop('checked')) {
		if(visible_markers_count == 0)
			return;

		var visible_markers = [];
		for(var i = markers.length - 1; i >= 0; i--) {
			if(visible_markers.length >= visible_markers_count)
				break;

			if(markers[i].options.visible)
				visible_markers.push(markers[i]);
		}

		map.fitBounds(L.featureGroup(visible_markers).getBounds().pad(.05));
	}
}

//---------------------------------------------------------------------
function create_markers() {
//---------------------------------------------------------------------
	var options = {
		radius: marker_options.unselected.radius,
		weight: marker_options.unselected.weight,
		opacity: 0.8,
		fillOpacity: 1
	};

	for(var fundnr in funde) {
		//if(funde[fundnr].fein_stat.length + funde[fundnr].grob_stat.length < 3) 			continue;
		//if(funde[fundnr].fotos.length == 0) 			continue;

		options.fund = funde[fundnr];
		options.fillColor = filter_matgr[options.fund.matgr_id - 1].bgColor;
		options.color = filter_matgr[options.fund.matgr_id - 1].color;
		//options.visible = true;
		options.visible = show_all_initial ? true : false;
		var marker = L.circleMarker(options.fund.coord, options);
		markers.push(marker);
	}

	visible_markers_count = show_all_initial ? markers.length : 0;

	var fg = L.featureGroup(markers);
	fg.on('click', marker_clicked);
	fg.on('mouseover', marker_mouseover);
	fg.on('mouseout', marker_mouseout);

	if(show_all_initial)
		fg.addTo(map);

	map.fitBounds(fg.getBounds());
	update_marker_count_display();
	update_markers_in_view(true);
	set_marker_tooltips();

	new L.Control.MiniMap(L.tileLayer(basemap_info.url_template), {
		toggleDisplay: true,
		position: 'bottomleft'
	}).addTo(map);

	marker_count_banner = L.control.markerCountBanner({
		position: 'bottomright'
	}).addTo(map);
}

//---------------------------------------------------------------------
function marker_mouseover(e) {
//---------------------------------------------------------------------
	e.layer.setStyle({
		weight: (
			e.layer == highlighted_marker ?
			marker_options.selected.weight + 3
			: marker_options.unselected.weight + 3
		)
	});
}

//---------------------------------------------------------------------
function marker_mouseout(e) {
//---------------------------------------------------------------------
	e.layer.setStyle({
		weight: (
			e.layer == highlighted_marker ?
			marker_options.selected.weight
			: marker_options.unselected.weight
		)
	});
}

//---------------------------------------------------------------------
function show_marker(m) {
//---------------------------------------------------------------------
	m.addTo(map);
	m.options.visible = true;
	visible_markers_count++;
}

//---------------------------------------------------------------------
function hide_marker(m) {
//---------------------------------------------------------------------
	if(m == highlighted_marker)
		unselect_marker(true);

	m.remove();
	m.options.visible = false;
	visible_markers_count--;
}

//---------------------------------------------------------------------
function get_matgr_colors(matgr) {
//---------------------------------------------------------------------
	for(var i = 0; i < filter_matgr.length; i++) {
		if(filter_matgr[i].text == matgr) {
			return filter_matgr[i];
		}
	}
}


//---------------------------------------------------------------------
function marker_clicked(e) {
//---------------------------------------------------------------------
	var marker = e.layer;
	var highlighted_marker_clicked = (marker == highlighted_marker);

	unselect_marker(highlighted_marker_clicked);

	if(highlighted_marker_clicked)
		return;

	select_marker(marker);
}

//---------------------------------------------------------------------
function select_marker(marker) {
//---------------------------------------------------------------------
	$('#galerie-box').hide();

	marker.bringToFront();

	var fund = marker.options.fund;
	var details_div = $('#details');

	// show fotos
	var foto_list = $('<div/>');
	for(var i = 0; i < fund.fotos.length; i++) {
		$('<img/>').addClass('thumb').attr({
			rel: fund.fundnr,
			src: 'assets/photos/' + fund.fotos[i] + '.JPG',
			'data-glisse-big': 'assets/photos/' + fund.fotos[i] + '.JPG',
			title: fund.fotos[i] + '.JPG'
		}).appendTo(foto_list);
	}
	$('#fotos').empty().append(foto_list);
	$('.thumb').glisse({
        changeSpeed: 250,
        speed: 250,
        effect: 'bounce',
        fullscreen: false
    });

	details_div.empty();
	details_div.append(
		$('<div/>').addClass('flatbutton').append(
			$('<span/>').text('🗙 Fundauswahl aufheben').on('click', function() {
				unselect_marker(true);
			})
		)
	);

	// set funddetails
	var map_fields = {
		fundnr: "Fundnr.",
		bereich: "Bereich",
		datum: "Funddatum",
		fsnr: "Fundstellennr.",
		hoehe: "Höhe",
		matgr: "Materialgruppe",
		objekt: "Objekt"
	};

	var table = $('<table/>').addClass('details-table');
	for(var prop in map_fields) {
		if(!map_fields.hasOwnProperty(prop))
			continue;

		var row = $('<tr/>');
		row.append($('<th/>').addClass('right').text(map_fields[prop]));
		var val = $('<td/>').addClass('grow').text(fund[prop]);
		if(prop == 'matgr') {
			var matgr_color = get_matgr_colors(fund[prop]);
			val.css({
				color: matgr_color.color,
				"background-color": matgr_color.bgColor
			});
		}
		row.append(val);
		table.append(row);
	}
	details_div.append(table);

	// wenn Keramik, guck nach Fein- und Grobstatistik
	num_feinstat = fund.fein_stat.length;
	if(num_feinstat > 0) {
		details_div.append($('<div/>').addClass('section-subhead').text("Feinstatistik"));
		table = $('<table/>').addClass('feinstat-table');
		var row = $('<tr/>');
		row.append($('<th/>').text('Nr.'));
		row.append($('<th/>').text('Erhaltungsform'));
		row.append($('<th/>').text('Ware'));
		row.append($('<th/>').text('Datierung'));
		table.append(row);

		for(var w = 0; w < num_feinstat; w++) {
			row = $('<tr/>');
			row.append($('<td/>').text(fund.fein_stat[w].scherbennr));
			row.append($('<td/>').text(fund.fein_stat[w].erhaltung));
			row.append($('<td/>').addClass('grow').text(fund.fein_stat[w].ware));
			row.append($('<td/>').text(fund.fein_stat[w].datierung));
			table.append(row);
		}
		details_div.append(table);
	}

	num_grobstat = fund.grob_stat.length;
	if(num_grobstat > 0) {
		details_div.append($('<div/>').addClass('section-subhead').text("Grobstatistik"));
		table = $('<table/>').addClass('grobstat-table');
		var row = $('<tr/>');
		row.append($('<th/>').text('Ware'));
		row.append($('<th/>').text('#'));
		row.append($('<th/>').text('Datierung'));
		table.append(row);

		for(var w = 0; w < num_grobstat; w++) {
			row = $('<tr/>');
			row.append($('<td/>').addClass('grow').text(fund.grob_stat[w].ware));
			row.append($('<td/>').text(fund.grob_stat[w].anz));
			row.append($('<td/>').text(fund.grob_stat[w].datierung));
			table.append(row);
		}
		details_div.append(table);
	}

	$('#details-box').show();

	highlighted_marker = marker;
	highlighted_marker.setStyle(marker_options.selected);
	marker.options.fund.fotos.length > 0 ? $('#fotos-box').show() : $('#fotos-box').hide();

	if(map.hasLayer(highlight_border))
		highlight_border.remove();

	highlight_border = L.circleMarker(marker.getLatLng(), {
		radius: marker_options.selected.radius + 3,
		color: 'white',
		weight: 3,
		fillOpacity: 0,
		opacity: .8,
		interactive: false
	}).addTo(map);
}

//---------------------------------------------------------------------
function unselect_marker(show_gallery) {
//---------------------------------------------------------------------
	$('#details-box').hide();
	$('#fotos-box').hide();

	if(highlighted_marker) {
		highlighted_marker.setStyle(marker_options.unselected);
		highlighted_marker = null;
		highlight_border.remove();
	}

	if(show_gallery)
		update_photo_gallery();
}

//---------------------------------------------------------------------
function total_filter_values_count() {
//---------------------------------------------------------------------
	var c = 0;
	for(var f in cur_filters)
		c += cur_filters[f].length;
	return c;
}

//---------------------------------------------------------------------
function update_marker_count_display() {
//---------------------------------------------------------------------
	var mc = '';
	var tot_filter_count = total_filter_values_count();

	if(tot_filter_count == 0) {
		if(show_all_initial)
			mc = 'Alle ' + visible_markers_count + ' Funde werden angezeigt. Benutzen Sie die folgenden Filter, um die Funde einzugrenzen:';
		else
			mc = 'Benutzen Sie die folgenden Filter, um die insgesamt ' + markers.length + ' Funde einzugrenzen und anzuzeigen:';
	}
	else {
		var filter_text = tot_filter_count > 1 ? 'diesen Filtern' : 'diesem Filter';

		if(visible_markers_count == 0)
			mc = 'Kein Fund entspricht ' + filter_text + '.';
		else if(visible_markers_count == 1)
			mc = 'Ein Fund entspricht ' + filter_text + '.';
		else {
			if(visible_markers_count == markers.length)
				mc += 'Alle ';
			mc += visible_markers_count + ' Funde entsprechen ' + filter_text + '.';
		}
	}

	$('#marker-count').text(mc);
}

//---------------------------------------------------------------------
function marker_matches_all_filters(fund) {
//---------------------------------------------------------------------
	for(var f in cur_filters) {
		if(!fund_matches_filter_val(fund, f))
			return false;
	}

	return true;
}

//---------------------------------------------------------------------
function fund_matches_filter_val(fund, filter_key) {
//---------------------------------------------------------------------
	if(cur_filters[filter_key].length == 0)
		return true;

	var filter_target = filter_map[filter_key];

	if(typeof filter_target === 'string') {
		// filter attribute is directly under fund, then we just check if values match
		return cur_filters[filter_key].indexOf(fund[filter_target]) != -1;
	}

	else {
		// else we need to check ware / datierung, if ANY of the ware or datierungen of the fund match
		for(var sub_key in filter_target) {
			for(var i = fund[sub_key].length - 1; i >= 0; i--)
				if(cur_filters[filter_key].indexOf(fund[sub_key][i][filter_target[sub_key]]) != -1)
					return true;
		}

		return false;
	}
}

//---------------------------------------------------------------------
function center_noshow() {
//---------------------------------------------------------------------
	var no_show = $('#no-show');
	var map_div = $('#map');
	var map_pos = map_div.position();
	var x = map_pos.left + map_div.innerWidth() / 2 - no_show.outerWidth() / 2;
	var y = map_pos.top + map_div.innerHeight() / 2 - no_show.outerHeight() / 2;
	no_show.css({ left: x, top: y, 'max-width': map_div.width() });
}

//---------------------------------------------------------------------
function filter_markers(changed_filter_box) {
//---------------------------------------------------------------------
	var filter_box = $('#' + changed_filter_box.id);
	var filter_val = filter_box.val();
	var prev_filter_total_count = total_filter_values_count();

	if(!show_all_initial) {
		var old_filter_val = cur_filters[changed_filter_box.id];
		cur_filters[changed_filter_box.id] = filter_val;
		var new_filter_total_count = total_filter_values_count();

		if(new_filter_total_count == 0) {
			// gone back to zero filters -> hide all markers
			for(var m = 0; m < markers.length; m++) {
				var marker = markers[m];
				if(marker.options.visible)
					hide_marker(marker);
			}

			$('#no-show').fadeIn();
			center_noshow();
			return;
		}
		else if(prev_filter_total_count == 0) {
			// we have our first filter -> show hidden ones that match
			for(var m = 0; m < markers.length; m++) {
				var marker = markers[m];
				if(fund_matches_filter_val(marker.options.fund, changed_filter_box.id))
					show_marker(marker);
			}
			$('#no-show').fadeOut();
			return;
		}

		cur_filters[changed_filter_box.id] = old_filter_val;
	}

	if(cur_filters[changed_filter_box.id].length == 0
	   && filter_val.length > 0)
	{
		// only if first filter set, we can simply check which visible markers to hide
		cur_filters[changed_filter_box.id] = filter_val;
		for(var m = 0; m < markers.length; m++) {
			var marker = markers[m];
			if(marker.options.visible) {
				if(!fund_matches_filter_val(marker.options.fund, changed_filter_box.id)) {
					hide_marker(marker);
				}
			}
		}
	}
	else if(prev_filter_total_count == cur_filters[changed_filter_box.id].length
		    && filter_val.length > cur_filters[changed_filter_box.id].length)
	{
		// else if this is/was the only filter and the non-empty filter was expanded,
		// we can simply check which hidden markers to show
		cur_filters[changed_filter_box.id] = filter_val;
		for(var m = 0; m < markers.length; m++) {
			var marker = markers[m];
			if(!marker.options.visible) {
				if(fund_matches_filter_val(marker.options.fund, changed_filter_box.id)) {
					show_marker(marker);
				}
			}
		}
	}
	else
	{
		// otherwise we need to to check all, since we do not know whether a marker is hidden because
		// of this filter or because of another filter
		cur_filters[changed_filter_box.id] = filter_val;
		cur_filter_count = total_filter_values_count();

		for(var m = 0; m < markers.length; m++) {
			var marker = markers[m];

			var match = (cur_filter_count == 0
						 || marker_matches_all_filters(marker.options.fund));

			if(match && !marker.options.visible) {
				show_marker(marker);
			}
			else if(!match && marker.options.visible) {
				hide_marker(marker);
			}
		}
	}
}

//---------------------------------------------------------------------
function initialize_filter_boxes() {
//---------------------------------------------------------------------
	$('#zoom-to-filter').on('click', check_zoom_to_filter);

	var filterbox_ware = $('#filter-ware');
	var filterbox_datierung = $('#filter-datierung');

	$('#filter-fundnr').select2({
		language: 'de',
		placeholder: 'Fundnummer suchen',
		multiple: true,
		minimumInputLength: 3,
		ajax: {
			url: 'php/fundnr.php',
			data: function (params) {
				return { q: params.term };
			},
			processResults: function (data) {
				return { results: data };
			}
		}
	});

	$('#filter-bereich').select2({
		language: 'de',
		placeholder: 'Bereich filtern',
		multiple: true,
		data: filter_bereich
	});

	var matrgr_filter_box = $('#filter-matgr');
	matrgr_filter_box.select2({
		language: 'de',
		placeholder: 'Materialgruppe filtern',
		multiple: true,
		data: filter_matgr
	}).on('change', function() {
		// color tag
		matrgr_filter_box.next('span.select2').find('.select2-selection__choice').each(function (e) {
			var tag = $(this);
			var matgr_color = get_matgr_colors(tag.attr('title'));

			tag.css({
				color: matgr_color.color,
				"background-color": matgr_color.bgColor
			});
		});
	}).on('select2:open', function() {
		// set color for materialgruppen
		setTimeout(function() {
			$('span.select2-results ul li').each(function () {
			//$('#select2-filter-matgr-results li').each(function () {
				var title = $(this).text();
				var matgr_color = get_matgr_colors(title);
				$(this).css({
					color: matgr_color.color,
					"background-color": matgr_color.bgColor
				});
			});
		}, 1);
	});

	var filterbox_objekt = $('#filter-objekt');
	filterbox_objekt.select2({
		language: 'de',
		placeholder: 'Objekt filtern',
		multiple: true,
		data: filter_objekt
	});

	filterbox_ware.select2({
		language: 'de',
		placeholder: 'Keramik: Ware filtern',
		multiple: true,
		data: filter_ware
	});

	filterbox_datierung.select2({
		language: 'de',
		placeholder: 'Keramik: Datierung filtern',
		multiple: true,
		data: filter_datierung
	});

	$('select').on('change', function (e) {
		$('body').addClass('wait');

		setTimeout(function() {
			filter_markers(e.target);
			update_marker_count_display();

			if(visible_markers_count == 1) {
				for(var i = markers.length - 1; i >= 0; i--) {
					if(markers[i].options.visible) {
						select_marker(markers[i]);
						map.panTo(markers[i].options.fund.coord, {
							animate: true,
							duration: 0.75
						});
						break;
					}
				}
			}

			check_zoom_to_filter();
			update_markers_in_view(true);

			// make sure the highlighted marker is still visible
			if(highlighted_marker)
				highlighted_marker.bringToFront();

			if(e.target.id == 'filter-matgr') {
				var cur_matgr_filter = matrgr_filter_box.val();

				// show/hide ware und datierung wenn keramik gewählt/nicht gewählt
				if(cur_matgr_filter.indexOf('3') != -1 && !filterbox_ware.is(':visible')) {
					// show ware/datierung
					filterbox_ware.parent().fadeIn();
					filterbox_datierung.parent().fadeIn();
				}
				else if(cur_matgr_filter.indexOf('3') == -1 && filterbox_ware.is(':visible')) {
					// hide ware/datierung
					filterbox_ware.parent().fadeOut();
					filterbox_datierung.parent().fadeOut();
					if(cur_filters['filter-ware'].length > 0)
						filterbox_ware.val(null).trigger('change');
					if(cur_filters['filter-datierung'].length > 0)
						filterbox_datierung.val(null).trigger('change');
				}

				// store current filter
				var cur_obj_filter = filterbox_objekt.val();

				// update objekt Filter based on Matgr
				if(cur_matgr_filter.length > 0) {
					// build filter data
					var obj_added = [];
					var filter_data = [];
					for(var i = 0; i < cur_matgr_filter.length; i++) {
						for(var j = 0; j < matgr_obj_map.length; j++) {
							if(parseInt(cur_matgr_filter[i]) == matgr_obj_map[j][0]
							  && obj_added.indexOf(matgr_obj_map[j][1]) == -1)
							{
								obj_added.push(matgr_obj_map[j][1]);
								filter_data.push({id: matgr_obj_map[j][1], text: matgr_obj_map[j][2]});
							}
						}
					}

					// adjust previous filter
					for(var i = cur_obj_filter.length - 1; i >= 0; i--) {
						if(obj_added.indexOf(parseInt(cur_obj_filter[i])) == -1)
							cur_obj_filter.splice(i, 1);
					}

					filterbox_objekt.html('');

					filter_data.sort(function(a,b) { return a.id - b.id });
					// set filter data
					$(filter_data).each(function(k, o) {
						filterbox_objekt.append($("<option/>").attr("value", o.id).html(o.text));
					});

					// restore filter
					filterbox_objekt.val(cur_obj_filter).change();
				}
				else {
					filterbox_objekt.html('');
					$(filter_objekt).each(function(k, o) {
						filterbox_objekt.append($('<option/>').attr('value', o.id).text(o.text));
					});
					filterbox_objekt.val(cur_obj_filter).change();
				}
			}

			$('body').removeClass('wait');
		}, 1);
	}).on('select2:unselect', function(e) {
		// Prevent auto popup when removing a filter
		// Credit to GitHub user kevin-brown:
		// https://github.com/select2/select2/issues/3209#issuecomment-149663474
		if(!e.params.originalEvent)
			return;
		e.params.originalEvent.stopPropagation();
	});

	filterbox_ware.parent().hide();
	filterbox_datierung.parent().hide();
}
