(function () {
  farmOS.map.behaviors.asset_type_layers = {
    attach: function (instance) {

      // Check if there are asset type layers to add.
      if (drupalSettings.farm_map[instance.target].asset_type_layers !== undefined) {

        // Add layers for each area type.
        var layers = drupalSettings.farm_map[instance.target].asset_type_layers;
        Object.values(layers).reverse().forEach( layer => {

          // Determine if the layer should display full geometry or centroids.
          let geomType = 'full';
          let layerType = 'geojson';
          if (!!layer.cluster && layer.cluster) {
            geomType = 'centroid';
            layerType = 'cluster';
          }

          // Build a url to the asset type geojson, default to all.
          const assetType = layer.asset_type ?? 'all';
          const url = new URL('/assets/geojson/' + geomType + '/' + assetType, window.location.origin + drupalSettings.path.baseUrl);

          // Include provided filters.
          const filters = layer.filters ?? {};
          Object.entries(filters).forEach( ([key, value]) => {
            if (Array.isArray(value)) {
              for (let i = 0; i < value.length; i++) {
                url.searchParams.append(key + '[]', value[i]);
              }
            }
            else {
              url.searchParams.append(key, value);
            }
          });

          // Build the layer.
          var opts = {
            title: layer.label,
            url,
            color: layer.color,
          };

          // Add the group if specified.
          if (!!layer.group) {
            opts.group = layer.group;
          }

          var newLayer = instance.addLayer(layerType, opts);

          // If zoom is true, zoom to the layer vectors.
          // Do not zoom to cluster layers.
          if (layerType !== 'cluster' && layer.zoom !== undefined && layer.zoom) {
            var source = newLayer.getSource();
            source.on('change', function () {
              instance.zoomToVectors();
            });
          }
        });
      }

      // Load area details via AJAX when an area popup is displayed.
      instance.popup.on('farmOS-map.popup', function (event) {
        var link = event.target.element.querySelector('.ol-popup-name a');
        if (link) {
          var assetLink = link.getAttribute('href')
          var description = event.target.element.querySelector('.ol-popup-description');
          description.innerHTML = 'Loading asset details...';
          fetch(assetLink + '/map_popup')
            .then((response) => {
              return response.text();
            })
            .then((html) => {
              description.innerHTML = html;
              instance.popup.panIntoView();
            });
        }
      });
    }
  };
}());
