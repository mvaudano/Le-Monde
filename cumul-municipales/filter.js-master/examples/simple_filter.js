var fJS;
jQuery(document).ready(function($) {

  // $('#price_filter').val('0-500');
  // $("#price_slider").slider({
  //   range:true,
  //   min: 0,
  //   max: 600,
  //   values:[100, 500],
  //   step: 5,
  //   slide: function(event, ui) {
  //     $("#price_range_label").html('$' + ui.values[ 0 ] + ' - $' + ui.values[ 1 ] );
  //     $('#price_filter').val(ui.values[0] + '-' + ui.values[1]).trigger('change');
  //   }   
  // });

  // $('#status :checkbox').prop('checked', true);



  $(function() {

      fJS = filterInit();
 

        /* Première initialisation du filtre "à blanc" pour déclencher les autres évènements */
        $("#search_box").val("");
        fJS.filter();


        /* Script de détection des "hashs" (dièses) dans l'url http://oshyn.com/_blog/General/post/JavaScript_Navigation_using_Hash_Change/ */

              //set up hash detection 
              $(window).bind( 'hashchange', function(e) {
               var hash = '';
               var hashlenght = 0;
               hashwith = '';
               // if (location.hash == ''){
               //  location.hash = '#pages=index';
               // }
               
               hash = location.hash;

               hashlenght = hash.length;
               hash = location.hash.substring(1, hashlenght);
                 if(hash != ''){
                    $("#search_box").val(hash);
                    fJS.filter();
                 }
               });
               
               $(window).trigger( 'hashchange' );
               
               // $(".overlays .item img").each(function(){
               // $(this).click(function(){
               //  close_overlay();
               // });
               // });
               
              });
               
              //function to change hash
              function change_hash(aux){
               location.hash = '#'+aux;
              }

      /* Fin du hash detection script */


});

