/* globals Chart:false, feather:false */
sigma.utils.pkg('sigma.canvas.nodes');
sigma.canvas.nodes.image = (function() {
  var _cache = {},
      _loading = {},
      _callbacks = {};

  // Return the renderer itself:
  var renderer = function(node, context, settings) {
    var args = arguments,
        prefix = settings('prefix') || '',
        size = node[prefix + 'size'],
        color = node.color || settings('defaultNodeColor'),
        url = node.url;

    if (_cache[url]) {
      context.save();

      // Draw the clipping disc:
      context.beginPath();
      context.arc(
        node[prefix + 'x'],
        node[prefix + 'y'],
        node[prefix + 'size'],
        0,
        Math.PI * 2,
        true
      );
      context.closePath();
      context.clip();

      // Draw the image
      context.drawImage(
        _cache[url],
        node[prefix + 'x'] - size,
        node[prefix + 'y'] - size,
        2 * size,
        2 * size
      );

      // Quit the "clipping mode":
      context.restore();

      // Draw the border:
      context.beginPath();
      context.arc(
        node[prefix + 'x'],
        node[prefix + 'y'],
        node[prefix + 'size'],
        0,
        Math.PI * 2,
        true
      );
      context.lineWidth = size / 10;
      context.strokeStyle = node.color || settings('defaultNodeColor');
      context.stroke();
    } else {
      sigma.canvas.nodes.image.cache(url);
      sigma.canvas.nodes.def.apply(
        sigma.canvas.nodes,
        args
      );
    }
  };

  // Let's add a public method to cache images, to make it possible to
  // preload images before the initial rendering:
  renderer.cache = function(url, callback) {
    if (callback)
      _callbacks[url] = callback;

    if (_loading[url])
      return;

    var img = new Image();

    img.onload = function() {
      _loading[url] = false;
      _cache[url] = img;

      if (_callbacks[url]) {
        _callbacks[url].call(this, img);
        delete _callbacks[url];
      }
    };

    _loading[url] = true;
    img.src = url;
  };

  return renderer;
})();

