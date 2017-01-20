// =================================================================
// MARKER COUNT BANNER
// =================================================================
L.Control.MarkerCountBanner = L.Control.extend({
	onAdd: function(map) {
		this._div = L.DomUtil.create('div', 'marker-count-banner');
		return this._div;
	},
	
	setCount: function(count) {
		var text = count + ' Funde';
		if(count == 0)
			text = 'Keine Funde';
		else if(count == 1)
			text = 'Ein Fund';
			
		this._div.innerHTML = text + ' sichtbar.';
	}
});

L.control.markerCountBanner = function (options) {
	return new L.Control.MarkerCountBanner(options);
};


// =================================================================
// TOOLTIP TOGGLE BUTTON
// =================================================================
L.Control.TooltipToggle = L.Control.extend({
	options: {
		position: 'topright',
		labelShow: 'Show Tooltips',
		labelHide: 'Hide Tooltips',
		tooltipText: '',
		permanentVisibility: false
	},

	onAdd: function (map) {
		this._button = L.DomUtil.create('div', 'tooltip-toggle');	
		L.DomEvent.addListener(this._button, 'click', this.toggle, this);
		this._update();
		return this._button;
	},

	onRemove: function (map) {		
	},
	
	isOn: function() {
		return this.options.permanentVisibility;
	},
	
	toggle: function () {
		if(!this._map)
			return; 
		
		this.options.permanentVisibility = !this.options.permanentVisibility;		
		this._map.fire('tooltiptoggle');
		this._update();		
	},

	_update: function () {		
		this._button.innerHTML = 
			'<a href="javascript:void(0)" title="' + 
			this.options.tooltipText + 
			'">' +
			(this.options.permanentVisibility ? this.options.labelHide : this.options.labelShow) +
			'</a>';
	}
});

L.control.tooltipToggle = function (options) {
	return new L.Control.TooltipToggle(options);
};