function filterInit() {

  // var template = Mustache.compile($.trim($("#template").html()));

  var view = function(service){
    googleMap.addMarker(service);

    if(service.situation == "cumul") { situation = "Risque de cumul"; }
    if(service.situation == "incertain") { situation = "Risque potentiel de cumul"; }
    if(service.sexe == "Mme") { 
      feminisation = "candidate";
      if(service.mandatparl == "Député") { service.mandatparl = "députée" }
      if(service.mandatparl == "Sénateur") { service.mandatparl = "sénatrice" }
      if(service.mandatparl == "Eurodéputé") { service.mandatparl = "surodéputée" }
    }
    else { 
      feminisation = "candidat";
    }
    service.mandats = service.mandats.replace(/\*/g, ' &middot; ');
    
    return "<div class=\"box_personne\"><div class=\"situation "+service.situation+"\">"+ situation + "</div><p class=\"candidat\"><span class=\"prenom\">"+ service.prenom + "</span> <span class=\"nom\">"+service.nom +"</span></p><p class=\"parti\">("+ service.mandatparl.toLowerCase() + " "+ service.parti +")</p></p><p class=\"ville\">est "+ feminisation + " à "+ service.ville +" (<a href=\""+ service.lien +"\" target=\"_blank\">source</a>)</p><hr><p class=\"mandats\">Ses mandats actuels :</p><p class=\"mandats2\">"+ service.mandats +"</p><div class=\"clear\"></div></div>";
       
  };

  var filter_callbacks = {
    after_filter: function(result){
            if(result.length > 1) { 
              pluriel = "résultats" 
            } else { pluriel = "résultat"}
            if(result.length == services.length) { // Si la recherche est trop large pour filtrer les résultats
              $('#result_count').html("ex : <a class=\"filter_by_link\" href=\"#\" data-value=\"Paris\" data-target=\"#search_box\">Paris</a>, <a class=\"filter_by_link\" href=\"#\" data-value=\"Lyon\" data-target=\"#search_box\">Lyon</a>, <a class=\"filter_by_link\" href=\"#\" data-value=\"Marseille\" data-target='#search_box'>Marseille</a>...")
            }
            else { // Si la recherche donne des résultats
               $('#result_count').text(result.length + ' '+pluriel);
            }
            if(result.length == 0) { // Si il n'y a pas de réponses
                $('#notule').html("<p>Nous n'avons référencé aucun candidat potentiellement cumulard correspondant à votre recherche.</p><p>&raquo; <a href=\"https://docs.google.com/forms/d/1bP6TX_7o9K74irt2tuo7x8wjGjHLcEJkr7w55uyvJJU/viewform\" target=\"_blank\">Signaler un oubli ou une erreur</p>");
                googleMap.reCentrer();

             }
           else { 
            $('#notule').html("<p>&raquo; <a href=\"https://docs.google.com/forms/d/1bP6TX_7o9K74irt2tuo7x8wjGjHLcEJkr7w55uyvJJU/viewform\" target=\"_blank\">Signaler un oubli ou une erreur</p>");
            $('#partagesocial').html("<p>Partagez cette recherche sur Facebook ou Twitter</p><p><a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-via=\"lemondefr\" data-lang=\"fr\" data-hashtags=\"municipales\">Tweeter</a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>");
            }
     
      googleMap.updateMarkers(result);

      $.each(result, function(i, id){ // Ajout du recentrage au clic sur un résultat de la liste
        identifiant = '#fjs_'+id;
        // ide = id-1;
          $(identifiant).click( function() {
            ide = id-1;
                  
            $("#search_box").val(services[ide].ville);
            fJS.filter();
          });
      });

    }
  };

  var settings = {
    // filter_criteria: {
    //   amount: ['#price_filter .TYPE.range', 'amount'],
    //   status: ['#status :checkbox', 'status']
    // },
    search: {input: '#search_box', search_in: '.prenom, .nom, .ville', min_length: 1 },
    // link_filter: ['input#search_box', 'value'],
    and_filter_on: false,
    callbacks: filter_callbacks, //Filter callback execute in filter init and each filtering event.
    id_field: 'id' //Default is id. This is only for usecase
  };

  $('.filter_by_link').click(function(e){
      e.preventDefault();
      $($(this).data('target')).val($(this).data('value'));
      fJS.filter();
  });


 googleMap.init();


  return FilterJS(services, "#service_list", view, settings);
};