(function ($) {
  $.fn.serializeFormJSON = function () {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function () {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};})(jQuery);

(function () {
  'use strict'

  // NAVIGATION
  function checkProgress(){
    // Page 1 Status
    if (schema.globals.api_key && schema.globals.site && schema.globals.env) {
      $('#page-1-next').prop('disabled', false)
    } else {
      $('#page-1-next').prop('disabled', true)
    }
    $(".env-name").text(schema.globals.env);


    $("#dd-service-map").attr('href', 'https://app.datadoghq.com/apm/map?env='+schema.globals.env)

    // Page 2 Status
    if (Object.keys(schema.services).length) {
      $('#page-2-next').prop('disabled', false)
    } else {
      $('#page-2-next').prop('disabled', true)
    }
  }
  $('#page-1-next').on("click", function(){
    $('#page-1').addClass("d-none")
    startPage2()
  })
  $('#page-2-back').on("click", function(){
    $('#page-1').removeClass("d-none")
  })
  $('#page-2-next').on("click", function(){
    $('#page-2').addClass("d-none")
    startPage3()
  })
  $('#page-3-back').on("click", function(){
    $('#page-2').removeClass("d-none")
  })
  $('#page-3-next').on("click", function(){
    $('#page-3').addClass("d-none")
  })

  // GLOBAL SCHEMA OBJECT
  var schema = {};
  function updateSchema(){
    var services = []
    for (var a=0; a<s.graph.nodes().length; a++){
      services.push(s.graph.nodes()[a].data);
    }
    schema.services = services
    $('#schema').text( JSON.stringify(schema, null, 2) );
  }

  // Page 1 - Globals
  var set_project = $('#project_form').serializeFormJSON();
  $('#project_settings').text( JSON.stringify(set_project, null, 2) )
  $('#project_logo_placeholder').attr('src', set_project.logo)
  $('#project_form').on("change",function(e){
    e.preventDefault();
    var data = $(this).serializeFormJSON();
    schema.globals = data;
    updateSchema();

    $('#project_settings').text( JSON.stringify(schema, null, 2) )
    $('#project_logo_placeholder').attr('src', data.logo)

    checkProgress();
  });
  var s, g = {
        nodes: [],
        edges: []
      };

  // Then, wait for all images to be loaded before instanciating sigma:
  s = new sigma({
    graph: g,
    renderer: {
      // IMPORTANT:
      // This works only with the canvas renderer, so the
      // renderer type set as "canvas" is necessary here.
      container: document.getElementById('graph-container'),
      type: 'canvas'
    },
    settings: {
      enableHovering: false,
      minNodeSize: 16,
      maxNodeSize: 16,
      edgeLabelSize: 'proportional'
    }
  });
  s.refresh();

  // Page 2 - Services
  function startPage2() {
    s.refresh();
    // Toggle Node Editor - Close
    $('.node-editor-pane .close').on('click', function(e){
      e.preventDefault();
      $('.node-editor-pane').addClass('out');
    });
    s.bind('clickStage', function() {
      $('.node-editor-pane').addClass('out');
    });

    // Initialize the dragNodes plugin:
    var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);
    dragListener.bind('startdrag', function(event) {
      console.log(event);
    });
    dragListener.bind('drag', function(event) {
      console.log(event);
    });
    dragListener.bind('drop', function(event) {
      console.log(event);
    });
    dragListener.bind('dragend', function(event) {
      console.log(event);
    });
    // Toggle Node Editor - Click Node to Enable
    s.bind("clickNode", function(e){
      console.log(e.data.node.data);
      var node_data = e.data.node.data;

      $('.node-editor-pane').removeClass('out');

      $('#node-edit').html('');

      var form = '\
        <div class="form-group">\
          <label>Service Name</label>\
          <input name="service_name" type="text" class="form-control" value="'+node_data['service_name']+'">\
        </div>\
        <div class="form-group">\
          <label>Service Port</label>\
          <input name="service_port" type="number" class="form-control" value="'+node_data['service_port']+'">\
        </div>';

        // Only allow connections from web services
        if (node_data['template_type'] == "web"){
          form += '<div class="form-group">\
            <label>Connects To</label>\
            <select name="connects" class="form-control" multiple value="'+node_data['connects']+'">\
              <option value="" ';
              form += (node_data['connects'] == "") ? 'selected="selected">' : '>';
              form += 'N/A</option>';
            for (var a=0; a<s.graph.nodes().length; a++){
              if (s.graph.nodes()[a].id !== node_data['service_id']) {
                var selected = (node_data['connects'].includes(s.graph.nodes()[a].id)) ? true : false;
                form += '<option value="'+s.graph.nodes()[a].id+'" ';
                form += (selected) ? ' selected="selected"' : '';
                form += '>';
                form += s.graph.nodes()[a].label+'</option>';
              }
            }
            form += '\
            </select>\
          </div>';

          // Handle website templates
          if (node_data['template_name'] == "website"){
            form += '\
              <div class="form-group resource">\
                <label>Template</label>\
                <select name="template" class="form-control text-capitalize" value="'+node_data['config']['template']+'">';
                  var templates = ["bank","cargo","estore","travel"];
                  for (var a=0; a<templates.length; a++){
                    var selected = (node_data['config']['template'] == templates[a]) ? true : false;
                    form += '<option value="'+templates[a]+'" ';
                    form += (selected) ? ' selected="selected"' : '';
                    form += '>';
                    form += templates[a]+'</option>';
                  }
                form += '\
                </select>\
              </div>';
          }

          // Handle Resource URLs
          var resource_n = 4;
          for (var a=0; a<resource_n; a++){
            var url = (typeof node_data['config']['resources'][a] == 'undefined' || '') ? 'url'+a : node_data['config']['resources'][a];
            form += '\
              <div class="form-group resource">\
                <label>URL #'+(a+1)+'</label>\
                <div class="input-group">\
                  <div class="input-group-prepend">\
                    <div class="input-group-text">/</div>\
                  </div>\
                  <input name="resources[]" type="text" class="form-control" value="'+url+'">\
                </div>\
              </div>';
          }
        }

        form += '<div class="d-flex justify-content-between">\
          <button id="delete-service" data-id="'+node_data['service_id']+'" class="btn btn-link text-danger" type="button">Remove</button>\
          <button id="update-service" data-id="'+node_data['service_id']+'" class="btn btn-secondary" type="submit">Update</button>\
        </div>';
      $('#node-edit').append( form )

      $("#delete-service").on("click",function(e){
        e.preventDefault();
        console.log("deleting..."+$(this).data("id"));
        s.graph.dropNode($(this).data("id"));
        $('.node-editor-pane').addClass('out');
        updateSchema();
        s.refresh();
      });
      Object.keys(node_data).forEach(function(key) {
        // console.log(key + ' ' + node_data[key]);
        var el = '\
        <div class="form-group">\
          <label>'+key+'</label>\
          <input name="name" type="text" class="form-control" value="'+node_data[key]+'">\
        </div>';
        // $('#node-edit').append( el )
      });
      updateSchema();
      checkProgress();
    })

    // Node Editor Save
    $('#node-edit').on("submit",function(e){
    e.preventDefault();
    var id = $("#update-service").data("id");
    var data = $(this).serializeFormJSON();

    s.graph.nodes(id).label = data.service_name

    // console.log(s.graph.nodes(id));
    Object.keys(data).forEach(function(k){
      // Flush the old edges and create the new ones
      if (k == "connects") {
        // Clear Out
        for ( var x = 0; x < s.graph.nodes().length; x++ ) {
          var target_id = s.graph.nodes()[x].id;
          if (s.graph.edges("edge-"+id+"-"+target_id) !== undefined) {
            s.graph.dropEdge("edge-"+id+"-"+target_id)
          }
        }
        if (typeof data[k] == 'string') data[k] = [data[k]];
        for ( var x = 0; x < data[k].length; x++ ) {
          console.log("Linking "+id+" to "+data[k][x]);
          if (data[k][x] != "") {
            s.graph.addEdge({
              id: 'edge-'+id+'-'+data[k][x],
              source: id,
              target: data[k][x],
              size: 10,
              color: '#774BA2',
              type: ['line', 'curve', 'arrow', 'curvedArrow'][Math.random() * 4 | 0]
            })
          }
        }
      }

      if (k == "resources[]") {
        s.graph.nodes(id).data.config['resources'] = data[k];
        delete data[k];
      }

      if (k == "template") {
        s.graph.nodes(id).data.config['template'] = data[k];
        delete data[k];
      }

      s.graph.nodes(id).data[k] = data[k];
      // console.log(k + ' - ' + data[k]);
      updateSchema();
    });

    // $('#project_settings').text( JSON.stringify(data, null, 2) )
    // $('#project_logo_placeholder').attr('src', data.logo)
    //
    // if (data.name && data.website && data.logo && data.api_key && data.site && data.env) {
    //   $('#page-1-next').removeClass("d-none")
    // }
    // $(".env-name").text(data.env);
    console.log(s.graph.nodes(id));
    s.refresh();
    checkProgress();
  });
  }

  var components = {
    "website" : {
      "template_name": "website",
      "template_type": "web",
      "service_id" : "",
      "service_name" : "new_website",
      "service_port" : "8001",
      "build_app" : "website",
      "build_path" : "website_ui",
      "config": {
        "template":"bank",
        "resources":[]
      },
      "connects": []
    },
    "api" : {
      "template_name": "simple_api",
      "template_type": "web",
      "service_id" : "",
      "service_name" : "new_api",
      "service_port" : "8002",
      "build_app" : "simple_api",
      "build_path" : "app",
      "config": {
        "resources":["url0", "url1", "ulr2", "url3"]
      },
      "connects": []
    },
    "auth_service" : {
      "template_name": "auth_service",
      "template_type": "web",
      "service_id" : "",
      "service_name" : "new_auth_service",
      "service_port" : "8003",
      "build_app" : "auth_service",
      "build_path" : "app",
      "config": {
        "resources":["login", "forgot_password", "auth", "logout"]
      },
      "connects": []
    },
    "mongo_service" : {
      "template_name": "simple_mongo",
      "template_type": "web",
      "service_id" : "",
      "service_name" : "new_mongo_service",
      "service_port" : "8004",
      "build_app" : "simple_mongo",
      "build_path" : "app",
      "config": {
        "resources":[]
      },
      "connects": []
    }
  }
  // Generate UUID
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Add node
  $('.service-list .new button').click(function(e) {
    var create_this = $(this).parent().data('component');
    var uuid = uuidv4();

    var component = JSON.parse(JSON.stringify(components[create_this]));
    component.service_id = uuid;
    component.service_name = create_this;

    var img = Math.random() >= 0.7;

    s.graph.addNode({
      label: create_this,
      id: uuid,
      data: component,
      type: 'image',
      url: "images/icon-"+component.template_name+".png",
      // Display attributes:
      x: Math.random(),
      y: Math.random(),
      size: 2,
      color: '#666'
    });
    s.refresh();
    updateSchema();
    checkProgress();
    // console.log("Added node with ID "+uuid+" and data ID "+component.service_id);
  });

  var pre_built_schema = {
    "bank": [
      {
        "template_name": "auth_service",
        "template_type": "web",
        "service_id": "2a09d44c-d4c7-4fc9-89bd-fd47164ddee2",
        "service_name": "auth_service",
        "service_port": "8003",
        "build_app": "auth_service",
        "build_path": "app",
        "config": {
          "resources": [
            "login",
            "forgot_password",
            "auth",
            "logout"
          ]
        },
        "connects": []
      },
      {
        "template_name": "simple_mongo",
        "template_type": "web",
        "service_id": "6270cfca-a041-433f-a1b2-034c403d0dae",
        "service_name": "fraud_analytics",
        "service_port": "8004",
        "build_app": "simple_mongo",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "url2",
            "url3"
          ]
        },
        "connects": [
          ""
        ]
      },
      {
        "template_name": "website",
        "template_type": "web",
        "service_id": "ac98d14c-a562-47b3-9c6f-af7c972c3690",
        "service_name": "website",
        "service_port": "8001",
        "build_app": "website",
        "build_path": "website_ui",
        "config": {
          "template": "bank",
          "resources": [
            "url0",
            "url1",
            "url2",
            "url3"
          ]
        },
        "connects": [
          "7ae50b37-41b5-432e-97c9-573e419f9892"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "7ae50b37-41b5-432e-97c9-573e419f9892",
        "service_name": "web_gateway",
        "service_port": "8002",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "2a09d44c-d4c7-4fc9-89bd-fd47164ddee2",
          "0e1deb5d-ecf3-4a3c-aa97-db7f2b8e0d0a"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "3948ce48-d782-4801-b044-470291fd97f8",
        "service_name": "loans",
        "service_port": "8005",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "e3296e4f-ef04-4ebf-b859-12bd1d3507ae"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "da9cb5cc-0f04-4f01-8068-b1ebf84ea110",
        "service_name": "savings",
        "service_port": "8006",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "e3296e4f-ef04-4ebf-b859-12bd1d3507ae"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "378f04a1-919a-4c80-820e-0c897abb6944",
        "service_name": "mortgages",
        "service_port": "8007",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "e3296e4f-ef04-4ebf-b859-12bd1d3507ae"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "0e1deb5d-ecf3-4a3c-aa97-db7f2b8e0d0a",
        "service_name": "accounts",
        "service_port": "8008",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "3948ce48-d782-4801-b044-470291fd97f8",
          "da9cb5cc-0f04-4f01-8068-b1ebf84ea110",
          "378f04a1-919a-4c80-820e-0c897abb6944",
          "22676609-dbb1-444d-b2ca-42e93f036d5c"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "22676609-dbb1-444d-b2ca-42e93f036d5c",
        "service_name": "credit",
        "service_port": "8009",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "e3296e4f-ef04-4ebf-b859-12bd1d3507ae"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "e3296e4f-ef04-4ebf-b859-12bd1d3507ae",
        "service_name": "transactions",
        "service_port": "8010",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "6270cfca-a041-433f-a1b2-034c403d0dae",
          "0e1deb5d-ecf3-4a3c-aa97-db7f2b8e0d0a"
        ]
      },
      {
        "template_name": "simple_api",
        "template_type": "web",
        "service_id": "c95a67a9-2997-4121-ae6b-4fb835bd8889",
        "service_name": "payment_service",
        "service_port": "8011",
        "build_app": "simple_api",
        "build_path": "app",
        "config": {
          "resources": [
            "url0",
            "url1",
            "ulr2",
            "url3"
          ]
        },
        "connects": [
          "2a09d44c-d4c7-4fc9-89bd-fd47164ddee2",
          "e3296e4f-ef04-4ebf-b859-12bd1d3507ae"
        ]
      }
    ]
  }
  $('.service-list .clone button').click(function(e){
    var clone_this = $(this).parent().data('component');
    loadNodes(pre_built_schema[clone_this])
  })

  function loadNodes(new_schema){
    s.graph.clear()
    // Load nodes
    for (var n=0; n<new_schema.length; n++){
      s.graph.addNode({
        label: new_schema[n].service_name,
        id: new_schema[n].service_id,
        data: new_schema[n],
        type: 'image',
        url: "images/icon-"+new_schema[n].template_name+".png",
        // Display attributes:
        x: Math.random(),
        y: Math.random(),
        size: 2,
        color: '#666'
      });
    }
    // Load edges
    for (var n=0; n<new_schema.length; n++){
      var data = new_schema[n]
      Object.keys(new_schema[n]).forEach(function(k){
        // Flush the old edges and create the new ones
        if (k == "connects") {
          if (typeof data[k] == 'string') data[k] = [data[k]];
          for ( var x = 0; x < new_schema[n][k].length; x++ ) {
            console.log("Linking "+new_schema[n].service_id+" to "+new_schema[n][k][x]);
            if (new_schema[n][k][x] != "") {
              s.graph.addEdge({
                id: 'edge-'+new_schema[n].service_id+'-'+new_schema[n][k][x],
                source: new_schema[n].service_id,
                target: new_schema[n][k][x],
                size: 10,
                color: '#774BA2',
                type: ['line', 'curve', 'arrow', 'curvedArrow'][Math.random() * 4 | 0]
              })
            }
          }
        }
        // console.log(k + ' - ' + data[k]);
        updateSchema();
      });
    }
    s.refresh();
    updateSchema();
    checkProgress();
  }

  // Page 3
  function startPage3(){
    // Initiate the schema
    $.ajax({
      type: "POST",
      url: "/",
      data: schema,
      success: function(a,b){
        $("#terminal").append('<p>'+a+'</p>')
      }
      // dataType: dataType
    });

    // Set the services list
    var list = '';
    for (var a=0; a < schema.services.length; a++){
      console.log(schema.services[a]);
      list += '<tr scope="row">';
      list += '<td><img src="images/icon-'+schema.services[a].template_name+'.png" width="24"></td>';
      list += '<td>'+schema.services[a].service_name+'</td>';
      list += '<td>'+schema.services[a].template_type+'</td>';
      list += '<td>'+schema.services[a].service_port+'</td>';
      list += '<td class="d-flex justify-content-around">';
      list += '<span class="text-danger check-service icon icon-close btn btn-sm" data-port="'+schema.services[a].service_port+'" data-name="'+schema.services[a].service_name+'"></span>';
      list += '<a href="http://localhost:'+schema.services[a].service_port+'/" target="_blank" class="btn btn-light btn-sm border mr-3">';
      list += '<span class="text-secondary icon icon-home"></span>';
      list += '</a>';
      list += '<a href="http://localhost:'+schema.services[a].service_port+'/info" target="_blank" class="btn btn-light btn-sm border">';
      list += '<span class="text-secondary icon icon-eye"></span>';
      list += '</a>';
      list += '</td>';
      list += '</tr>';
    }
    $("#service-list").html(list);
  }

  $("#clearSchema").on("click", function(e){
    e.preventDefault()
    schema.services = []
    s.graph.clear()
    s.refresh()
    updateSchema()
    checkProgress()
  })

  $("#build-switch").on("click", function(e){
    e.preventDefault()
    $.ajax({
      type: "POST",
      url: "/run",
      success: function(a,b){
        $("#terminal").append('<p>'+a+'</p>')
      }
    });
    trackServices('build')
  })

  $("#kill-switch").on("click", function(){
    $.ajax({
      type: "POST",
      url: "/kill",
      success: function(a,b){
        $("#terminal").append('<p>'+a+'</p>')
        $(".check-service").each(function(i){
          $(this).removeClass('stop')
        })
      }
    });
    trackServices('kill')
  });

  $("#simulate").on("click", function(){
    $.ajax({
      type: "POST",
      url: "/simulate",
      success: function(a,b){
        $("#terminal").append('<p>'+a+'</p>')
      }
    });
  });

  function trackServices(action){
    // Check cycle the services
    var interval = setInterval(function(){
      $(".check-service").each(function(i){
        var port = $(this).data("port");
        var name = $(this).data("name");
        var el = $(this)
        if (!el.hasClass('stop')){
          $.ajax({
            url: "http://localhost:"+port,
            crossDomain: true,
            success: function(){
              el.removeClass("icon-close text-danger").addClass("icon-check text-success")
              if (action == 'build') {
                el.addClass('stop')
                $("#terminal").append('<p>Service '+name+' is online</p>')
              }
            },
            error: function(){
                // $("#terminal").append('<p>Service '+name+' is offline</p>')
              el.removeClass("icon-check text-success").addClass("icon-close text-danger")
              if (action == 'kill') {
                el.addClass('stop')
                $("#terminal").append('<p>Service '+name+' is offline</p>')
              }
            }
          });
        }
      })
    }, 2000);
    setTimeout(function(){
      clearInterval(interval);
    }, 120000 );
  }

}())