var googleMap = {
        latlng: [48.86,2.34],
        zoom: 5,
        markers: {},
        map: null,
        

        init: function() {
                  var mapOptions = {
                    zoom: googleMap.zoom,
                    minZoom: 2,
                    center: new google.maps.LatLng(this.latlng[0], this.latlng[1]),
                    mapTypeControlOptions: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: false,
                    draggable: true,
                    panControl: false,
                    scrollwheel: true,
                    zoomControl: true,
                    // zoomControlOptions: {
                    //   style: google.maps.ZoomControlStyle.SMALL
                    // },
                    streetViewControl: false,
                    disableDoubleClickZoom: false,
                    styles: [
                      {
                      "elementType": "geometry",
                      "stylers": [
                        { "saturation": -50 }
                      ]
                      },{
                      "elementType": "labels",
                      "stylers": [
                        { "visibility": "on" }
                      ]
                      },{
                      "featureType": "water",
                      "stylers": [
                        { "saturation": 75 },
                        { "hue": "#004cff" }
                      ]
                      },{
                      "featureType": "road",
                      "elementType": "geometry",
                      "stylers": [
                        { "lightness": 80 }
                      ]
                      },{
                      }
                    ]
                  };
          this.map = new google.maps.Map(document.getElementById("map"),mapOptions);

          // for(var i=0;i<services.length;i++) {  
          //                 var marker = new google.maps.Marker({
          //                     position: new google.maps.LatLng(latit,longit),
          //                   map: map,
          //                   title: 'Hello World!'
          //                 });

          //       googleMap.addMarker(services,i);
          //  }

    },

    addMarker: function(service) {

                    longit = service['longitude'];
                    latit = service['latitude'];
                    ville = service['ville'];
                    nom = service['nom'];
                    prenom = service['prenom'];
                  
                    var marker = new google.maps.Marker({
                      position: new google.maps.LatLng(latit,longit),
                      map: this.map,
                      title: ville + " - " + prenom + ' ' + nom
                    });
                    

                    this.markers[service.id] = marker

                    google.maps.event.addListener(marker, 'click', function() {
                        $("#search_box").val(service.ville);
                        fJS.filter();
                      // that.infowindow.setContent(marker.info_window_content)
                      // that.infowindow.open(that.map,marker);
                    });

                    if(service.situation == "cumul") {
                      marker.setIcon(new google.maps.MarkerImage('img/rouge.png',new google.maps.Size(16,16),new google.maps.Point(0,0)));
                    }
                    else if(service.situation == "incertain") {
                      marker.setIcon(new google.maps.MarkerImage('img/orange.png',new google.maps.Size(16,16),new google.maps.Point(0,0)));
                    }
                    

                    // marker.info_window_content = cumulards.nom

                    // google.maps.event.addListener(marker, 'click', function() {
                    //   that.infowindow.setContent(marker.info_window_content)
                    //   that.infowindow.open(map,marker);
                    // });

                    // if (infowindow) infowindow.close();
                    // infowindow = new google.maps.InfoWindow({content: cumulards[i]['ville']});

                    //   google.maps.event.addListener(marker, 'click', function() {
                    //     /* infowindow.close();*/
                    //     infowindow.open(map,marker);
                    //   });
                    
                        /*infowindow.open(map, marker);*/

                    /*var infowindow = new google.maps.InfoWindow({
                        content: ville
                    });*/

                   

                    // google.maps.event.addListener(marker,'click',function() {
                    //   $("#notices").html(ville);
                    // });


                    return marker;
      },

      updateMarkers: function(filtering_result){
        
                      var google_map = this;
                      
                      this.map.setZoom(googleMap.zoom);
                      
                      $.each(google_map.markers, function(){ 
                        this.setMap(null); })
                      $.each(filtering_result, function(i, id){

                        google_map.markers[id].setMap(google_map.map);
                      });

                      if(filtering_result.length) {
                          if(filtering_result.length == services.length) { // Si le champ de recherche est vide
                            google_map.reCentrer(); }
                          else { 
                            google_map.setCenterPoint(); 

                          }
                      }




                   
                      

                      // console.log(google_map.markers)

                      // for(var i=0;i<filtering_result.length;i++) {  
                      //     // var marker = new google.maps.Marker({
                      //     //     position: new google.maps.LatLng(latit,longit),
                      //     //   map: map,
                      //     //   title: 'Hello World!'
                      //     // });

                      //       // googleMap.addMarker(filtering_result,i);

                      //      ide = filtering_result[i]
                      //      longit = services[ide]['longitude'];
                      //     latit = services[ide]['latitude'];

                      //       var marker = new google.maps.Marker({
                      //         position: new google.maps.LatLng(latit,longit),
                      //         map: this.map
                      //        });
                      //       return marker;
                      //  }
                      

                      

                      //Set map center
                      // if(filtering_result.length) this.setCenterPoint();
      },

      setCenterPoint: function(){
        var lat = 0, lng = 0; count = 0;

        //Calculate approximate center point.
        for(id in this.markers){
          var m = this.markers[id];

          if(m.map){
            lat += m.getPosition().lat();
            lng += m.getPosition().lng();
            count++;
          }
        }
        

        if(count > 0){
          if(count == 1) { 
            this.map.setZoom(9);
            // this.map.styles[0]["stylers"][0]["visibility"] = "on";
           } else { this.map.setZoom(googleMap.zoom) }
          this.map.setCenter(new google.maps.LatLng(lat/count,lng/count));
        }
      },

      reCentrer: function(){
        this.map.setCenter(new google.maps.LatLng(googleMap.latlng[0],googleMap.latlng[1]));

      }


  }
